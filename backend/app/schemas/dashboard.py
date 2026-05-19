"""Dashboard analytics schemas (frontend-compatible)."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class KpiMetric(BaseModel):
    label: str
    value: str | int | float
    change: float | None = None
    trend: Literal["up", "down", "neutral"] | None = None


class TrendDataPoint(BaseModel):
    date: str
    feedback: int
    negative: int
    positive: int


class InsightOut(BaseModel):
    id: str
    title: str
    summary: str
    impact: Literal["high", "medium", "low"]
    createdAt: datetime


class SentimentDistributionItem(BaseModel):
    name: str
    value: int
    color: str


class DashboardData(BaseModel):
    kpis: list[KpiMetric]
    trendData: list[TrendDataPoint]
    recentFeedback: list  # FeedbackOut at runtime
    insights: list[InsightOut]
    sentimentDistribution: list[SentimentDistributionItem]


class AlertOut(BaseModel):
    id: str
    title: str
    description: str
    severity: Literal["low", "medium", "high", "critical"]
    category: str
    createdAt: datetime
    status: Literal["active", "resolved", "acknowledged"]

    model_config = {"from_attributes": True}


class CustomerStats(BaseModel):
    id: str
    name: str
    email: str
    company: str
    churnRisk: float
    lifetimeValue: int
    feedbackCount: int
    lastActive: datetime
    segment: str
