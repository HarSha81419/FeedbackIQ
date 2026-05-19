"""Sentence-transformer embedding service."""

from __future__ import annotations

import logging
from typing import Any

import numpy as np

from app.config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_model: Any = None


def get_embedding_model() -> Any:
    """Lazy-load sentence-transformers model."""
    global _model
    if _model is not None:
        return _model

    if settings.mock_ai:
        logger.info("MOCK_AI enabled — embedding model not loaded")
        return None

    try:
        from sentence_transformers import SentenceTransformer

        logger.info("Loading embedding model: %s", settings.embedding_model)
        _model = SentenceTransformer(settings.embedding_model)
        logger.info("Embedding model loaded")
    except Exception as exc:
        logger.warning("Failed to load embedding model: %s", exc)
        _model = None
    return _model


def encode_texts(texts: list[str]) -> np.ndarray:
    """Encode texts to normalized embedding vectors."""
    model = get_embedding_model()
    if model is None:
        return _mock_encode(texts)

    embeddings = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
    return np.array(embeddings, dtype=np.float32)


def encode_text(text: str) -> np.ndarray:
    """Encode a single text string."""
    return encode_texts([text])[0]


def _mock_encode(texts: list[str], dim: int = 384) -> np.ndarray:
    """Deterministic pseudo-embeddings for dev without ML deps."""
    vectors = []
    for text in texts:
        rng = np.random.default_rng(abs(hash(text)) % (2**32))
        vec = rng.standard_normal(dim).astype(np.float32)
        vec /= np.linalg.norm(vec) + 1e-9
        vectors.append(vec)
    return np.vstack(vectors)
