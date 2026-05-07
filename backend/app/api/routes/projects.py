from fastapi import APIRouter, Depends
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import current_user
from app.core.database import get_session
from app.models.entities import Analysis, Project, TokenUsage, Upload, User
from app.schemas.project import DashboardResponse, ProjectCreate, ProjectResponse

router = APIRouter()


@router.post("", response_model=ProjectResponse)
async def create_project(payload: ProjectCreate, user: User = Depends(current_user), session: AsyncSession = Depends(get_session)) -> ProjectResponse:
    project = Project(user_id=user.id, name=payload.name, description=payload.description)
    session.add(project)
    await session.commit()
    await session.refresh(project)
    return ProjectResponse(id=str(project.id), name=project.name, description=project.description, created_at=project.created_at)


@router.get("", response_model=list[ProjectResponse])
async def list_projects(user: User = Depends(current_user), session: AsyncSession = Depends(get_session)) -> list[ProjectResponse]:
    rows = (await session.scalars(select(Project).where(Project.user_id == user.id).order_by(desc(Project.created_at)))).all()
    return [ProjectResponse(id=str(row.id), name=row.name, description=row.description, created_at=row.created_at) for row in rows]


@router.get("/dashboard", response_model=DashboardResponse)
async def dashboard(user: User = Depends(current_user), session: AsyncSession = Depends(get_session)) -> DashboardResponse:
    projects = await session.scalar(select(func.count()).select_from(Project).where(Project.user_id == user.id)) or 0
    analyses = await session.scalar(select(func.count()).select_from(Analysis).where(Analysis.user_id == user.id)) or 0
    uploads = await session.scalar(select(func.count()).select_from(Upload).where(Upload.user_id == user.id)) or 0
    tokens = await session.scalar(select(func.coalesce(func.sum(TokenUsage.total_tokens), 0)).where(TokenUsage.user_id == user.id)) or 0
    recent = (await session.scalars(select(Analysis).where(Analysis.user_id == user.id).order_by(desc(Analysis.created_at)).limit(8))).all()
    return DashboardResponse(
        projects=projects,
        analyses=analyses,
        uploads=uploads,
        tokens=tokens,
        recent_analyses=[
            {"id": str(row.id), "kind": row.kind.value, "status": row.status.value, "severity": row.severity, "created_at": row.created_at.isoformat()}
            for row in recent
        ],
    )
