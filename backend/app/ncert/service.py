"""
NCERT RAG Orchestration Service.

Connects document extraction, dense embedding generation, Qdrant vector similarity search,
scope filtering, and grounded LLM generation.
"""

import json
import logging
import os
import re
from typing import Any, Dict, List, Optional
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.ncert.embeddings import embed_text
from app.ncert.prompts import format_rag_prompt
from app.ncert.retrieval import get_indexed_status, query_similar_chunks

logger = logging.getLogger(__name__)

# Out-of-scope cosine similarity threshold for bge-small-en-v1.5
MIN_RELEVANCE_THRESHOLD = 0.52

CHAPTER_METADATA = {
    "physics-units": {
        "id": "physics-units",
        "subject": "Physics",
        "chapter": "Units and Measurements",
        "class_level": "Class 11",
        "source": "NCERT Class 11 Physics (Part 1)",
        "suggested_questions": [
            "What is the difference between accuracy and precision?",
            "Explain significant figures and the rules for determining them.",
            "What are the rules for rounding off measurements?",
            "How is dimensional analysis used to check consistency of equations?",
            "What are systematic errors and how can they be minimized?",
        ],
    }
}


def list_available_chapters() -> List[Dict[str, Any]]:
    """Return all known chapters with their live indexing status."""
    chapters = []
    for chap_id, info in CHAPTER_METADATA.items():
        status = get_indexed_status(chap_id)
        chapters.append({
            **info,
            "is_indexed": status.get("is_indexed", False),
            "chunk_count": status.get("chunk_count", 0),
        })
    return chapters


def expand_query_with_history(
    question: str, history: Optional[List[Dict[str, str]]] = None
) -> str:
    """
    If the question contains follow-up pronouns ('it', 'this', 'that', 'difference', etc.),
    expand the dense retrieval query using the previous user question.
    """
    if not history:
        return question

    q_lower = question.lower()
    followup_patterns = [
        r"\bit\b", r"\bthis\b", r"\bthat\b", r"\bthese\b", r"\bthose\b",
        r"\bhow is it\b", r"\bwhy is it\b", r"\bwhat about\b", r"\bdifference\b",
        r"\bcompare\b", r"\bgive an example\b", r"\bexplain more\b"
    ]
    is_followup = any(re.search(pat, q_lower) for pat in followup_patterns)

    if is_followup:
        # Find the most recent user message
        for turn in reversed(history):
            if turn.get("role") == "user" and turn.get("content"):
                prev = turn["content"].strip()
                logger.info("Contextualizing follow-up query '%s' with previous '%s'", question, prev)
                return f"{prev} {question}"

    return question


def call_llm_completion(prompt_payload: Dict[str, Any]) -> str:
    """Call Groq or OpenAI-compatible completion endpoint."""
    api_key = os.environ.get("GROQ_API_KEY") or os.environ.get("LLM_API_KEY") or os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "The NCERT context was retrieved, but the answer could not be generated right now. "
            "Configure GROQ_API_KEY or LLM_API_KEY in backend/.env."
        )

    # Determine provider endpoint and model
    if os.environ.get("GROQ_API_KEY") or (api_key and api_key.startswith("gsk_")):
        endpoint = "https://api.groq.com/openai/v1/chat/completions"
        model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
    elif os.environ.get("OPENAI_API_KEY") or (api_key and api_key.startswith("sk-")):
        endpoint = "https://api.openai.com/v1/chat/completions"
        model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    else:
        endpoint = "https://api.groq.com/openai/v1/chat/completions"
        model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

    req_data = {
        "model": model,
        "messages": prompt_payload["messages"],
        "temperature": prompt_payload.get("temperature", 0.2),
        "max_tokens": prompt_payload.get("max_tokens", 1024),
    }

    request = Request(
        endpoint,
        data=json.dumps(req_data).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
            "User-Agent": "WHY-NCERT-Bot/1.0",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=25) as response:
            result = json.loads(response.read().decode("utf-8"))
        choices = result.get("choices", [])
        if not choices:
            raise ValueError("No completion choices returned by LLM")
        return choices[0]["message"]["content"].strip()
    except HTTPError as exc:
        logger.warning("LLM API returned HTTP %s", exc.code)
        if exc.code == 401:
            raise RuntimeError("LLM authentication failed. Check configured API key in backend/.env.") from None
        if exc.code == 429:
            raise RuntimeError("LLM rate limit reached. Please retry in a few moments.") from None
        raise RuntimeError("The NCERT context was retrieved, but the answer could not be generated right now.") from None
    except (URLError, TimeoutError) as exc:
        logger.warning("LLM connection failed: %s", exc)
        raise RuntimeError("Could not connect to LLM provider. Please check internet connection.") from None
    except Exception as exc:
        logger.warning("LLM generation error: %s", exc)
        raise RuntimeError("The NCERT context was retrieved, but the answer could not be generated right now.") from None


