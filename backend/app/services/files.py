import hashlib
import time
from pathlib import Path
from fastapi import HTTPException, UploadFile, status
from app.core.config import settings


CODE_EXTENSIONS = {
    ".c",
    ".cc",
    ".cpp",
    ".cs",
    ".cxx",
    ".go",
    ".h",
    ".hpp",
    ".java",
    ".js",
    ".jsx",
    ".php",
    ".py",
    ".rb",
    ".rs",
    ".sql",
    ".ts",
    ".tsx",
}
LOG_EXTENSIONS = {".log", ".txt", ".out", ".err"}


# 확장자를 기준으로 분석 종류를 추론합니다. 지원하지 않는 파일은 업로드 단계에서 차단합니다.
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
    # 파일 내용 해시는 중복 업로드 감지, 캐싱, 감사 추적에 재사용할 수 있습니다.
    digest = hashlib.sha256(content).hexdigest()
    upload_root = Path(settings.upload_dir) / user_id / project_id
    upload_root.mkdir(parents=True, exist_ok=True)
    safe_name = Path(file.filename or "upload.txt").name
    path = upload_root / f"{digest[:16]}-{safe_name}"
    path.write_bytes(content)
    return str(path), len(content), digest, kind


def read_text_file(path: str) -> str:
    return Path(path).read_text(encoding="utf-8", errors="replace")


def remove_stored_upload(path: str) -> None:
    target = Path(path)
    upload_root = Path(settings.upload_dir).resolve()
    try:
        resolved = target.resolve()
    except OSError:
        return
    if upload_root not in resolved.parents and resolved != upload_root:
        return
    resolved.unlink(missing_ok=True)
    for parent in resolved.parents:
        if parent == upload_root:
            break
        try:
            parent.rmdir()
        except OSError:
            break


def save_text_upload(content: str, kind: str, user_id: str, project_id: str) -> tuple[str, int, str, str]:
    if kind not in {"code", "log"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="지원하지 않는 붙여넣기 유형입니다.")
    data = content.encode("utf-8")
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(data) > max_bytes:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="붙여넣은 내용이 너무 큽니다.")
    if not content.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="붙여넣을 내용을 입력해야 합니다.")

    digest = hashlib.sha256(data).hexdigest()
    upload_root = Path(settings.upload_dir) / user_id / project_id
    upload_root.mkdir(parents=True, exist_ok=True)
    extension = "txt" if kind == "log" else "code.txt"
    path = upload_root / f"{digest[:16]}-pasted-{int(time.time())}.{extension}"
    path.write_bytes(data)
    return str(path), len(data), digest, kind
