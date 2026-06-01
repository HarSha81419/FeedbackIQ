"""Database initialization and seed data."""

import logging

from sqlalchemy import select

from app.core.security import get_password_hash
from app.database.base import Base
from app.database.session import SessionLocal, engine, ensure_database_exists
from app.models import Alert, FeedbackEntry, User
from app.models.alert import AlertSeverity, AlertStatus
from app.models.user import UserRole
from app.services.faiss_service import faiss_service
from app.services.feedback_service import feedback_service

logger = logging.getLogger(__name__)

SEED_FEEDBACK = [
    {
        "customer_name": "Sarah Chen",
        "feedback_text": "Billing cycle is confusing — charged twice this month without clear invoice breakdown.",
        "source": "Email",
        "category": "Billing",
    },
    {
        "customer_name": "Marcus Webb",
        "feedback_text": "Love the new dashboard analytics. Export to CSV would make this perfect.",
        "source": "In-app",
        "category": "Product",
    },
    {
        "customer_name": "Elena Rodriguez",
        "feedback_text": "API rate limits hit during peak hours. Need enterprise tier or higher quotas.",
        "source": "Support",
        "category": "Technical",
    },
    {
        "customer_name": "James Okonkwo",
        "feedback_text": "Onboarding was smooth. Documentation for webhooks could be clearer.",
        "source": "Survey",
        "category": "Documentation",
    },
    {
        "customer_name": "Priya Sharma",
        "feedback_text": "Considering canceling — competitor offers better pricing for our team size.",
        "source": "Chat",
        "category": "Churn",
    },
]

SEED_ALERTS = [
    {
        "title": "Billing category spike",
        "description": "Increase in negative billing feedback detected",
        "severity": AlertSeverity.critical,
        "category": "Billing",
    },
    {
        "title": "API complaints trend",
        "description": "Technical feedback volume above 30-day average",
        "severity": AlertSeverity.medium,
        "category": "Technical",
        "status": AlertStatus.acknowledged,
    },
]


def init_database() -> None:
    """Create the target database and tables on startup."""
    ensure_database_exists()
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created")


def seed_database() -> None:
    """Insert sample users, feedback, and alerts if empty."""
    db = SessionLocal()
    try:
        if db.scalar(select(User).limit(1)):
            logger.info("Database already seeded, skipping")
            return

        admin = User(
            email="admin@feedbackiq.com",
            name="Admin User",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.admin,
        )
        analyst = User(
            email="analyst@feedbackiq.com",
            name="Jane Analyst",
            hashed_password=get_password_hash("analyst123"),
            role=UserRole.analyst,
        )
        db.add_all([admin, analyst])
        db.commit()

        for item in SEED_FEEDBACK:
            feedback_service.create_feedback(db, **item)

        for alert_data in SEED_ALERTS:
            db.add(Alert(**alert_data))
        db.commit()

        pairs = [
            (row[0], row[1])
            for row in db.execute(select(FeedbackEntry.id, FeedbackEntry.feedback_text)).all()
        ]
        faiss_service.rebuild_from_entries(pairs)

        logger.info("Seed data inserted successfully")
    finally:
        db.close()
