from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import current_user
from app.core.database import get_session
from app.models.entities import Project, Upload, UploadKind, User
from app.schemas.analysis import UploadResponse
from app.services.files import save_upload

router = APIRouter()


@router.post("", response_model=UploadResponse)
async def upload_file(
    project_id: str = Form(...),
    file: UploadFile = File(...),
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> UploadResponse:
    project = await session.get(Project, project_id)
    if not project or project.user_id != user.id:
        raise HTTPException(status_code=404, detail="Project not found")

    path, size, digest, kind = await save_upload(file, str(user.id), project_id)
    upload = Upload(
        project_id=project.id,
        user_id=user.id,
        file_name=file.filename or "upload",
        content_type=file.content_type,
        kind=UploadKind(kind),
        size_bytes=size,
        storage_path=path,
        sha256=digest,
    )
    session.add(upload)
    await session.commit()
    await session.refresh(upload)
    return UploadResponse(id=str(upload.id), project_id=str(upload.project_id), file_name=upload.file_name, kind=upload.kind.value, size_bytes=upload.size_bytes, sha256=upload.sha256)
