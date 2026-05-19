"""HuggingFace sentiment analysis service."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

from app.config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_pipeline: Any = None


@dataclass
class SentimentOutput:
    label: str
    confidence: float
    raw_label: str


def _map_label(raw: str, score: float) -> str:
    """Map model labels to positive/neutral/negative."""
    raw_upper = raw.upper()
    if "POS" in raw_upper:
        return "positive"
    if "NEG" in raw_upper:
        return "negative"
    if score > 0.75:
        return "positive" if "5" in raw or "4" in raw else "negative"
    return "neutral"


def get_sentiment_pipeline() -> Any:
    """Lazy-load the transformers sentiment pipeline."""
    global _pipeline
    if _pipeline is not None:
        return _pipeline

    if settings.mock_ai:
        logger.info("MOCK_AI enabled — sentiment pipeline not loaded")
        return None

    try:
        from transformers import pipeline

        logger.info("Loading sentiment model: %s", settings.sentiment_model)
        _pipeline = pipeline(
            "sentiment-analysis",
            model=settings.sentiment_model,
            truncation=True,
        )
        logger.info("Sentiment model loaded")
    except Exception as exc:
        logger.warning("Failed to load sentiment model, using heuristics: %s", exc)
        _pipeline = None
    return _pipeline


def analyze_sentiment(text: str) -> SentimentOutput:
    """
    Analyze sentiment of feedback text.

    Uses distilbert SST-2 when available; falls back to keyword heuristics.
    """
    pipe = get_sentiment_pipeline()

    if pipe is None:
        return _mock_sentiment(text)

    try:
        result = pipe(text[:512])[0]
        raw_label = str(result["label"])
        confidence = float(result["score"])
        label = _map_label(raw_label, confidence)
        if label == "neutral" and confidence < 0.6:
            label = "neutral"
        elif "POS" in raw_label.upper():
            label = "positive"
        elif "NEG" in raw_label.upper():
            label = "negative"
        return SentimentOutput(label=label, confidence=confidence, raw_label=raw_label)
    except Exception as exc:
        logger.error("Sentiment analysis failed: %s", exc)
        return _mock_sentiment(text)


def _mock_sentiment(text: str) -> SentimentOutput:
    """Lightweight heuristic when models are unavailable."""
    lower = text.lower()
    negative_words = ["bad", "terrible", "cancel", "hate", "broken", "awful", "frustrated"]
    positive_words = ["love", "great", "excellent", "amazing", "thank", "helpful", "perfect"]

    neg = sum(1 for w in negative_words if w in lower)
    pos = sum(1 for w in positive_words if w in lower)

    if neg > pos:
        return SentimentOutput("negative", min(0.6 + neg * 0.1, 0.95), "MOCK_NEGATIVE")
    if pos > neg:
        return SentimentOutput("positive", min(0.6 + pos * 0.1, 0.95), "MOCK_POSITIVE")
    return SentimentOutput("neutral", 0.55, "MOCK_NEUTRAL")
