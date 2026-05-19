"""
FeedbackIQ API — AI-powered customer feedback intelligence platform.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import get_settings
from app.database.init_db import init_database, seed_database
from app.middleware.logging_middleware import LoggingMiddleware
from app.routes import api_router
from app.utils.exception_handlers import register_exception_handlers

settings = get_settings()

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: init DB, seed data, load FAISS index."""
    logger.info("Starting %s", settings.app_name)
    init_database()
    seed_database()
    from app.services.faiss_service import faiss_service

    faiss_service.load()
    yield
    logger.info("Shutting down %s", settings.app_name)


def create_app() -> FastAPI:
    """Application factory."""
    app = FastAPI(
        title=settings.app_name,
        description=(
            "Backend for FeedbackIQ — sentiment analysis, semantic search, "
            "and analytics APIs for customer feedback intelligence."
        ),
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(LoggingMiddleware)

    register_exception_handlers(app)
    app.include_router(api_router, prefix=settings.api_prefix)

    @app.get("/", tags=["Health"], summary="Root health check")
    def root() -> dict:
        return {"status": "ok", "docs": "/docs"}

    return app


app = create_app()
