"""FAISS vector index for semantic search."""

from __future__ import annotations

import json
import logging
from pathlib import Path

import numpy as np

from app.config.settings import get_settings
from app.services.embedding_service import encode_text, encode_texts

logger = logging.getLogger(__name__)
settings = get_settings()


class FaissIndexService:
    """
    Manages a FAISS index mapping vector positions to feedback IDs.

    Persists index and id map to disk for restarts.
    """

    def __init__(self) -> None:
        self._index = None
        self._id_map: list[int] = []
        self._dim = 384
        self._loaded = False

    @property
    def index_path(self) -> Path:
        return Path(settings.faiss_index_path)

    @property
    def id_map_path(self) -> Path:
        return Path(settings.faiss_id_map_path)

    def _ensure_dirs(self) -> None:
        self.index_path.parent.mkdir(parents=True, exist_ok=True)

    def _create_index(self, dim: int):
        import faiss

        index = faiss.IndexFlatIP(dim)
        return index

    def load(self) -> None:
        """Load index from disk or initialize empty."""
        if self._loaded:
            return

        self._ensure_dirs()
        try:
            import faiss

            if self.index_path.exists() and self.id_map_path.exists():
                self._index = faiss.read_index(str(self.index_path))
                self._id_map = json.loads(self.id_map_path.read_text())
                self._dim = self._index.d
                logger.info("FAISS index loaded with %d vectors", len(self._id_map))
            else:
                self._index = self._create_index(self._dim)
                self._id_map = []
                logger.info("Initialized empty FAISS index")
        except Exception as exc:
            logger.warning("FAISS load failed, using empty index: %s", exc)
            self._index = self._create_index(self._dim)
            self._id_map = []

        self._loaded = True

    def save(self) -> None:
        """Persist index and id map."""
        if self._index is None:
            return
        self._ensure_dirs()
        try:
            import faiss

            faiss.write_index(self._index, str(self.index_path))
            self.id_map_path.write_text(json.dumps(self._id_map))
        except Exception as exc:
            logger.error("Failed to save FAISS index: %s", exc)

    def add_feedback(self, feedback_id: int, text: str) -> int:
        """Add a feedback vector to the index; returns FAISS position."""
        if feedback_id in self._id_map:
            return self._id_map.index(feedback_id)

        self.load()
        vector = encode_text(text).astype(np.float32)
        self._dim = vector.shape[0]

        if self._index is None or self._index.d != self._dim:
            self._index = self._create_index(self._dim)

        vec = vector.reshape(1, -1)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm

        self._index.add(vec.astype(np.float32))
        self._id_map.append(feedback_id)
        self.save()
        return len(self._id_map) - 1

    def search(self, query: str, limit: int = 10) -> list[tuple[int, float]]:
        """Return (feedback_id, similarity_score) pairs."""
        self.load()
        if self._index is None or self._index.ntotal == 0:
            return []

        q = encode_text(query).astype(np.float32).reshape(1, -1)
        norm = np.linalg.norm(q)
        if norm > 0:
            q = q / norm

        k = min(limit, self._index.ntotal)
        scores, indices = self._index.search(q, k)

        results: list[tuple[int, float]] = []
        for idx, score in zip(indices[0], scores[0]):
            if idx < 0 or idx >= len(self._id_map):
                continue
            results.append((self._id_map[idx], float(score)))
        return results

    def rebuild_from_entries(self, entries: list[tuple[int, str]]) -> None:
        """Rebuild entire index from database entries."""
        if not entries:
            self._index = self._create_index(self._dim)
            self._id_map = []
            self.save()
            return

        texts = [e[1] for e in entries]
        vectors = encode_texts(texts)
        self._dim = vectors.shape[1]

        import faiss

        norms = np.linalg.norm(vectors, axis=1, keepdims=True)
        vectors = vectors / (norms + 1e-9)

        self._index = faiss.IndexFlatIP(self._dim)
        self._index.add(vectors.astype(np.float32))
        self._id_map = [e[0] for e in entries]
        self.save()
        logger.info("Rebuilt FAISS index with %d entries", len(entries))


faiss_service = FaissIndexService()
