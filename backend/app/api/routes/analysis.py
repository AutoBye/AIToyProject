import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from openai import RateLimitError
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import current_user
from app.core.config import settings
from app.core.database import get_session
from app.models.entities import AiMessage, Analysis, AnalysisKind, AnalysisStatus, ChatRole, TokenUsage, Upload, User
from app.schemas.analysis import AnalysisCreate, AnalysisResponse, ChatMessageResponse, ChatRequest
from app.services.files import read_text_file
from app.services.openai_client import ai_client
from app.services.prompts import CHAT_PROMPT, build_analysis_prompt

router = APIRouter()

KIND_LABELS = {"code": "코드", "log": "로그"}
GENERIC_SUMMARY_LABELS = {"개요", "요약", "문제점", "권장 수정 사항", "권장 조치", "근본 원인"}


def analysis_failure_message(exc: Exception) -> str:
    if isinstance(exc, RateLimitError) or getattr(exc, "status_code", None) == 429:
        return "OpenAI API 요청 한도를 초과했습니다. 잠시 후 다시 시도하거나 결제/사용량 한도를 확인하세요."
    return "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도하세요."


def clean_summary_line(line: str) -> str:
    line = line.strip().strip("`").replace("**", "")
    while line.startswith("#"):
        line = line[1:].strip()
    for marker in ("- ", "* "):
        if line.startswith(marker):
            line = line[len(marker):].strip()
    if len(line) > 3 and line[0].isdigit() and line[1] in {".", ")"}:
        line = line[2:].strip()
    return line


def summary_from_markdown(content: str) -> str | None:
    in_code_block = False
    for raw_line in content.splitlines():
        line = raw_line.strip()
        if line.startswith("```"):
            in_code_block = not in_code_block
            continue
        if in_code_block:
            continue
        cleaned = clean_summary_line(line)
        if not cleaned or cleaned in GENERIC_SUMMARY_LABELS:
            continue
        if len(cleaned) < 8:
            continue
        return cleaned[:500]
    return None


# ORM 엔티티를 API 응답 스키마로 변환해 라우트마다 반복되는 직렬화 코드를 줄입니다.
def to_response(row: Analysis, upload_file_name: str | None = None) -> AnalysisResponse:
    return AnalysisResponse(
        id=str(row.id),
        project_id=str(row.project_id),
        upload_id=str(row.upload_id),
        upload_file_name=upload_file_name,
        kind=row.kind.value,
        status=row.status.value,
        severity=row.severity,
        summary=row.summary,
        result=row.result,
        error_message=row.error_message,
        created_at=row.created_at,
    )


@router.post("/code", response_model=AnalysisResponse)
async def analyze_code(payload: AnalysisCreate, user: User = Depends(current_user), session: AsyncSession = Depends(get_session)) -> AnalysisResponse:
    return await run_analysis(payload.upload_id, "code", user, session)


@router.post("/log", response_model=AnalysisResponse)
async def analyze_log(payload: AnalysisCreate, user: User = Depends(current_user), session: AsyncSession = Depends(get_session)) -> AnalysisResponse:
    return await run_analysis(payload.upload_id, "log", user, session)


