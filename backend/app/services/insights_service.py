"""AI insights preparation for future RAG integration."""

from __future__ import annotations

from collections import Counter
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.feedback import FeedbackEntry
from app.schemas.dashboard import InsightOut
from app.services.embedding_service import encode_texts
from app.utils.helpers import feedback_to_api


class InsightsService:
    """
    Extensible insights layer.

    Provides summarization helpers, context retrieval, and trend aggregation
    without coupling to a specific LLM provider.
    """

    def generate_insights(self, db: Session, limit: int = 3) -> list[InsightOut]:
        """Rule-based insights from recent feedback patterns."""
        since = datetime.now(timezone.utc) - timedelta(days=7)
        recent = list(
            db.scalars(
                select(FeedbackEntry)
                .where(FeedbackEntry.timestamp >= since)
                .order_by(FeedbackEntry.timestamp.desc())
                .limit(200)
            ).all()
        )

        if not recent:
            return [
                InsightOut(
                    id="i-0",
                    title="No recent feedback",
                    summary="Upload feedback to start generating AI insights.",
                    impact="low",
                    createdAt=datetime.now(timezone.utc),
                )
            ]

        categories = Counter(f.category for f in recent if f.sentiment == "negative")
        top_cat, top_count = categories.most_common(1)[0] if categories else ("General", 0)

        neg_rate = sum(1 for f in recent if f.sentiment == "negative") / len(recent)
        high_urgency = sum(1 for f in recent if f.urgency_score >= 0.65)

        insights = [
            InsightOut(
                id="i-1",
                title=f"{top_cat} complaints trending",
                summary=(
                    f"{top_count} negative {top_cat.lower()} mentions in the last 7 days. "
                    f"Negative rate: {neg_rate:.0%}. Review root causes and response playbooks."
                ),
                impact="high" if top_count >= 3 else "medium",
                createdAt=datetime.now(timezone.utc),
            ),
            InsightOut(
                id="i-2",
                title="Churn risk signals detected",
                summary=(
                    f"{high_urgency} feedback items flagged high urgency. "
                    "Prioritize outreach for enterprise accounts with billing or API complaints."
                ),
                impact="high" if high_urgency >= 2 else "medium",
                createdAt=datetime.now(timezone.utc),
            ),
        ]
        return insights[:limit]

    def summarize_feedback_batch(self, texts: list[str], max_chars: int = 500) -> str:
        """Extractive-style summary placeholder for RAG prep."""
        if not texts:
            return "No feedback available for summarization."
        combined = " ".join(texts[:20])
        if len(combined) <= max_chars:
            return combined
        return combined[: max_chars - 3] + "..."

    def retrieve_context(
        self, db: Session, query: str, feedback_ids: list[int], limit: int = 5
    ) -> list[dict]:
        """Retrieve feedback entries as RAG context chunks."""
        if not feedback_ids:
            entries = list(
                db.scalars(
                    select(FeedbackEntry).order_by(FeedbackEntry.timestamp.desc()).limit(limit)
                ).all()
            )
        else:
            entries = list(
                db.scalars(
                    select(FeedbackEntry).where(FeedbackEntry.id.in_(feedback_ids)).limit(limit)
                ).all()
            )
        return [feedback_to_api(e) for e in entries]

    def aggregate_trends(self, db: Session, days: int = 30) -> dict:
        """Aggregate sentiment and category trends."""
        since = datetime.now(timezone.utc) - timedelta(days=days)
        rows = db.execute(
            select(
                FeedbackEntry.sentiment,
                FeedbackEntry.category,
                func.count(FeedbackEntry.id),
            )
            .where(FeedbackEntry.timestamp >= since)
            .group_by(FeedbackEntry.sentiment, FeedbackEntry.category)
        ).all()
        return {
            "period_days": days,
            "breakdown": [
                {"sentiment": r[0], "category": r[1], "count": r[2]} for r in rows
            ],
        }

    def embed_for_rag(self, texts: list[str]) -> list[list[float]]:
        """Pre-compute embeddings for future vector RAG stores."""
        vectors = encode_texts(texts)
        return vectors.tolist()


insights_service = InsightsService()
