"""
NCERT Chapter Ingestion Pipeline.

Run standalone to extract, clean, chunk, embed, and store NCERT chapters into Qdrant.
Usage:
    python -m backend.ncert.ingestion
    or
    python -m app.ncert.ingestion
"""

import logging
import sys
from pathlib import Path

# Ensure backend root is on sys.path
backend_dir = Path(__file__).resolve().parents[2]
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.ncert.chunking import chunk_ncert_chapter
from app.ncert.embeddings import get_embedding_dimension
from app.ncert.retrieval import get_indexed_status, get_qdrant_client, index_chunks, query_similar_chunks
from app.ncert.embeddings import embed_text

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("ncert_ingestion")


from typing import Optional, Union

def ingest_chapter(
    file_path: Optional[Union[str, Path]] = None,
    chapter_id: str = "physics-units",
    chapter_name: str = "Units and Measurements",
    subject: str = "Physics",
    class_level: str = "Class 11",
    source: str = "NCERT Class 11 Physics (Part 1)",
) -> int:
    """Ingest a single NCERT chapter into the Qdrant vector store."""
    if file_path is None:
        file_path = backend_dir / "data" / "ncert_sources" / "physics_units_and_measurements.txt"

    file_path = Path(file_path)
    if not file_path.exists():
        raise FileNotFoundError(f"NCERT source file not found at: {file_path}")

    logger.info("Loading NCERT chapter from: %s", file_path)
    raw_content = file_path.read_text(encoding="utf-8")

    logger.info("Splitting text into semantic chunks...")
    chunks = chunk_ncert_chapter(
        raw_content=raw_content,
        chapter_id=chapter_id,
        chapter_name=chapter_name,
        subject=subject,
        class_level=class_level,
        source=source,
    )
    logger.info("Generated %d chunks with metadata.", len(chunks))

    # Sample chunk info
    if chunks:
        logger.info("Sample chunk #1: ID=%s, Section='%s', Chars=%d",
                    chunks[0].chunk_id, chunks[0].section, chunks[0].char_count)

    logger.info("Generating embeddings and upserting into Qdrant...")
    dim = get_embedding_dimension()
    logger.info("Embedding dimensionality: %d", dim)

    count = index_chunks(chunks)
    logger.info("Successfully indexed %d chunks in vector database.", count)

    # Verification query
    logger.info("Running verification test query: 'What is accuracy and precision?'...")
    test_vec = embed_text("What is accuracy and precision?")
    results = query_similar_chunks(query_vector=test_vec, chapter_id=chapter_id, top_k=2)

    logger.info("Verification results:")
    for idx, r in enumerate(results, 1):
        logger.info("  [%d] Similarity: %.4f | Section: %s | ID: %s",
                    idx, r["similarity"], r["section"], r["chunk_id"])

    status = get_indexed_status(chapter_id)
    logger.info("Final Chapter Status: %s", status)
    return count


if __name__ == "__main__":
    print("=" * 60)
    print("NCERT INGESTION PIPELINE")
    print("=" * 60)
    try:
        total = ingest_chapter()
        print("=" * 60)
        print(f"SUCCESS: Ingested {total} NCERT chunks into Qdrant vector store.")
        print("=" * 60)
    except Exception as exc:
        print(f"ERROR: Ingestion failed: {exc}", file=sys.stderr)
        sys.exit(1)
