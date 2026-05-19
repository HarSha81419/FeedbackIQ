"""Semantic search routes (top-level paths for frontend compatibility)."""

from fastapi import APIRouter, Query

from app.core.deps import CurrentUser, DbSession
from app.models.search import SearchHistory
from app.schemas.feedback import (
    FeedbackOut,
    SemanticSearchRequest,
    SemanticSearchResponse,
    SemanticSearchResult,
)
from app.services.feedback_service import feedback_service
from app.services.faiss_service import faiss_service
from app.utils.helpers import feedback_to_api

router = APIRouter(tags=["Semantic Search"])


@router.post(
    "/semantic-search",
    response_model=SemanticSearchResponse,
    summary="Semantic search across all feedback",
)
def semantic_search(body: SemanticSearchRequest, db: DbSession, user: CurrentUser) -> SemanticSearchResponse:
    matches = faiss_service.search(body.query, limit=body.limit)
    results: list[SemanticSearchResult] = []

    for fid, score in matches:
        entry = feedback_service.get_by_id(db, fid)
        if entry:
            results.append(
                SemanticSearchResult(
                    feedback=FeedbackOut(**feedback_to_api(entry)),
                    relevance=round(score, 4),
                )
            )

    db.add(SearchHistory(user_id=user.id, query=body.query, results_count=len(results)))
    db.commit()
    return SemanticSearchResponse(query=body.query, results=results)


@router.get(
    "/similar-feedback/{feedback_id}",
    response_model=list[SemanticSearchResult],
    summary="Get semantically similar complaints",
)
def similar_feedback(
    feedback_id: int,
    db: DbSession,
    user: CurrentUser,
    limit: int = Query(10, ge=1, le=50),
) -> list[SemanticSearchResult]:
    entry = feedback_service.get_by_id(db, feedback_id)
    if not entry:
        from app.core.exceptions import NotFoundError

        raise NotFoundError("Feedback")

    matches = faiss_service.search(entry.feedback_text, limit=limit + 1)
    results: list[SemanticSearchResult] = []
    for fid, score in matches:
        if fid == feedback_id:
            continue
        similar = feedback_service.get_by_id(db, fid)
        if similar:
            results.append(
                SemanticSearchResult(
                    feedback=FeedbackOut(**feedback_to_api(similar)),
                    relevance=round(score, 4),
                )
            )
        if len(results) >= limit:
            break
    return results
