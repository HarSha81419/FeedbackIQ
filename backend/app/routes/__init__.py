"""API route registration."""

from fastapi import APIRouter

from app.routes import analytics, auth, feedback, health, search

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(feedback.router)
api_router.include_router(search.router)
api_router.include_router(analytics.router)
