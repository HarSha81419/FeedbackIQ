"""Health check routes."""

from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health", summary="Service health check")
def health_check() -> dict:
    return {"status": "healthy", "service": "FeedbackIQ API"}
