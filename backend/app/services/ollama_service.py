"""Ollama LLM service with strict grounded RAG support."""

from __future__ import annotations

import asyncio
import json
import logging
from typing import AsyncIterator, Any

import httpx

from app.config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class OllamaService:
    """Wrapper for Ollama local LLM inference with streaming."""

    def __init__(self):
        self._available: bool | None = None
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Create/reuse async HTTP client."""
        if self._client is None:
            self._client = httpx.AsyncClient(
                timeout=float(settings.ollama_timeout)
            )
        return self._client

    async def close(self) -> None:
        """Close HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None

    async def is_available(self) -> bool:
        """Check if Ollama is running and reachable."""
        if self._available is not None:
            return self._available

        try:
            client = await self._get_client()

            response = await client.get(
                f"{settings.ollama_base_url}/api/tags",
                timeout=5.0,
            )

            self._available = response.status_code == 200

        except Exception as exc:
            logger.warning("Ollama availability check failed: %s", exc)
            self._available = False

        return self._available

    def _build_system_prompt(self) -> str:
        """Strict grounded system prompt."""

        return """
You are FeedbackIQ, an AI customer intelligence analyst.

Your job is to answer ONLY using the provided customer feedback context.

STRICT RULES:
- NEVER answer from general knowledge
- NEVER behave like a generic AI assistant
- NEVER explain concepts unless customers mentioned them
- NEVER invent information
- ONLY summarize patterns found in the feedback
- If the feedback does not contain enough evidence, say:
  "I could not find enough evidence in the customer feedback."

RESPONSE STYLE:
- Natural and conversational
- Concise but insightful
- Mention recurring complaints or praise
- Mention sentiment trends when relevant
- Reference themes from the feedback
- Keep answers practical and evidence-based

GOOD RESPONSE EXAMPLE:
"Customers are mostly positive about delivery speed, but several users complain about delays during weekends and poor tracking updates."

BAD RESPONSE EXAMPLE:
"Customer satisfaction is important for businesses because..."
"""

    def _build_context_prompt(
        self,
        query: str,
        feedback_samples: list[dict[str, Any]],
    ) -> str:
        """Build grounded RAG prompt."""

        if not feedback_samples:
            return f"""
QUESTION:
{query}

No relevant customer feedback was retrieved.

Respond with:
"I could not find enough evidence in the customer feedback."
"""

        feedback_lines: list[str] = []

        sentiment_counts = {
            "positive": 0,
            "negative": 0,
            "neutral": 0,
        }

        category_counts: dict[str, int] = {}

        for i, fb in enumerate(feedback_samples[:10], start=1):
            content = (
                fb.get("content")
                or fb.get("feedback_text")
                or ""
            ).strip()

            if not content:
                continue

            sentiment = str(
                fb.get("sentiment", "unknown")
            ).lower()

            category = str(
                fb.get("category", "general")
            ).lower()

            similarity = float(
                fb.get("relevance", 0) or 0
            )

            if sentiment in sentiment_counts:
                sentiment_counts[sentiment] += 1

            category_counts[category] = (
                category_counts.get(category, 0) + 1
            )

            feedback_lines.append(
                f"""
Feedback #{i}
Sentiment: {sentiment}
Category: {category}
Similarity: {similarity:.4f}

Text:
{content}
"""
            )

        joined_feedback = "\n".join(feedback_lines)

        sorted_categories = sorted(
            category_counts.items(),
            key=lambda item: item[1],
            reverse=True,
        )

        top_categories = (
            ", ".join(
                f"{cat} ({count})"
                for cat, count in sorted_categories[:5]
            )
            if sorted_categories
            else "No major categories detected"
        )

        return f"""
CUSTOMER FEEDBACK DATA

{joined_feedback}

SUMMARY
- Positive feedback: {sentiment_counts['positive']}
- Negative feedback: {sentiment_counts['negative']}
- Neutral feedback: {sentiment_counts['neutral']}
- Main recurring categories: {top_categories}

USER QUESTION:
{query}

INSTRUCTIONS:
- Answer ONLY using the customer feedback above
- Identify recurring themes and patterns
- Mention whether customer sentiment is positive or negative
- Mention repeated complaints or praise
- Do not invent statistics
- Do not give generic business advice
- Do not behave like a chatbot assistant
- Keep the response under 200 words
"""

    async def generate_stream(
        self,
        query: str,
        feedback_samples: list[dict[str, Any]],
        history: list[dict[str, str]] | None = None,
    ) -> AsyncIterator[str]:
        """
        Stream response from Ollama.

        Yields:
            Tokens from model response.
        """

        if not await self.is_available():
            yield (
                f"Ollama is not available. "
                f"Please ensure it is running at "
                f"{settings.ollama_base_url}"
            )
            return

        client = await self._get_client()

        prompt = self._build_context_prompt(
            query=query,
            feedback_samples=feedback_samples,
        )

        logger.debug(
            "Ollama prompt preview:\n%s",
            prompt[:4000],
        )

        messages = [
            {
                "role": "system",
                "content": self._build_system_prompt(),
            }
        ]

        if history:
            cleaned_history = [
                {
                    "role": h.get("role", "user"),
                    "content": str(
                        h.get("content", "")
                    )[:2000],
                }
                for h in history[-6:]
            ]

            messages.extend(cleaned_history)

        messages.append(
            {
                "role": "user",
                "content": prompt,
            }
        )

        payload = {
            "model": settings.ollama_model,
            "messages": messages,
            "stream": True,
            "options": {
                "temperature": 0.2,
                "top_p": 0.9,
            },
        }

        try:
            async with client.stream(
                "POST",
                f"{settings.ollama_base_url}/api/chat",
                json=payload,
                timeout=float(settings.ollama_timeout),
            ) as response:

                if response.status_code != 200:
                    error_text = await response.aread()

                    logger.error(
                        "Ollama error %s: %s",
                        response.status_code,
                        error_text,
                    )

                    yield (
                        f"Ollama returned error "
                        f"{response.status_code}"
                    )
                    return

                async for line in response.aiter_lines():
                    if not line.strip():
                        continue

                    try:
                        payload = json.loads(line)

                        if (
                            "message" in payload
                            and "content" in payload["message"]
                        ):
                            token = payload["message"]["content"]

                            if token:
                                yield token

                        if payload.get("done", False):
                            break

                    except json.JSONDecodeError:
                        logger.debug(
                            "Failed to parse Ollama response line: %s",
                            line,
                        )
                        continue

        except asyncio.TimeoutError:
            logger.error("Ollama request timed out")

            yield (
                "The AI response timed out. "
                "Please try again."
            )

        except Exception as exc:
            logger.exception(
                "Ollama streaming failed"
            )

            yield (
                f"An error occurred while generating "
                f"the response: {str(exc)}"
            )

    async def generate(
        self,
        query: str,
        feedback_samples: list[dict[str, Any]],
        history: list[dict[str, str]] | None = None,
    ) -> str:
        """Generate complete non-streaming response."""

        full_response = ""

        async for token in self.generate_stream(
            query=query,
            feedback_samples=feedback_samples,
            history=history,
        ):
            full_response += token

        return full_response.strip()


ollama_service = OllamaService()