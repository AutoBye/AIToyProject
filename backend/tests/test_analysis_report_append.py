import uuid
from datetime import datetime, timezone

import pytest
from fastapi import HTTPException

from app.api.routes.analysis import append_chat_answer_to_report
from app.models.entities import Analysis, AnalysisKind, AnalysisStatus, Upload, UploadKind, User
from app.schemas.analysis import ReportAppendRequest


class FakeSession:
    def __init__(self, records: dict[tuple[type, uuid.UUID | str], object]):
        self.records = records
        self.commits = 0
        self.refreshes = 0

    async def get(self, model: type, item_id: uuid.UUID | str):
        return self.records.get((model, item_id)) or self.records.get((model, str(item_id)))

    async def commit(self):
        self.commits += 1

    async def refresh(self, _row):
        self.refreshes += 1


def make_user(user_id: uuid.UUID | None = None) -> User:
    return User(
        id=user_id or uuid.uuid4(),
        email="owner@example.com",
        password_hash="bcrypt_sha256$test",
    )


def make_upload(user: User, project_id: uuid.UUID, upload_id: uuid.UUID) -> Upload:
    return Upload(
        id=upload_id,
        project_id=project_id,
        user_id=user.id,
        file_name="sample.js",
        content_type="text/plain",
        kind=UploadKind.code,
        size_bytes=42,
        storage_path="/tmp/sample.js",
        sha256="abc123",
    )


def make_analysis(user: User, project_id: uuid.UUID, upload_id: uuid.UUID, markdown: str) -> Analysis:
    return Analysis(
        id=uuid.uuid4(),
        project_id=project_id,
        upload_id=upload_id,
        user_id=user.id,
        kind=AnalysisKind.code,
        status=AnalysisStatus.completed,
        result={"markdown": markdown},
        created_at=datetime.now(timezone.utc),
    )


@pytest.mark.asyncio
async def test_append_chat_answer_to_report_updates_markdown():
    user = make_user()
    project_id = uuid.uuid4()
    upload_id = uuid.uuid4()
    upload = make_upload(user, project_id, upload_id)
    analysis = make_analysis(user, project_id, upload_id, "# 개요\n\n- 기존 분석")
    session = FakeSession({(Analysis, str(analysis.id)): analysis, (Upload, upload_id): upload})

    response = await append_chat_answer_to_report(
        str(analysis.id),
        ReportAppendRequest(content="- SQL injection 위험을 parameterized query로 수정해야 합니다."),
        user,
        session,
    )

    markdown = response.result["markdown"]
    assert "AI Assistant Applied Notes" in markdown
    assert "SQL injection 위험" in markdown
    assert response.upload_file_name == "sample.js"
    assert session.commits == 1
    assert session.refreshes == 1


@pytest.mark.asyncio
async def test_append_chat_answer_to_report_does_not_duplicate_same_answer():
    user = make_user()
    project_id = uuid.uuid4()
    upload_id = uuid.uuid4()
    answer = "- 이미 반영된 개선 제안입니다."
    upload = make_upload(user, project_id, upload_id)
    analysis = make_analysis(user, project_id, upload_id, f"# 개요\n\n---\n\n## AI Assistant Applied Notes\n\n{answer}")
    session = FakeSession({(Analysis, str(analysis.id)): analysis, (Upload, upload_id): upload})

    response = await append_chat_answer_to_report(
        str(analysis.id),
        ReportAppendRequest(content=answer),
        user,
        session,
    )

    assert response.result["markdown"].count(answer) == 1


@pytest.mark.asyncio
async def test_append_chat_answer_to_report_rejects_other_users_analysis():
    owner = make_user()
    attacker = make_user()
    project_id = uuid.uuid4()
    upload_id = uuid.uuid4()
    analysis = make_analysis(owner, project_id, upload_id, "# 개요\n\n- 기존 분석")
    session = FakeSession({(Analysis, str(analysis.id)): analysis})

    with pytest.raises(HTTPException) as exc:
        await append_chat_answer_to_report(
            str(analysis.id),
            ReportAppendRequest(content="- 다른 사용자가 반영하려는 내용"),
            attacker,
            session,
        )

    assert exc.value.status_code == 404
