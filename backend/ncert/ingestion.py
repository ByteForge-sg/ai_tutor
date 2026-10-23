"""NCERT ingestion entrypoint for python -m backend.ncert.ingestion."""
import sys
from pathlib import Path

# Ensure backend root is on sys.path
backend_dir = Path(__file__).resolve().parents[1]
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.ncert.ingestion import ingest_chapter

if __name__ == "__main__":
    print("=" * 60)
    print("NCERT INGESTION PIPELINE (backend.ncert.ingestion)")
    print("=" * 60)
    try:
        total = ingest_chapter()
        print("=" * 60)
        print(f"SUCCESS: Ingested {total} NCERT chunks into Qdrant vector store.")
        print("=" * 60)
    except Exception as exc:
        print(f"ERROR: Ingestion failed: {exc}", file=sys.stderr)
        sys.exit(1)
