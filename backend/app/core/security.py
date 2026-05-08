import hashlib
from datetime import datetime, timedelta, timezone
import bcrypt
from jose import jwt
from app.core.config import settings


PASSWORD_HASH_PREFIX = "bcrypt_sha256$"


def _normalize_password(password: str) -> bytes:
    # bcrypt는 입력을 72바이트까지만 처리하므로 먼저 SHA-256 digest로 고정 길이 정규화합니다.
    return hashlib.sha256(password.encode("utf-8")).digest()


def hash_password(password: str) -> str:
    hashed = bcrypt.hashpw(_normalize_password(password), bcrypt.gensalt())
    return f"{PASSWORD_HASH_PREFIX}{hashed.decode('utf-8')}"


def verify_password(password: str, hashed_password: str) -> bool:
    if not hashed_password.startswith(PASSWORD_HASH_PREFIX):
        return False
    stored_hash = hashed_password.removeprefix(PASSWORD_HASH_PREFIX).encode("utf-8")
    return bcrypt.checkpw(_normalize_password(password), stored_hash)


def create_access_token(subject: str) -> str:
    expires = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": subject, "exp": expires}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
