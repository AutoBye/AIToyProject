import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import current_user
from app.core.config import settings
from app.core.database import get_session
from app.models.entities import AiMessage, Analysis, AnalysisKind, AnalysisStatus, ChatRole, TokenUsage, Upload, User
from app.schemas.analysis import AnalysisCreate, AnalysisResponse, ChatRequest
from app.services.files import read_text_file
from app.services.openai_client import ai_client
from app.services.prompts import CHAT_PROMPT, build_analysis_prompt

router = APIRouter()


def to_response(row: Analysis) -> AnalysisResponse:
    return AnalysisResponse(
        id=str(row.id),
        project_id=str(row.project_id),
        upload_id=str(row.upload_id),
        kind=row.kind.value,
        status=row.status.value,
        severity=row.severity,
        summary=row.summary,
        result=row.result,
        created_at=row.created_at,
    )


@router.post("/code", response_model=AnalysisResponse)
async def analyze_code(payload: AnalysisCreate, user: User = Depends(current_user), session: AsyncSession = Depends(get_session)) -> AnalysisResponse:
    return await run_analysis(payload.upload_id, "code", user, session)


@router.post("/log", response_model=AnalysisResponse)
async def analyze_log(payload: AnalysisCreate, user: User = Depends(current_user), session: AsyncSession = Depends(get_session)) -> AnalysisResponse:
    return await run_analysis(payload.upload_id, "log", user, session)


async def run_analysis(upload_id: str, kind: str, user: User, session: AsyncSession) -> AnalysisResponse:
    upload = await session.get(Upload, upload_id)
    if not upload or upload.user_id != user.id:
        raise HTTPException(status_code=404, detail="Upload not found")
    if upload.kind.value != kind:
        raise HTTPException(status_code=400, detail=f"Upload is not a {kind} file")

    analysis = Analysis(project_id=upload.project_id, upload_id=upload.id, user_id=user.id, kind=AnalysisKind(kind), status=AnalysisStatus.running, model=settings.openai_model)
    session.add(analysis)
    await session.commit()
    await session.refresh(analysis)

    try:
        prompt = build_analysis_prompt(kind, read_text_file(upload.storage_path))
        content, usage = await ai_client.complete("Return a concise but complete markdown report.", prompt)
        analysis.status = AnalysisStatus.completed
        analysis.summary = content.splitlines()[0][:500] if content else None
        analysis.result = {"markdown": content}
        analysis.completed_at = datetime.now(timezone.utc)
        session.add(TokenUsage(user_id=user.id, project_id=upload.project_id, analysis_id=analysis.id, model=settings.openai_model, **usage))
    except Exception as exc:
        analysis.status = AnalysisStatus.failed
        analysis.error_message = str(exc)
    await session.commit()
    await session.refresh(analysis)
    return to_response(analysis)


@router.get("/history", response_model=list[AnalysisResponse])
async def history(user: User = Depends(current_user), session: AsyncSession = Depends(get_session)) -> list[AnalysisResponse]:
    rows = (await session.scalars(select(Analysis).where(Analysis.user_id == user.id).order_by(desc(Analysis.created_at)).limit(50))).all()
    return [to_response(row) for row in rows]


@router.post("/chat/stream")
async def chat_stream(payload: ChatRequest, user: User = Depends(current_user), session: AsyncSession = Depends(get_session)) -> StreamingResponse:
    context = ""
    if payload.analysis_id:
        analysis = await session.get(Analysis, payload.analysis_id)
        if analysis and analysis.user_id == user.id:
            context = json.dumps(analysis.result)[:20000]
    session.add(AiMessage(project_id=payload.project_id, analysis_id=payload.analysis_id, user_id=user.id, role=ChatRole.user, content=payload.message))
    await session.commit()

    async def events():
        collected = []
        user_prompt = f"Context:\n{context}\n\nUser question:\n{payload.message}"
        async for chunk in ai_client.stream(CHAT_PROMPT, user_prompt):
            collected.append(chunk)
            yield f"data: {json.dumps({'delta': chunk})}\n\n"
        answer = "".join(collected)
        async with session.begin():
            session.add(AiMessage(project_id=payload.project_id, analysis_id=payload.analysis_id, user_id=user.id, role=ChatRole.assistant, content=answer))
        yield "data: [DONE]\n\n"

    return StreamingResponse(events(), media_type="text/event-stream")
