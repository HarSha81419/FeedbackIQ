from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ChatHistoryItem(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatQuery(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    limit: int = Field(default=7, ge=1, le=20)
    category: str | None = None
    sentiment: Literal["positive", "neutral", "negative"] | None = None
    source: str | None = None
    date_from: datetime | None = None
    date_to: datetime | None = None
    history: list[ChatHistoryItem] | None = None


class MatchedFeedback(BaseModel):
    id: str
    customerId: str
    customerName: str
    content: str
    category: str
    sentiment: str
    source: str
    createdAt: datetime
    relevance: float


class ChatResponse(BaseModel):
    query: str
    answer: str
    sources: list[MatchedFeedback]
    matched_feedback: list[MatchedFeedback]
    retrieved_count: int
    query_time_ms: float
    model_time_ms: float
