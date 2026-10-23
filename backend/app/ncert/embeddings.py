"""
NCERT Embedding Provider.

Uses fast, local ONNX dense embeddings (BAAI/bge-small-en-v1.5) via FastEmbed.
Reproducible, zero-external-dependency, running locally on CPU.
"""

import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

_EMBEDDING_MODEL = None
_DEFAULT_MODEL_NAME = "BAAI/bge-small-en-v1.5"
_EMBEDDING_DIM = 384


def get_embedding_model():
    """Lazily load and cache the local ONNX embedding model."""
    global _EMBEDDING_MODEL
    if _EMBEDDING_MODEL is None:
        try:
            from fastembed import TextEmbedding
            logger.info("Initializing FastEmbed model: %s", _DEFAULT_MODEL_NAME)
            _EMBEDDING_MODEL = TextEmbedding(model_name=_DEFAULT_MODEL_NAME)
        except Exception as exc:
            logger.error("Failed to initialize FastEmbed: %s", exc)
            raise RuntimeError(
                f"Could not load local embedding model ({exc}). Ensure fastembed is installed."
            ) from exc
    return _EMBEDDING_MODEL


def get_embedding_dimension() -> int:
    """Return the vector dimensionality (384 for bge-small-en-v1.5)."""
    return _EMBEDDING_DIM


def embed_text(text: str) -> List[float]:
    """Generate dense vector embedding for a single text query or passage."""
    model = get_embedding_model()
    # FastEmbed returns a generator of numpy arrays
    embeddings = list(model.embed([text]))
    if not embeddings:
        raise ValueError("Embedding model returned empty vector")
    return embeddings[0].tolist()


def embed_documents(texts: List[str], batch_size: int = 32) -> List[List[float]]:
    """Generate dense vector embeddings for a list of document chunks."""
    if not texts:
        return []
    model = get_embedding_model()
    embeddings = list(model.embed(texts, batch_size=batch_size))
    return [emb.tolist() for emb in embeddings]
