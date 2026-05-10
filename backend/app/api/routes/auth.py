from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import current_user
from app.core.config import settings
from app.core.database import get_session
from app.core.security import create_access_token, hash_password, verify_password
from app.models.entities import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse

router = APIRouter()

DEMO_EMAIL = "demo@example.com"
DEMO_PASSWORD = "password123"
DEMO_ENVIRONMENTS = {"local", "development", "demo"}


async def get_or_create_demo_user(payload: LoginRequest, session: AsyncSession) -> User | None:
    if settings.environment not in DEMO_ENVIRONMENTS:
        return None
    if payload.email != DEMO_EMAIL or payload.password != DEMO_PASSWORD:
        return None

    user = await session.scalar(select(User).where(User.email == DEMO_EMAIL))
    if user:
        if not verify_password(DEMO_PASSWORD, user.password_hash):
            user.password_hash = hash_password(DEMO_PASSWORD)
            await session.commit()
            await session.refresh(user)
        return user

    user = User(email=DEMO_EMAIL, password_hash=hash_password(DEMO_PASSWORD), full_name="Demo User")
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


@router.post("/register", response_model=TokenResponse)
async def register(payload: RegisterRequest, session: AsyncSession = Depends(get_session)) -> TokenResponse:
    exists = await session.scalar(select(User).where(User.email == payload.email))
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="이미 가입된 이메일입니다.")
    user = User(email=payload.email, password_hash=hash_password(payload.password), full_name=payload.full_name)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, session: AsyncSession = Depends(get_session)) -> TokenResponse:
    user = await session.scalar(select(User).where(User.email == payload.email))
    if not user:
        user = await get_or_create_demo_user(payload, session)
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="이메일 또는 비밀번호가 올바르지 않습니다.")
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(current_user)) -> UserResponse:
    return UserResponse(id=str(user.id), email=user.email, full_name=user.full_name)
