from __future__ import annotations

import logging
import re
import time
from dataclasses import dataclass
from functools import lru_cache
from typing import Any, AsyncIterator

import numpy as np
import httpx

from app.config.settings import get_settings
from app.schemas.chat import ChatQuery, ChatResponse, MatchedFeedback
from app.services.embedding_service import encode_text
from app.services.faiss_service import faiss_service
from app.services.feedback_service import feedback_service
from app.services.ollama_service import ollama_service
from app.utils.helpers import feedback_to_api

logger = logging.getLogger(__name__)
settings = get_settings()

TOP_K_RESULTS = 10
MIN_K_RESULTS = 8


class SimpleTTLCache:
    def __init__(self, ttl: int = 300):
        self.ttl = ttl
        self._store: dict[str, tuple[float, Any]] = {}

    def get(self, key: str) -> Any | None:
        item = self._store.get(key)
        if not item:
            return None
        timestamp, payload = item
        if time.time() - timestamp > self.ttl:
            del self._store[key]
            return None
        return payload

    def set(self, key: str, payload: Any) -> None:
        self._store[key] = (time.time(), payload)


@dataclass
class ChatService:
    cache: SimpleTTLCache = SimpleTTLCache(ttl=300)

    @staticmethod
    @lru_cache(maxsize=256)
    def _cached_embedding(query: str) -> tuple[float, ...]:
        vector = encode_text(query).astype(np.float32)
        return tuple(float(x) for x in vector.tolist())

    def _cache_key(self, body: ChatQuery) -> str:
        return '|'.join(
            [
                body.query.strip().lower(),
                body.category or '',
                body.sentiment or '',
                body.source or '',
                body.date_from.isoformat() if body.date_from else '',
                body.date_to.isoformat() if body.date_to else '',
                str(body.limit),
            ]
        )

    @staticmethod
    def _format_feedback(entry: Any, score: float) -> MatchedFeedback:
        api_data = feedback_to_api(entry)
        return MatchedFeedback(**{**api_data, 'relevance': round(score, 4)})

    def _search_feedback(self, db: Any, body: ChatQuery) -> list[tuple[Any, float]]:
        embedding = np.array(self._cached_embedding(body.query), dtype=np.float32)
        search_limit = min(max(body.limit, MIN_K_RESULTS), TOP_K_RESULTS)
        candidate_limit = max(search_limit * 2, 20)
        raw_results = faiss_service.search_embeddings(embedding, limit=candidate_limit)

        filtered: list[tuple[Any, float]] = []
        seen_texts: set[str] = set()

        for fid, score in raw_results:
            entry = feedback_service.get_by_id(db, fid)
            if not entry:
                continue

            feedback_text = (entry.feedback_text or '').strip()
            if not feedback_text:
                continue

            normalized_text = feedback_text.lower()
            if normalized_text in seen_texts:
                continue
            seen_texts.add(normalized_text)

            if body.category and entry.category.lower() != body.category.lower():
                continue
            if body.sentiment and entry.sentiment.lower() != body.sentiment.lower():
                continue
            if body.source and entry.source.lower() != body.source.lower():
                continue
            if body.date_from and entry.timestamp < body.date_from:
                continue
            if body.date_to and entry.timestamp > body.date_to:
                continue

            filtered.append((entry, score))
            if len(filtered) >= search_limit:
                break

        logger.debug(
            "Search results: requested=%s, retrieved=%s, raw_candidates=%s",
            search_limit,
            len(filtered),
            len(raw_results),
        )
        return filtered

    async def chat_query(self, db: Any, body: ChatQuery) -> ChatResponse:
        """Generate a conversational response using Ollama RAG."""
        start = time.perf_counter()
        matches = self._search_feedback(db, body)
        query_time = round((time.perf_counter() - start) * 1000.0, 2)
        fallback_triggered = False

        if not matches:
            logger.debug("No relevant feedback found for query: %s", body.query)
            fallback_triggered = True
            answer = "I could not find enough relevant customer feedback to answer confidently."
            model_time = 0.0
            response = ChatResponse(
                query=body.query,
                answer=answer,
                sources=[],
                matched_feedback=[],
                retrieved_count=0,
                query_time_ms=query_time,
                model_time_ms=model_time,
            )
            self.cache.set(self._cache_key(body), response)
            logger.debug("Fallback triggered: %s", fallback_triggered)
            return response

        feedback_dicts = [
            {
                "content": entry.feedback_text,
                "sentiment": entry.sentiment,
                "category": entry.category,
                "source": entry.source,
                "relevance": score,
            }
            for entry, score in matches
        ]

        start = time.perf_counter()
        history = None
        if body.history:
            history = [{"role": item.role, "content": item.content} for item in body.history]

        try:
            answer = await ollama_service.generate(body.query, feedback_dicts, history=history)
        except Exception as exc:
            logger.error("Ollama generation failed: %s", exc)
            answer = "I encountered an error while analyzing the feedback. Please try again."
            fallback_triggered = True

        model_time = round((time.perf_counter() - start) * 1000.0, 2)

        matched_feedback = [self._format_feedback(entry, score) for entry, score in matches]
        response = ChatResponse(
            query=body.query,
            answer=answer,
            sources=matched_feedback,
            matched_feedback=matched_feedback,
            retrieved_count=len(matched_feedback),
            query_time_ms=query_time,
            model_time_ms=model_time,
        )
        self.cache.set(self._cache_key(body), response)
        logger.debug(
            "Retrieved %s feedback entries; fallback triggered: %s",
            len(matched_feedback),
            fallback_triggered,
        )
        return response

    async def chat_query_stream(
        self, db: Any, body: ChatQuery
    ) -> AsyncIterator[str]:
        """Stream a conversational response using Ollama RAG."""
        start = time.perf_counter()
        matches = self._search_feedback(db, body)
        query_time = round((time.perf_counter() - start) * 1000.0, 2)

        if not matches:
            logger.debug("No relevant feedback found for streaming query: %s", body.query)
            yield "data: I could not find enough relevant customer feedback to answer confidently.\n"
            return

        feedback_dicts = [
            {
                "content": entry.feedback_text,
                "sentiment": entry.sentiment,
                "category": entry.category,
                "source": entry.source,
                "relevance": score,
            }
            for entry, score in matches
        ]

        history = None
        if body.history:
            history = [{"role": item.role, "content": item.content} for item in body.history]

        try:
            async for token in ollama_service.generate_stream(
                body.query, feedback_dicts, history=history
            ):
                yield f"data: {token}\n"
        except Exception as exc:
            logger.error("Ollama streaming failed: %s", exc)
            yield "data: I encountered an error while analyzing the feedback.\n"


chat_service = ChatService()
