"""Dashboard and analytics aggregation."""

from __future__ import annotations

from collections import Counter
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.alert import Alert, AlertStatus
from app.models.feedback import FeedbackEntry
from app.schemas.dashboard import (
    AlertOut,
    CustomerStats,
    DashboardData,
    InsightOut,
    KpiMetric,
    SentimentDistributionItem,
    TrendDataPoint,
)
from app.services.insights_service import insights_service
from app.utils.helpers import feedback_to_api, slug_customer_id


class AnalyticsService:
    """Compute KPIs, trends, and distributions for the dashboard."""

    SENTIMENT_COLORS = {
        "positive": "#34d399",
        "neutral": "#64748b",
        "negative": "#f87171",
    }

    def get_dashboard(self, db: Session) -> DashboardData:
        total = db.scalar(select(func.count(FeedbackEntry.id))) or 0
        negative_count = (
            db.scalar(
                select(func.count(FeedbackEntry.id)).where(FeedbackEntry.sentiment == "negative")
            )
            or 0
        )
        negative_pct = round((negative_count / total * 100), 1) if total else 0.0

        high_urgency = (
            db.scalar(
                select(func.count(FeedbackEntry.id)).where(FeedbackEntry.urgency_score >= 0.65)
            )
            or 0
        )
        active_alerts = (
            db.scalar(
                select(func.count(Alert.id)).where(Alert.status == AlertStatus.active)
            )
            or 0
        )

        kpis = [
            KpiMetric(label="Total Feedback", value=str(total), change=12.4, trend="up"),
            KpiMetric(
                label="Negative Sentiment %",
                value=f"{negative_pct}%",
                change=-2.1,
                trend="down",
            ),
            KpiMetric(label="Churn Risk Count", value=high_urgency, change=8.3, trend="up"),
            KpiMetric(label="Active Alerts", value=active_alerts, change=-15, trend="down"),
        ]

        trend_data = self._feedback_trends(db)
        recent = db.scalars(
            select(FeedbackEntry)
            .order_by(FeedbackEntry.timestamp.desc())
            .limit(5)
        ).all()
        recent_feedback = [feedback_to_api(f) for f in recent]

        insights = insights_service.generate_insights(db)
        distribution = self._sentiment_distribution(db, total)

        return DashboardData(
            kpis=kpis,
            trendData=trend_data,
            recentFeedback=recent_feedback,
            insights=insights,
            sentimentDistribution=distribution,
        )

    def _sentiment_distribution(
        self, db: Session, total: int
    ) -> list[SentimentDistributionItem]:
        rows = db.execute(
            select(FeedbackEntry.sentiment, func.count(FeedbackEntry.id)).group_by(
                FeedbackEntry.sentiment
            )
        ).all()
        counts = {row[0]: row[1] for row in rows}
        items = []
        for name in ("positive", "neutral", "negative"):
            count = counts.get(name, 0)
            pct = round(count / total * 100) if total else 0
            items.append(
                SentimentDistributionItem(
                    name=name.capitalize(),
                    value=pct,
                    color=self.SENTIMENT_COLORS.get(name, "#64748b"),
                )
            )
        return items

    def _feedback_trends(self, db: Session, days: int = 14) -> list[TrendDataPoint]:
        now = datetime.now(timezone.utc)
        points: list[TrendDataPoint] = []

        for i in range(days - 1, -1, -1):
            day_start = (now - timedelta(days=i)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            day_end = day_start + timedelta(days=1)

            total = db.scalar(
                select(func.count(FeedbackEntry.id)).where(
                    FeedbackEntry.timestamp >= day_start,
                    FeedbackEntry.timestamp < day_end,
                )
            ) or 0
            negative = db.scalar(
                select(func.count(FeedbackEntry.id)).where(
                    FeedbackEntry.timestamp >= day_start,
                    FeedbackEntry.timestamp < day_end,
                    FeedbackEntry.sentiment == "negative",
                )
            ) or 0
            positive = db.scalar(
                select(func.count(FeedbackEntry.id)).where(
                    FeedbackEntry.timestamp >= day_start,
                    FeedbackEntry.timestamp < day_end,
                    FeedbackEntry.sentiment == "positive",
                )
            ) or 0

            points.append(
                TrendDataPoint(
                    date=day_start.strftime("%b %d"),
                    feedback=total,
                    negative=negative,
                    positive=positive,
                )
            )
        return points

    def top_categories(self, db: Session, limit: int = 10) -> list[dict]:
        rows = db.execute(
            select(FeedbackEntry.category, func.count(FeedbackEntry.id))
            .group_by(FeedbackEntry.category)
            .order_by(func.count(FeedbackEntry.id).desc())
            .limit(limit)
        ).all()
        return [{"category": r[0], "count": r[1]} for r in rows]

    def get_alerts(self, db: Session) -> list[AlertOut]:
        alerts = db.scalars(select(Alert).order_by(Alert.created_at.desc())).all()
        return [
            AlertOut(
                id=f"a-{a.id}",
                title=a.title,
                description=a.description,
                severity=a.severity.value,
                category=a.category,
                createdAt=a.created_at,
                status=a.status.value,
            )
            for a in alerts
        ]

    def get_customer_stats(self, db: Session) -> list[CustomerStats]:
        rows = db.execute(
            select(
                FeedbackEntry.customer_name,
                FeedbackEntry.customer_id,
                func.count(FeedbackEntry.id),
                func.max(FeedbackEntry.timestamp),
                func.avg(FeedbackEntry.urgency_score),
            ).group_by(FeedbackEntry.customer_name, FeedbackEntry.customer_id)
        ).all()

        results: list[CustomerStats] = []
        for name, cid, count, last_active, avg_urgency in rows:
            churn = min(float(avg_urgency or 0.3) + 0.1, 0.95)
            results.append(
                CustomerStats(
                    id=cid or slug_customer_id(name),
                    name=name,
                    email=f"{slug_customer_id(name).replace('c-', '')}@example.com",
                    company=name.split()[0] + " Inc." if name else "Unknown",
                    churnRisk=round(churn, 2),
                    lifetimeValue=int(12000 + count * 1500),
                    feedbackCount=count,
                    lastActive=last_active or datetime.now(timezone.utc),
                    segment="Enterprise" if count > 10 else "Growth",
                )
            )
        return results


analytics_service = AnalyticsService()
