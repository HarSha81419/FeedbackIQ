"""Feedback CRUD and processing pipeline."""

from __future__ import annotations

import csv
import io
from datetime import datetime

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.feedback import FeedbackEntry, SentimentResult
from app.services.faiss_service import faiss_service
from app.services.sentiment_service import analyze_sentiment
from app.utils.helpers import compute_urgency_score, infer_category, slug_customer_id


class FeedbackService:
    """Business logic for feedback ingestion and retrieval."""

    def create_feedback(
        self,
        db: Session,
        *,
        customer_name: str,
        feedback_text: str,
        source: str = "manual",
        category: str | None = None,
        customer_id: str | None = None,
    ) -> FeedbackEntry:
        """Create feedback, run sentiment analysis, and index for search."""
        sentiment = analyze_sentiment(feedback_text)
        cat = category or infer_category(feedback_text)
        urgency = compute_urgency_score(feedback_text, sentiment.label, sentiment.confidence)

        entry = FeedbackEntry(
            customer_name=customer_name,
            customer_id=customer_id or slug_customer_id(customer_name),
            feedback_text=feedback_text,
            source=source,
            sentiment=sentiment.label,
            category=cat,
            urgency_score=urgency,
        )
        db.add(entry)
        db.flush()

        db.add(
            SentimentResult(
                feedback_id=entry.id,
                label=sentiment.label,
                confidence=sentiment.confidence,
                raw_label=sentiment.raw_label,
            )
        )
        db.commit()
        db.refresh(entry)

        pos = faiss_service.add_feedback(entry.id, feedback_text)
        entry.faiss_index = pos
        db.commit()
        db.refresh(entry)
        return entry

    def list_feedback(
        self,
        db: Session,
        *,
        sentiment: str | None = None,
        category: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        search: str | None = None,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[FeedbackEntry], int]:
        """List feedback with optional filters."""
        q = select(FeedbackEntry).options(joinedload(FeedbackEntry.sentiment_result))

        if sentiment and sentiment != "all":
            q = q.where(FeedbackEntry.sentiment == sentiment)
        if category:
            q = q.where(func.lower(FeedbackEntry.category) == category.lower())
        if date_from:
            q = q.where(FeedbackEntry.timestamp >= date_from)
        if date_to:
            q = q.where(FeedbackEntry.timestamp <= date_to)
        if search:
            pattern = f"%{search}%"
            q = q.where(
                or_(
                    FeedbackEntry.feedback_text.ilike(pattern),
                    FeedbackEntry.customer_name.ilike(pattern),
                    FeedbackEntry.category.ilike(pattern),
                )
            )

        count_q = select(func.count()).select_from(q.subquery())
        total = db.scalar(count_q) or 0

        q = q.order_by(FeedbackEntry.timestamp.desc())
        q = q.offset((page - 1) * page_size).limit(page_size)
        items = list(db.scalars(q).unique().all())
        return items, total

    def get_by_id(self, db: Session, feedback_id: int) -> FeedbackEntry | None:
        return db.scalar(
            select(FeedbackEntry)
            .options(joinedload(FeedbackEntry.sentiment_result))
            .where(FeedbackEntry.id == feedback_id)
        )

    def import_csv(self, db: Session, file_content: bytes) -> list[FeedbackEntry]:
        """Import feedback rows from CSV (customer_name, feedback_text, source, category)."""
        text = file_content.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(text))
        created: list[FeedbackEntry] = []

        for row in reader:
            name = row.get("customer_name") or row.get("customer") or row.get("name")
            content = row.get("feedback_text") or row.get("feedback") or row.get("content")
            if not name or not content:
                continue
            entry = self.create_feedback(
                db,
                customer_name=name.strip(),
                feedback_text=content.strip(),
                source=(row.get("source") or "csv").strip(),
                category=row.get("category"),
            )
            created.append(entry)
        return created


feedback_service = FeedbackService()
