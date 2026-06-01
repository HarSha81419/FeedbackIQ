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
    description=(
        "CSV columns: customer_id or customer_name, feedback_text or feedback, "
        "source (optional), timestamp (optional), category (optional)"
    ),
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


@router.delete("/{feedback_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a single feedback entry")
def delete_feedback(feedback_id: int, db: DbSession, user: CurrentUser) -> None:
    feedback_service.delete_feedback(db, feedback_id)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT, summary="Delete all feedback entries (clear dataset)")
def delete_all_feedback(db: DbSession, user: CurrentUser) -> None:
    feedback_service.delete_all_feedback(db)
    from app.services.faiss_service import faiss_service

    faiss_service.clear()


@router.post("/replace-dataset", summary="Replace entire dataset with new CSV")
async def replace_dataset(
    db: DbSession,
    user: CurrentUser,
    file: UploadFile = File(...),
) -> dict:
    feedback_service.delete_all_feedback(db)
    from app.services.faiss_service import faiss_service

    faiss_service.clear()
    content = await file.read()
    created = feedback_service.import_csv(db, content)

    pairs = [
        (row[0], row[1])
        for row in db.execute(
            "SELECT id, feedback_text FROM feedback_entries"
        ).all()
    ]
    faiss_service.rebuild_from_entries(pairs)
    return {"imported": len(created), "ids": [f"fb-{e.id}" for e in created]}


@router.get("/stats", summary="Get dataset statistics")
def get_dataset_stats(db: DbSession, user: CurrentUser) -> dict:
    from sqlalchemy import func, select

    from app.models.feedback import FeedbackEntry

    total = db.scalar(select(func.count(FeedbackEntry.id))) or 0

    sentiment_dist = db.execute(
        select(
            FeedbackEntry.sentiment,
            func.count(FeedbackEntry.id),
        ).group_by(FeedbackEntry.sentiment)
    ).all()

    category_dist = db.execute(
        select(
            FeedbackEntry.category,
            func.count(FeedbackEntry.id),
        ).group_by(FeedbackEntry.category)
    ).all()

    return {
        "total_feedback": total,
        "sentiment_distribution": {row[0]: row[1] for row in sentiment_dist},
        "category_distribution": {row[0]: row[1] for row in category_dist},
    }

