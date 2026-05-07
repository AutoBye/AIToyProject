import enum
import uuid
from datetime import datetime
from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base


# 업로드 파일은 분석 프롬프트와 검증 로직이 다르기 때문에 코드/로그 타입을 명확히 분리합니다.
class UploadKind(str, enum.Enum):
    code = "code"
    log = "log"


# 분석 결과도 업로드 타입과 동일한 축으로 저장해 대시보드와 히스토리 필터링에 활용합니다.
class AnalysisKind(str, enum.Enum):
    code = "code"
    log = "log"


# 분석 작업 상태입니다. 현재는 동기 실행이지만, 큐 기반 비동기 처리로 확장해도 그대로 사용할 수 있습니다.
class AnalysisStatus(str, enum.Enum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"


class ChatRole(str, enum.Enum):
    user = "user"
    assistant = "assistant"
    system = "system"


# 인증의 루트 엔티티입니다. 비밀번호 원문은 저장하지 않고 bcrypt 해시만 저장합니다.
class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String)
    full_name: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# 프로젝트는 업로드, 분석, 채팅, 토큰 사용량을 묶는 사용자별 작업 공간입니다.
class Project(Base):
    __tablename__ = "projects"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# 업로드 메타데이터입니다. 실제 파일은 storage_path 위치에 저장하고 DB에는 추적 정보만 보관합니다.
class Upload(Base):
    __tablename__ = "uploads"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"))
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    file_name: Mapped[str] = mapped_column(String)
    content_type: Mapped[str | None] = mapped_column(String, nullable=True)
    kind: Mapped[UploadKind] = mapped_column(Enum(UploadKind, name="upload_kind"))
    size_bytes: Mapped[int] = mapped_column(BigInteger)
    storage_path: Mapped[str] = mapped_column(String)
    # 같은 파일의 반복 분석 여부를 판단하거나 캐시 키로 쓰기 위한 콘텐츠 지문입니다.
    sha256: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# AI 분석 실행 단위입니다. 업로드 파일 1개에 대해 코드 분석 또는 로그 분석 결과를 저장합니다.
class Analysis(Base):
    __tablename__ = "analyses"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"))
    upload_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("uploads.id", ondelete="CASCADE"))
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    kind: Mapped[AnalysisKind] = mapped_column(Enum(AnalysisKind, name="analysis_kind"))
    status: Mapped[AnalysisStatus] = mapped_column(Enum(AnalysisStatus, name="analysis_status"), default=AnalysisStatus.queued)
    severity: Mapped[str | None] = mapped_column(String, nullable=True)
    model: Mapped[str | None] = mapped_column(String, nullable=True)
    # 프롬프트가 바뀌어도 과거 결과를 해석할 수 있도록 버전을 함께 보관합니다.
    prompt_version: Mapped[str] = mapped_column(String, default="v1")
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    # 섹션별 결과, 마크다운 리포트, 향후 구조화 점수 등을 유연하게 담기 위해 JSONB를 사용합니다.
    result: Mapped[dict] = mapped_column(JSONB, default=dict)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


# 분석 결과를 바탕으로 이어지는 AI 채팅 메시지입니다. analysis_id가 없으면 프로젝트 일반 질문으로 처리됩니다.
class AiMessage(Base):
    __tablename__ = "ai_messages"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    analysis_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("analyses.id", ondelete="CASCADE"))
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"))
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    role: Mapped[ChatRole] = mapped_column(Enum(ChatRole, name="chat_role"))
    content: Mapped[str] = mapped_column(Text)
    token_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# OpenAI 사용량과 비용 추적용 테이블입니다. 사용자/프로젝트별 비용 대시보드의 원천 데이터가 됩니다.
class TokenUsage(Base):
    __tablename__ = "token_usage"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    project_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="SET NULL"))
    analysis_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("analyses.id", ondelete="SET NULL"))
    model: Mapped[str] = mapped_column(String)
    prompt_tokens: Mapped[int] = mapped_column(Integer, default=0)
    completion_tokens: Mapped[int] = mapped_column(Integer, default=0)
    total_tokens: Mapped[int] = mapped_column(Integer, default=0)
    estimated_cost_usd: Mapped[float] = mapped_column(Numeric(12, 6), default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
