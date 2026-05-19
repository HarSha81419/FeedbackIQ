"""General helper utilities."""

import re
from datetime import datetime

from app.models.feedback import FeedbackEntry


def urgency_from_score(score: float) -> str:
    """Map numeric urgency score to categorical label."""
    if score >= 0.85:
        return "critical"
    if score >= 0.65:
        return "high"
    if score >= 0.4:
        return "medium"
    return "low"


def infer_category(text: str) -> str:
    """Simple keyword-based category inference."""
    lower = text.lower()
    rules = {
        "Billing": ["bill", "charge", "invoice", "refund", "payment"],
        "Technical": ["api", "bug", "crash", "error", "integration", "rate limit"],
        "Churn": ["cancel", "competitor", "switching", "churn"],
        "Support": ["support", "ticket", "response time", "agent"],
        "Product": ["feature", "dashboard", "export", "ui", "ux"],
        "Documentation": ["docs", "documentation", "webhook", "guide"],
    }
    for category, keywords in rules.items():
        if any(kw in lower for kw in keywords):
            return category
    return "General"


def compute_urgency_score(text: str, sentiment: str, confidence: float) -> float:
    """Heuristic urgency score from text and sentiment."""
    score = 0.25
    if sentiment == "negative":
        score += 0.35 * confidence
    urgent_words = ["urgent", "critical", "cancel", "lawsuit", "immediately", "asap"]
    if any(w in text.lower() for w in urgent_words):
        score += 0.25
    return min(round(score, 3), 1.0)


def slug_customer_id(name: str) -> str:
    """Generate a stable-ish customer id from name."""
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return f"c-{slug[:32]}" or "c-unknown"


def feedback_to_api(entry: FeedbackEntry) -> dict:
    """Serialize ORM feedback to frontend-compatible dict."""
    from app.utils.helpers import urgency_from_score  # avoid circular in schemas

    confidence = None
    if entry.sentiment_result:
        confidence = entry.sentiment_result.confidence
        if entry.sentiment == "negative":
            score = -abs(confidence)
        elif entry.sentiment == "positive":
            score = abs(confidence)
        else:
            score = 0.0
    else:
        score = None

    return {
        "id": f"fb-{entry.id}",
        "customerId": entry.customer_id or slug_customer_id(entry.customer_name),
        "customerName": entry.customer_name,
        "content": entry.feedback_text,
        "sentiment": entry.sentiment,
        "category": entry.category,
        "urgency": urgency_from_score(entry.urgency_score),
        "source": entry.source,
        "createdAt": entry.timestamp,
        "score": score,
    }
