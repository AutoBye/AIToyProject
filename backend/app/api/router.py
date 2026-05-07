from fastapi import APIRouter
from app.api.routes import analysis, auth, projects, uploads

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["analysis"])
