import hashlib
from pathlib import Path
from fastapi import HTTPException, UploadFile, status
from app.core.config import settings


CODE_EXTENSIONS = {".py", ".ts", ".tsx", ".js", ".jsx", ".go", ".java", ".cs", ".php", ".rb", ".rs", ".sql"}
LOG_EXTENSIONS = {".log", ".txt", ".out", ".err"}


def infer_kind(filename: str) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix in LOG_EXTENSIONS:
        return "log"
    if suffix in CODE_EXTENSIONS:
        return "code"
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file type")


async def save_upload(file: UploadFile, user_id: str, project_id: str) -> tuple[str, int, str, str]:
    content = await file.read()
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File too large")

    kind = infer_kind(file.filename or "")
    digest = hashlib.sha256(content).hexdigest()
    upload_root = Path(settings.upload_dir) / user_id / project_id
    upload_root.mkdir(parents=True, exist_ok=True)
    safe_name = Path(file.filename or "upload.txt").name
    path = upload_root / f"{digest[:16]}-{safe_name}"
    path.write_bytes(content)
    return str(path), len(content), digest, kind


def read_text_file(path: str) -> str:
    return Path(path).read_text(encoding="utf-8", errors="replace")
