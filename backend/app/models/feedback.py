"""Feedback and sentiment ORM models."""

import enum
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class SentimentLabel(str, enum.Enum):
    positive = "positive"
    neutral = "neutral"
    negative = "negative"


class FeedbackEntry(Base):
    """Customer feedback record with AI-enriched metadata."""

    __tablename__ = "feedback_entries"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    customer_name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    customer_id: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)
    feedback_text: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[str] = mapped_column(String(64), default="manual", nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True, nullable=False
    )
    sentiment: Mapped[str] = mapped_column(String(32), default="neutral", index=True)
    category: Mapped[str] = mapped_column(String(64), default="General", index=True)
    urgency_score: Mapped[float] = mapped_column(Float, default=0.3, nullable=False)
    faiss_index: Mapped[int | None] = mapped_column(Integer, nullable=True)

    sentiment_result: Mapped["SentimentResult | None"] = relationship(
        "SentimentResult", back_populates="feedback", uselist=False, cascade="all, delete-orphan"
    )


class SentimentResult(Base):
    """Detailed sentiment analysis output for a feedback entry."""

    __tablename__ = "sentiment_results"

    id: Mapped[int] = mapped_column(primary_key=True)
    feedback_id: Mapped[int] = mapped_column(
        ForeignKey("feedback_entries.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    label: Mapped[str] = mapped_column(String(32), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    raw_label: Mapped[str | None] = mapped_column(String(32), nullable=True)
    analyzed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    feedback: Mapped["FeedbackEntry"] = relationship("FeedbackEntry", back_populates="sentiment_result")
