"""Feedback management and semantic search routes."""

from fastapi import APIRouter, File, Query, UploadFile, status

from app.core.deps import CurrentUser, DbSession
from app.schemas.common import PaginatedResponse
from app.schemas.feedback import FeedbackCreate, FeedbackOut
from app.services.feedback_service import feedback_service
from app.utils.helpers import feedback_to_api

router = APIRouter(prefix="/feedback", tags=["Feedback"])


@router.post(
    "",
    response_model=FeedbackOut,
    status_code=status.HTTP_201_CREATED,
    summary="Upload customer feedback manually",
)
def create_feedback(data: FeedbackCreate, db: DbSession, user: CurrentUser) -> FeedbackOut:
    entry = feedback_service.create_feedback(
        db,
        customer_name=data.customer_name,
        feedback_text=data.feedback_text,
        source=data.source,
        category=data.category,
        customer_id=data.customer_id,
    )
    return FeedbackOut(**feedback_to_api(entry))


@router.post(
    "/upload-csv",
    summary="Bulk upload feedback via CSV",
    description="CSV columns: customer_name, feedback_text, source (optional), category (optional)",
)
async def upload_csv(
    db: DbSession,
    user: CurrentUser,
    file: UploadFile = File(...),
) -> dict:
    content = await file.read()
    created = feedback_service.import_csv(db, content)
    return {"imported": len(created), "ids": [f"fb-{e.id}" for e in created]}


@router.get("", response_model=PaginatedResponse[FeedbackOut], summary="List feedback with filters")
def list_feedback(
    db: DbSession,
    user: CurrentUser,
    sentiment: str | None = Query(None),
    category: str | None = Query(None),
    date_from: str | None = Query(None, alias="dateFrom"),
    date_to: str | None = Query(None, alias="dateTo"),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100, alias="pageSize"),
) -> PaginatedResponse[FeedbackOut]:
    from datetime import datetime

    df = datetime.fromisoformat(date_from) if date_from else None
    dt = datetime.fromisoformat(date_to) if date_to else None

    items, total = feedback_service.list_feedback(
        db,
        sentiment=sentiment,
        category=category,
        date_from=df,
        date_to=dt,
        search=search,
        page=page,
        page_size=page_size,
    )
    return PaginatedResponse(
        items=[FeedbackOut(**feedback_to_api(i)) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{feedback_id}", response_model=FeedbackOut, summary="Get feedback by ID")
def get_feedback(feedback_id: int, db: DbSession, user: CurrentUser) -> FeedbackOut:
    entry = feedback_service.get_by_id(db, feedback_id)
    if not entry:
        from app.core.exceptions import NotFoundError

        raise NotFoundError("Feedback")
    return FeedbackOut(**feedback_to_api(entry))

