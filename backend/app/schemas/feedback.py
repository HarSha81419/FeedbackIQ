"""Feedback-related schemas."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class FeedbackCreate(BaseModel):
    customer_name: str = Field(min_length=1, max_length=255)
    feedback_text: str = Field(min_length=1)
    source: str = Field(default="manual", max_length=64)
    category: str | None = Field(default=None, max_length=64)
    customer_id: str | None = None


class FeedbackOut(BaseModel):
    id: str
    customerId: str
    customerName: str
    content: str
    sentiment: Literal["positive", "neutral", "negative"]
    category: str
    urgency: Literal["low", "medium", "high", "critical"]
    source: str
    createdAt: datetime
    score: float | None = None

    model_config = {"from_attributes": True}


class SentimentAnalysisOut(BaseModel):
    label: str
    confidence: float
    raw_label: str | None = None


class SemanticSearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    limit: int = Field(default=10, ge=1, le=50)


class SemanticSearchResult(BaseModel):
    feedback: FeedbackOut
    relevance: float


class SemanticSearchResponse(BaseModel):
    query: str
    results: list[SemanticSearchResult]


class FeedbackFilterParams(BaseModel):
    sentiment: str | None = None
    category: str | None = None
    date_from: datetime | None = None
    date_to: datetime | None = None
    search: str | None = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=50, ge=1, le=100)
