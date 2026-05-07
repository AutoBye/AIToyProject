from datetime import datetime
from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
    created_at: datetime


class DashboardResponse(BaseModel):
    projects: int
    analyses: int
    uploads: int
    tokens: int
    recent_analyses: list[dict]
