"""
NCERT Vector Retrieval Module with Qdrant.

Supports both local embedded storage (zero-daemon, file-persisted) and remote Qdrant URL.
Performs semantic similarity search with cosine distance and exact scores.
"""

import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PointStruct,
    VectorParams,
)

from app.ncert.chunking import NCERTChunk
from app.ncert.embeddings import get_embedding_dimension

logger = logging.getLogger(__name__)

COLLECTION_NAME = "ncert_chunks"
_CLIENT_INSTANCE: Optional[QdrantClient] = None


def get_qdrant_client() -> QdrantClient:
    """Initialize and return a singleton QdrantClient."""
    global _CLIENT_INSTANCE
    if _CLIENT_INSTANCE is not None:
        return _CLIENT_INSTANCE

    qdrant_url = os.environ.get("QDRANT_URL")
    qdrant_api_key = os.environ.get("QDRANT_API_KEY")

    if qdrant_url:
        logger.info("Connecting to remote Qdrant instance: %s", qdrant_url)
        _CLIENT_INSTANCE = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
    else:
        # Default to local persistent storage in backend/data/qdrant_storage
        storage_dir = Path(__file__).resolve().parents[2] / "data" / "qdrant_storage"
        storage_dir.mkdir(parents=True, exist_ok=True)
        logger.info("Using local persistent Qdrant storage at: %s", storage_dir)
        _CLIENT_INSTANCE = QdrantClient(path=str(storage_dir))

    return _CLIENT_INSTANCE


def close_qdrant_client() -> None:
    """Explicitly close Qdrant client before interpreter shutdown."""
    global _CLIENT_INSTANCE
    if _CLIENT_INSTANCE is not None:
        try:
            _CLIENT_INSTANCE.close()
        except Exception:
            pass
        _CLIENT_INSTANCE = None


import atexit
atexit.register(close_qdrant_client)


def ensure_collection_exists(client: Optional[QdrantClient] = None) -> None:
    """Ensure the NCERT collection exists with proper vector configuration."""
    if client is None:
        client = get_qdrant_client()

    dim = get_embedding_dimension()
    collections = [col.name for col in client.get_collections().collections]
    if COLLECTION_NAME not in collections:
        logger.info("Creating Qdrant collection '%s' with dim=%d, COSINE", COLLECTION_NAME, dim)
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=dim, distance=Distance.COSINE),
        )


def index_chunks(chunks: List[NCERTChunk], client: Optional[QdrantClient] = None) -> int:
    """
    Store chunk embeddings and metadata in Qdrant.
    Embeddings must be precomputed or generated via embed_documents.
    """
    if not chunks:
        return 0

    if client is None:
        client = get_qdrant_client()

    ensure_collection_exists(client)

    from app.ncert.embeddings import embed_documents
    texts = [chunk.text for chunk in chunks]
    vectors = embed_documents(texts)

    points: List[PointStruct] = []
    for i, (chunk, vector) in enumerate(zip(chunks, vectors)):
        # Generate numeric ID or stable hash for point ID
        # Convert chunk_id (e.g. physics-units-001) to integer ID or use index
        point_id = i + 1
        payload = chunk.to_dict()
        points.append(
            PointStruct(
                id=point_id,
                vector=vector,
                payload=payload,
            )
        )

    # Upsert in batches of 50
    batch_size = 50
    for start in range(0, len(points), batch_size):
        batch = points[start : start + batch_size]
        client.upsert(collection_name=COLLECTION_NAME, points=batch)

    logger.info("Indexed %d chunks into Qdrant collection '%s'", len(points), COLLECTION_NAME)
    return len(points)


def query_similar_chunks(
    query_vector: List[float],
    chapter_id: str = "physics-units",
    top_k: int = 3,
    score_threshold: float = 0.0,
    client: Optional[QdrantClient] = None,
) -> List[Dict[str, Any]]:
    """
    Retrieve top-k most similar chunks for the given chapter.
    Returns list of dicts with chunk metadata and vector similarity score.
    """
    if client is None:
        client = get_qdrant_client()

    ensure_collection_exists(client)

    # Filter strictly by chapter_id
    query_filter = Filter(
        must=[
            FieldCondition(
                key="chapter_id",
                match=MatchValue(value=chapter_id),
            )
        ]
    )

    results = client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector,
        query_filter=query_filter,
        limit=top_k,
        score_threshold=score_threshold if score_threshold > 0 else None,
        with_payload=True,
    )

    retrieved: List[Dict[str, Any]] = []
    for point in results.points:
        payload = point.payload or {}
        retrieved.append({
            "chunk_id": payload.get("chunk_id", str(point.id)),
            "chapter_id": payload.get("chapter_id", chapter_id),
            "chapter": payload.get("chapter", "Unknown Chapter"),
            "subject": payload.get("subject", "Physics"),
            "section": payload.get("section", "General"),
            "source": payload.get("source", "NCERT"),
            "text": payload.get("text", ""),
            "similarity": round(float(point.score), 4),
        })

    return retrieved


def get_indexed_status(chapter_id: str = "physics-units", client: Optional[QdrantClient] = None) -> Dict[str, Any]:
    """Check how many chunks are currently indexed for the given chapter."""
    try:
        if client is None:
            client = get_qdrant_client()

        collections = [col.name for col in client.get_collections().collections]
        if COLLECTION_NAME not in collections:
            return {"is_indexed": False, "chunk_count": 0, "chapter_id": chapter_id}

        count_res = client.count(
            collection_name=COLLECTION_NAME,
            count_filter=Filter(
                must=[
                    FieldCondition(
                        key="chapter_id",
                        match=MatchValue(value=chapter_id),
                    )
                ]
            ),
        )
        count = count_res.count
        return {
            "is_indexed": count > 0,
            "chunk_count": count,
            "chapter_id": chapter_id,
        }
    except Exception as exc:
        logger.warning("Could not read Qdrant collection status: %s", exc)
        return {"is_indexed": False, "chunk_count": 0, "error": str(exc), "chapter_id": chapter_id}