async def run_analysis(upload_id: str, kind: str, user: User, session: AsyncSession) -> AnalysisResponse:
    # 업로드 소유권과 타입을 먼저 검증해 다른 사용자의 파일 접근과 잘못된 분석 실행을 막습니다.
    upload = await session.get(Upload, upload_id)
    if not upload or upload.user_id != user.id:
        raise HTTPException(status_code=404, detail="업로드 파일을 찾을 수 없습니다.")
    if upload.kind.value != kind:
        expected = KIND_LABELS.get(kind, kind)
        actual = KIND_LABELS.get(upload.kind.value, upload.kind.value)
        raise HTTPException(status_code=400, detail=f"선택한 파일은 {expected} 파일이 아닙니다. 현재 파일 유형은 {actual}입니다.")

    # 실행 시작 시점에 분석 레코드를 먼저 저장해 실패하더라도 히스토리에서 추적할 수 있게 합니다.
    analysis = Analysis(project_id=upload.project_id, upload_id=upload.id, user_id=user.id, kind=AnalysisKind(kind), status=AnalysisStatus.running, model=settings.openai_model)
    session.add(analysis)
    await session.commit()
    await session.refresh(analysis)

    try:
        # 파일 내용을 프롬프트 템플릿에 주입하고 OpenAI 응답을 마크다운 리포트로 저장합니다.
        prompt = build_analysis_prompt(kind, read_text_file(upload.storage_path))
        content, usage = await ai_client.complete(
            "한국어로 간결하지만 완성도 있는 Markdown 분석 리포트를 작성하세요.",
            prompt,
        )
        analysis.status = AnalysisStatus.completed
        analysis.summary = summary_from_markdown(content) if content else None
        analysis.result = {"markdown": content}
        analysis.completed_at = datetime.now(timezone.utc)
        # 모델 사용량은 비용 최적화와 사용자별 사용량 제한의 기준 데이터입니다.
        session.add(TokenUsage(user_id=user.id, project_id=upload.project_id, analysis_id=analysis.id, model=settings.openai_model, **usage))
    except Exception as exc:
        message = analysis_failure_message(exc)
        analysis.status = AnalysisStatus.failed
        analysis.summary = message
        analysis.error_message = message
        analysis.result = {"markdown": f"## 분석 실패\n\n{message}\n\n원인: {type(exc).__name__}"}
        analysis.completed_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(analysis)
    return to_response(analysis, upload.file_name)


@router.get("/history", response_model=list[AnalysisResponse])
async def history(
    project_id: str | None = Query(default=None),
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> list[AnalysisResponse]:
    query = select(Analysis, Upload.file_name).join(Upload, Upload.id == Analysis.upload_id).where(Analysis.user_id == user.id)
    if project_id:
        query = query.where(Analysis.project_id == project_id)
    rows = (await session.execute(query.order_by(desc(Analysis.created_at)).limit(50))).all()
    return [to_response(row, upload_file_name) for row, upload_file_name in rows]


@router.get("/chat/history", response_model=list[ChatMessageResponse])
async def chat_history(
    project_id: str = Query(...),
    analysis_id: str | None = Query(default=None),
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> list[ChatMessageResponse]:
    query = select(AiMessage).where(AiMessage.user_id == user.id, AiMessage.project_id == project_id)
    if analysis_id:
        query = query.where(AiMessage.analysis_id == analysis_id)
    rows = (await session.scalars(query.order_by(AiMessage.created_at.asc()).limit(100))).all()
    return [
        ChatMessageResponse(
            id=str(row.id),
            analysis_id=str(row.analysis_id) if row.analysis_id else None,
            project_id=str(row.project_id),
            role=row.role.value,
            content=row.content,
            created_at=row.created_at,
        )
        for row in rows
    ]


@router.post("/chat/stream")
async def chat_stream(payload: ChatRequest, user: User = Depends(current_user), session: AsyncSession = Depends(get_session)) -> StreamingResponse:
    context = ""
    if payload.analysis_id:
        # 특정 분석에 대한 질문이면 기존 결과를 컨텍스트로 넣어 답변 품질을 높입니다.
        analysis = await session.get(Analysis, payload.analysis_id)
        if analysis and analysis.user_id == user.id:
            context = json.dumps(analysis.result)[:20000]
    session.add(AiMessage(project_id=payload.project_id, analysis_id=payload.analysis_id, user_id=user.id, role=ChatRole.user, content=payload.message))
    await session.commit()

    async def events():
        collected = []
        user_prompt = f"Context:\n{context}\n\nUser question:\n{payload.message}"
        # SSE 형식으로 토큰 조각을 즉시 내려보내 프론트엔드가 실시간 응답처럼 렌더링할 수 있습니다.
        async for chunk in ai_client.stream(CHAT_PROMPT, user_prompt):
            collected.append(chunk)
            yield f"data: {json.dumps({'delta': chunk})}\n\n"
        answer = "".join(collected)
        # 스트리밍 완료 후 전체 답변을 저장해 이후 대화 히스토리와 감사 추적에 사용할 수 있게 합니다.
        async with session.begin():
            session.add(AiMessage(project_id=payload.project_id, analysis_id=payload.analysis_id, user_id=user.id, role=ChatRole.assistant, content=answer))
        yield "data: [DONE]\n\n"

    return StreamingResponse(events(), media_type="text/event-stream")
