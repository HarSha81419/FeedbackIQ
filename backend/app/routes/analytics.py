"""Dashboard analytics routes."""

from fastapi import APIRouter

from app.core.deps import CurrentUser, DbSession
from app.schemas.dashboard import AlertOut, CustomerStats, DashboardData
from app.services.analytics_service import analytics_service
from app.services.insights_service import insights_service

router = APIRouter(tags=["Analytics"])


@router.get(
    "/dashboard",
    response_model=DashboardData,
    summary="Dashboard KPIs, trends, and insights",
)
def get_dashboard(db: DbSession, user: CurrentUser) -> DashboardData:
    return analytics_service.get_dashboard(db)


@router.get("/analytics/sentiment-distribution", summary="Sentiment distribution breakdown")
def sentiment_distribution(db: DbSession, user: CurrentUser) -> dict:
    data = analytics_service.get_dashboard(db)
    return {"distribution": data.sentimentDistribution}


@router.get("/analytics/trends", summary="Feedback volume trends")
def feedback_trends(db: DbSession, user: CurrentUser) -> dict:
    return {"trendData": analytics_service._feedback_trends(db)}


@router.get("/analytics/categories", summary="Top complaint categories")
def top_categories(db: DbSession, user: CurrentUser) -> dict:
    return {"categories": analytics_service.top_categories(db)}


@router.get("/alerts", response_model=list[AlertOut], summary="Active and recent alerts")
def list_alerts(db: DbSession, user: CurrentUser) -> list[AlertOut]:
    return analytics_service.get_alerts(db)


@router.get("/customers", response_model=list[CustomerStats], summary="Customer statistics")
def customer_stats(db: DbSession, user: CurrentUser) -> list[CustomerStats]:
    return analytics_service.get_customer_stats(db)


@router.get("/insights/trends", summary="Aggregated trend data for RAG prep")
def insight_trends(db: DbSession, user: CurrentUser, days: int = 30) -> dict:
    return insights_service.aggregate_trends(db, days=days)
