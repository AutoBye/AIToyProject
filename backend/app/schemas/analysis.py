from datetime import datetime
from pydantic import BaseModel


class AnalysisCreate(BaseModel):
    upload_id: str


class AnalysisResponse(BaseModel):
    id: str
    project_id: str
    upload_id: str
    kind: str
    status: str
    severity: str | None = None
    summary: str | None = None
    result: dict
    error_message: str | None = None
    created_at: datetime


class ChatRequest(BaseModel):
    project_id: str
    analysis_id: str | None = None
    message: str


class ChatMessageResponse(BaseModel):
    id: str
    analysis_id: str | None = None
    project_id: str
    role: str
    content: str
    created_at: datetime


class UploadResponse(BaseModel):
    id: str
    project_id: str
    file_name: str
    kind: str
    size_bytes: int
    sha256: str


class TextUploadRequest(BaseModel):
    project_id: str
    kind: str
    content: str
