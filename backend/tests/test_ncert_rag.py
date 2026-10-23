"""
Unit and Integration Tests for NCERT-Bot RAG Pipeline.
"""

import unittest
from unittest.mock import patch
from qdrant_client import QdrantClient

from app.ncert.chunking import chunk_ncert_chapter, clean_text
from app.ncert.embeddings import get_embedding_dimension, embed_text
from app.ncert.retrieval import index_chunks, query_similar_chunks, get_indexed_status
from app.ncert.service import (
    answer_ncert_question,
    expand_query_with_history,
    list_available_chapters,
)


class NCERTRagPipelineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Use an isolated in-memory Qdrant client for tests to prevent lock conflicts
        # with any running server instance.
        cls.test_client = QdrantClient(":memory:")
        cls.patcher = patch("app.ncert.retrieval.get_qdrant_client", return_value=cls.test_client)
        cls.patcher.start()

        sample_doc = """# NCERT Class 11 Physics (Part 1)
# Chapter 2: Units and Measurements

## 2.1 Introduction and Need for Measurement
Measurement of any physical quantity involves comparison with a reference standard called unit. Base units and derived units form the system of units.

## 2.5 Accuracy, Precision of Instruments and Errors in Measurement
The accuracy of a measurement is a measure of how close the measured value is to the true value. Precision tells us to what resolution or limit the quantity is measured.
Systematic errors tend to be in one direction. Random errors occur irregularly and can be minimized by repeating observations.

## 2.6 Significant Figures and Rules for Determination
The reliable digits plus the first uncertain digit are known as significant figures. All non-zero digits are significant. Trailing zeros without decimal point are not significant.

## 2.7 Dimensions of Physical Quantities
The dimensions of a physical quantity are the powers to which base quantities are raised. Force = [M L T^-2], Work = [M L^2 T^-2].
"""
        chunks = chunk_ncert_chapter(
            raw_content=sample_doc,
            chapter_id="physics-units",
            chapter_name="Units and Measurements",
            subject="Physics",
        )
        index_chunks(chunks, client=cls.test_client)

    @classmethod
    def tearDownClass(cls):
        cls.patcher.stop()
        cls.test_client.close()

    def test_text_cleaning_and_chunking(self):
        sample_doc = """## 2.1 Introduction\nMeasurement is fundamental.\n\n## 2.5 Accuracy\nAccuracy is closeness."""
        cleaned = clean_text(sample_doc)
        self.assertNotIn("\r", cleaned)
        chunks = chunk_ncert_chapter(
            raw_content=sample_doc,
            chapter_id="physics-units",
            chapter_name="Units and Measurements",
            subject="Physics",
        )
        self.assertGreaterEqual(len(chunks), 2)
        self.assertEqual(chunks[0].chapter_id, "physics-units")
        self.assertEqual(chunks[0].subject, "Physics")
        self.assertTrue(chunks[0].chunk_id.startswith("physics-units-"))
        self.assertIn("section", chunks[0].to_dict())

    def test_embedding_dimension(self):
        dim = get_embedding_dimension()
        self.assertEqual(dim, 384)
        vec = embed_text("Test query on significant figures")
        self.assertEqual(len(vec), 384)
        self.assertIsInstance(vec[0], float)

    def test_retrieval_returns_grounded_chunks_with_similarity(self):
        query_vec = embed_text("What is the difference between accuracy and precision?")
        results = query_similar_chunks(
            query_vector=query_vec, chapter_id="physics-units", top_k=3, client=self.test_client
        )
        self.assertGreaterEqual(len(results), 1)
        top_chunk = results[0]
        self.assertIn("similarity", top_chunk)
        self.assertIn("section", top_chunk)
        self.assertIn("chunk_id", top_chunk)
        self.assertIn("text", top_chunk)
        self.assertGreater(top_chunk["similarity"], 0.70)
        self.assertIn("Accuracy", top_chunk["section"])

    def test_out_of_scope_query_rejection(self):
        res = answer_ncert_question(
            chapter_id="physics-units",
            question="What is the capital of France and who is Napoleon Bonaparte?",
        )
        self.assertTrue(res["is_out_of_scope"])
        self.assertIn("only answer questions related to the currently selected NCERT chapter", res["answer"])
        self.assertEqual(len(res["sources"]), 0)

    def test_followup_query_expansion(self):
        history = [
            {"role": "user", "content": "What is accuracy?"},
            {"role": "assistant", "content": "Accuracy refers to how close a measured value is to true value."},
        ]
        expanded = expand_query_with_history("How is it different from precision?", history)
        self.assertIn("accuracy", expanded.lower())
        self.assertIn("precision", expanded.lower())

    def test_list_chapters_shows_indexed_status(self):
        chapters = list_available_chapters()
        self.assertGreaterEqual(len(chapters), 1)
        physics_ch = next((c for c in chapters if c["id"] == "physics-units"), None)
        self.assertIsNotNone(physics_ch)
        self.assertTrue(physics_ch["is_indexed"])
        self.assertGreater(physics_ch["chunk_count"], 0)
        self.assertIn("What is the difference between accuracy and precision?", physics_ch["suggested_questions"])

    @patch("app.ncert.service.call_llm_completion")
    @patch.dict("os.environ", {"GROQ_API_KEY": "gsk_test_key"})
    def test_answer_generation_with_llm(self, mock_llm):
        mock_llm.return_value = "Accuracy represents closeness to true value, whereas precision is resolution."
        res = answer_ncert_question(
            chapter_id="physics-units",
            question="Explain accuracy and precision.",
            top_k=2,
        )
        self.assertFalse(res["is_out_of_scope"])
        self.assertEqual(res["answer"], "Accuracy represents closeness to true value, whereas precision is resolution.")
        self.assertGreaterEqual(len(res["sources"]), 1)
        self.assertIn("retrieved_sections", res)


if __name__ == "__main__":
    unittest.main()