def answer_ncert_question(
    chapter_id: str,
    question: str,
    history: Optional[List[Dict[str, str]]] = None,
    top_k: int = 3,
) -> Dict[str, Any]:
    """
    End-to-end RAG answering pipeline:
    1. Chapter validation
    2. Query embedding
    3. Vector search via Qdrant
    4. Scope check (similarity threshold)
    5. Prompt construction
    6. Grounded generation
    """
    question_clean = question.strip()
    if not question_clean:
        return {
            "answer": "Please ask a question regarding the selected NCERT chapter.",
            "chapter": "Units and Measurements",
            "subject": "Physics",
            "sources": [],
            "retrieved_sections": [],
            "is_out_of_scope": True,
        }

    meta = CHAPTER_METADATA.get(chapter_id)
    if not meta:
        return {
            "answer": f"Unknown chapter '{chapter_id}'. Only indexed chapters can be queried.",
            "chapter": chapter_id,
            "subject": "Unknown",
            "sources": [],
            "retrieved_sections": [],
            "is_out_of_scope": True,
        }

    chapter_name = meta["chapter"]
    subject = meta["subject"]

    # Check if indexed
    status = get_indexed_status(chapter_id)
    if not status.get("is_indexed"):
        return {
            "answer": "This chapter has not been indexed yet. Please run the ingestion script.",
            "chapter": chapter_name,
            "subject": subject,
            "sources": [],
            "retrieved_sections": [],
            "is_out_of_scope": True,
        }

    # Step 1: Query expansion for follow-ups
    retrieval_query = expand_query_with_history(question_clean, history)

    # Step 2: Dense Question Embedding
    try:
        query_vector = embed_text(retrieval_query)
    except Exception as exc:
        logger.error("Embedding generation failed: %s", exc)
        return {
            "answer": "NCERT retrieval is temporarily unavailable. Could not generate query embedding.",
            "chapter": chapter_name,
            "subject": subject,
            "sources": [],
            "retrieved_sections": [],
            "is_out_of_scope": False,
        }

    # Step 3: Vector Similarity Search
    try:
        retrieved_chunks = query_similar_chunks(
            query_vector=query_vector,
            chapter_id=chapter_id,
            top_k=top_k,
        )
    except Exception as exc:
        logger.error("Vector search failed: %s", exc)
        return {
            "answer": "NCERT retrieval is temporarily unavailable. Please try again.",
            "chapter": chapter_name,
            "subject": subject,
            "sources": [],
            "retrieved_sections": [],
            "is_out_of_scope": False,
        }

    # Step 4: Scope and Relevance Verification
    max_similarity = retrieved_chunks[0]["similarity"] if retrieved_chunks else 0.0
    logger.info("RAG search: query='%s', top_sim=%.4f, retrieved=%d", question_clean, max_similarity, len(retrieved_chunks))

    # If the top similarity score is below the threshold, query is unrelated
    if not retrieved_chunks or max_similarity < MIN_RELEVANCE_THRESHOLD:
        return {
            "answer": "I can only answer questions related to the currently selected NCERT chapter.",
            "chapter": chapter_name,
            "subject": subject,
            "sources": [],
            "retrieved_sections": [],
            "is_out_of_scope": True,
        }

    # Unique retrieved section names
    retrieved_sections = list(dict.fromkeys(chunk["section"] for chunk in retrieved_chunks))

    # Step 5: Format Prompt
    prompt_payload = format_rag_prompt(
        question=question_clean,
        chapter_name=chapter_name,
        subject=subject,
        retrieved_chunks=retrieved_chunks,
        history=history,
    )

    # Step 6: Grounded LLM Generation
    has_llm_key = bool(
        os.environ.get("GROQ_API_KEY")
        or os.environ.get("LLM_API_KEY")
        or os.environ.get("OPENAI_API_KEY")
    )

    if has_llm_key:
        try:
            llm_answer = call_llm_completion(prompt_payload)
            return {
                "answer": llm_answer,
                "chapter": chapter_name,
                "subject": subject,
                "sources": retrieved_chunks,
                "retrieved_sections": retrieved_sections,
                "is_out_of_scope": False,
            }
        except RuntimeError as exc:
            logger.warning("LLM generation unavailable (%s); using grounded NCERT extraction", exc)

    # Clean grounded explanation synthesized directly from the top retrieved NCERT passages
    best_chunk = retrieved_chunks[0]
    clean_snippet = re.sub(r"^\[.*?\]\n", "", best_chunk["text"]).strip()
    sec_name = best_chunk.get("section", "Core Concepts")

    llm_hint = (
        "\n\n*(Note: Grounded in authentic NCERT text. Set `GROQ_API_KEY` in `backend/.env` for interactive conversational LLM responses.)*"
        if not has_llm_key
        else ""
    )

    grounded_answer = (
        f"**From NCERT {subject} ({sec_name}):**\n\n"
        f"{clean_snippet}"
        f"{llm_hint}"
    )

    return {
        "answer": grounded_answer,
        "chapter": chapter_name,
        "subject": subject,
        "sources": retrieved_chunks,
        "retrieved_sections": retrieved_sections,
        "is_out_of_scope": False,
        "generation_unavailable": not has_llm_key,
    }


