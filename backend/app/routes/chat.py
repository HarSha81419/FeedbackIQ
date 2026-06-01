from __future__ import annotations

import logging
from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse

from app.core.deps import CurrentUser, DbSession
from app.models.search import SearchHistory
from app.schemas.chat import ChatQuery, ChatResponse
from app.services.chat_service import chat_service

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Chat"])


@router.post(
    "/chat/query",
    response_model=ChatResponse,
    summary="RAG-powered chat over customer feedback",
)
async def chat_query(body: ChatQuery, db: DbSession, user: CurrentUser) -> ChatResponse:
    response = await chat_service.chat_query(db, body)
    try:
        db.add(SearchHistory(user_id=user.id, query=body.query, results_count=response.retrieved_count))
        db.commit()
    except Exception as exc:
        logger.debug("Failed to log chat search history: %s", exc)
        db.rollback()
    return response


@router.post(
    "/chat/query-stream",
    summary="Stream RAG-powered chat response",
)
async def chat_query_stream(body: ChatQuery, db: DbSession, user: CurrentUser) -> StreamingResponse:
    """Stream response tokens as they arrive from the LLM."""
    async def generate():
        async for token in chat_service.chat_query_stream(db, body):
            yield token

    try:
        db.add(SearchHistory(user_id=user.id, query=body.query, results_count=0))
        db.commit()
    except Exception as exc:
        logger.debug("Failed to log chat search history: %s", exc)
        db.rollback()

    return StreamingResponse(generate(), media_type="text/event-stream")
