"""
NCERT Document Chunking and Preprocessing.

Extracts structured, traceable chunks with full metadata from NCERT chapters.
"""

from dataclasses import asdict, dataclass
import re
from typing import Any, Dict, List


@dataclass
class NCERTChunk:
    chunk_id: str
    chapter_id: str
    chapter: str
    subject: str
    class_level: str
    section: str
    source: str
    text: str
    char_count: int
    token_estimate: int

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def clean_text(raw_text: str) -> str:
    """Normalize whitespace and remove markdown/formatting artifacts."""
    text = raw_text.replace("\r\n", "\n").replace("\r", "\n")
    # Replace unicode non-breaking spaces
    text = text.replace("\u00a0", " ").replace("\u200b", "")
    # Normalize multiple spaces (preserving newlines)
    text = re.sub(r"[ \t]+", " ", text)
    # Collapse 3+ newlines to 2
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def chunk_ncert_chapter(
    raw_content: str,
    chapter_id: str = "physics-units",
    chapter_name: str = "Units and Measurements",
    subject: str = "Physics",
    class_level: str = "Class 11",
    source: str = "NCERT Class 11 Physics (Part 1)",
    max_chunk_chars: int = 900,
    min_chunk_chars: int = 120,
) -> List[NCERTChunk]:
    """
    Splits an NCERT chapter into semantic chunks preserving section boundaries.
    
    Each chunk is prefixed with its section context for high-precision retrieval.
    """
    cleaned = clean_text(raw_content)
    lines = cleaned.split("\n")

    current_section = "General Introduction"
    section_blocks: List[Dict[str, Any]] = []
    current_block_lines: List[str] = []

    for line in lines:
        line_stripped = line.strip()
        # Detect section headings like ## 2.1 ... or ### 2.5.1 ...
        if line_stripped.startswith("## ") or line_stripped.startswith("### "):
            if current_block_lines:
                section_blocks.append({
                    "section": current_section,
                    "text": "\n".join(current_block_lines).strip()
                })
                current_block_lines = []
            current_section = line_stripped.lstrip("#").strip()
        elif line_stripped.startswith("# "):
            # Chapter header - ignore or capture as title
            continue
        else:
            if line_stripped:
                current_block_lines.append(line_stripped)
            elif current_block_lines:
                current_block_lines.append("")

    if current_block_lines:
        section_blocks.append({
            "section": current_section,
            "text": "\n".join(current_block_lines).strip()
        })

    chunks: List[NCERTChunk] = []
    chunk_index = 1

    for block in section_blocks:
        sec_title = block["section"]
        block_text = block["text"]
        
        # Split block into paragraphs
        paragraphs = [p.strip() for p in block_text.split("\n\n") if p.strip()]
        
        current_chunk_paragraphs: List[str] = []
        current_length = 0

        for para in paragraphs:
            para_len = len(para)
            if current_length + para_len > max_chunk_chars and current_length >= min_chunk_chars:
                # Flush existing chunk
                combined_text = "\n\n".join(current_chunk_paragraphs)
                # Ensure section title is part of retrieval context
                full_chunk_text = f"[{sec_title}]\n{combined_text}"
                
                chunk_id = f"{chapter_id}-{chunk_index:03d}"
                chunks.append(
                    NCERTChunk(
                        chunk_id=chunk_id,
                        chapter_id=chapter_id,
                        chapter=chapter_name,
                        subject=subject,
                        class_level=class_level,
                        section=sec_title,
                        source=source,
                        text=full_chunk_text,
                        char_count=len(full_chunk_text),
                        token_estimate=len(full_chunk_text) // 4,
                    )
                )
                chunk_index += 1
                current_chunk_paragraphs = [para]
                current_length = para_len
            else:
                current_chunk_paragraphs.append(para)
                current_length += para_len

        if current_chunk_paragraphs:
            combined_text = "\n\n".join(current_chunk_paragraphs)
            full_chunk_text = f"[{sec_title}]\n{combined_text}"
            chunk_id = f"{chapter_id}-{chunk_index:03d}"
            chunks.append(
                NCERTChunk(
                    chunk_id=chunk_id,
                    chapter_id=chapter_id,
                    chapter=chapter_name,
                    subject=subject,
                    class_level=class_level,
                    section=sec_title,
                    source=source,
                    text=full_chunk_text,
                    char_count=len(full_chunk_text),
                    token_estimate=len(full_chunk_text) // 4,
                )
            )
            chunk_index += 1

    return chunks
