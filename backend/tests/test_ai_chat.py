import io
import json
import os
import sqlite3
import unittest
from contextlib import closing
from unittest.mock import patch
from urllib.error import HTTPError
from uuid import uuid4

from app.ai import generate_chat_response, is_exam_running


class CoachChatRegressionTests(unittest.TestCase):
    def setUp(self):
        self.db = f"file:coach-{uuid4().hex}?mode=memory&cache=shared"
        self.keeper = self.connect()
        self.addCleanup(self.keeper.close)
        self.keeper.executescript("""
                CREATE TABLE attempts (id TEXT PRIMARY KEY, user_id TEXT, status TEXT);
                INSERT INTO attempts VALUES
                    ('old-running', 'student', 'RUNNING'),
                    ('current-running', 'student', 'RUNNING'),
                    ('submitted', 'student', 'SUBMITTED'),
                    ('auto-submitted', 'student', 'AUTO_SUBMITTED'),
                    ('flagged', 'student', 'FLAGGED'),
                    ('other-student', 'someone-else', 'RUNNING');
                CREATE TABLE weaknesses (user_id TEXT, topic TEXT, subject TEXT,
                    mistake_type TEXT, accuracy_percent REAL, occurrences INTEGER);
                CREATE TABLE question_attempts (user_id TEXT, subject TEXT, chapter TEXT,
                    topic TEXT, selected_answer TEXT, correct_answer TEXT,
                    timestamp TEXT, is_correct INTEGER);
                CREATE TABLE questions (id TEXT, topic TEXT, concept TEXT, explanation TEXT);
                INSERT INTO questions VALUES ('king-property', 'Definite Integration', 'Definite Integrals and King''s Property',
                    'Integral from a to b of f(x) equals integral from a to b of f(a+b-x).');
        """)
        self.db_patch = patch("app.ai.get_db_connection", side_effect=self.connect)
        self.db_patch.start()
        self.addCleanup(self.db_patch.stop)
        self.env_patch = patch.dict(os.environ, {"GROQ_API_KEY": "test-secret", "GROQ_MODEL": "test-model"})
        self.env_patch.start()
        self.addCleanup(self.env_patch.stop)

    def connect(self):
        conn = sqlite3.connect(self.db, uri=True)
        conn.row_factory = sqlite3.Row
        return conn

    def test_non_exam_routes_ignore_historical_running_attempts(self):
        for path in (None, "/dashboard", "/pyqs", "/tests", "/practice", "/progress",
                     "/weaknesses", "/goals", "/login", "/results/old-running", "/exam", "/exam/id/extra"):
            with self.subTest(path=path):
                self.assertFalse(is_exam_running("student", path))

    def test_current_owned_running_exam_is_blocked(self):
        self.assertTrue(is_exam_running("student", "/exam/current-running"))

    def test_submitted_or_inaccessible_exam_is_not_live(self):
        for attempt in ("submitted", "auto-submitted", "flagged", "missing", "other-student"):
            with self.subTest(attempt=attempt):
                self.assertFalse(is_exam_running("student", "/exam/" + attempt))

    def test_submission_is_observed_without_cached_state(self):
        self.assertTrue(is_exam_running("student", "/exam/current-running"))
        with closing(self.connect()) as conn:
            conn.execute("UPDATE attempts SET status='SUBMITTED' WHERE id='current-running'")
            conn.commit()
        self.assertFalse(is_exam_running("student", "/exam/current-running"))
        self.assertFalse(is_exam_running("student", "/dashboard"))

    def test_switching_attempts_uses_current_route(self):
        self.assertTrue(is_exam_running("student", "/exam/current-running"))
        self.assertFalse(is_exam_running("student", "/exam/submitted"))
        self.assertTrue(is_exam_running("student", "/exam/old-running"))

    @patch("app.ai.urlopen")
    def test_live_exam_never_calls_provider_even_with_missing_or_stale_id(self, provider):
        for stale_id in (None, "submitted", "old-running"):
            result = generate_chat_response("student", "Help me", stale_id,
                                            {"pathname": "/exam/current-running"})
            self.assertEqual(result["mode"], "EXAM_BLOCKED")
        provider.assert_not_called()

    @patch("app.ai.urlopen")
    def test_dashboard_with_stale_id_calls_provider_and_returns_generated_text(self, provider):
        provider.return_value.__enter__.return_value.read.return_value = json.dumps({
            "choices": [{"message": {"content": "Generated Newton explanation"}}]
        }).encode()
        result = generate_chat_response("student", "Explain Newton's second law", "old-running",
                                        {"pathname": "/dashboard"})
        self.assertEqual(result["reply"], "Generated Newton explanation")
        self.assertEqual(result["mode"], "HELPFUL")
        request = provider.call_args.args[0]
        payload = json.loads(request.data)
        actual = json.loads(payload["messages"][1]["content"])
        self.assertEqual(actual["question"], "Explain Newton's second law")
        self.assertEqual(actual["student_performance"]["weaknesses"], [])
        self.assertEqual(payload["model"], "test-model")
        self.assertEqual(request.full_url, "https://api.groq.com/openai/v1/chat/completions")
        self.assertEqual(request.get_header("Authorization"), "Bearer test-secret")
        self.assertNotIn("test-secret", request.full_url)
        self.assertNotIn("test-secret", json.dumps(result))

    @patch("app.ai.urlopen")
    def test_new_student_without_attempts_can_chat(self, provider):
        provider.return_value.__enter__.return_value.read.return_value = b'{"choices":[{"message":{"content":"Hello new student"}}]}'
        self.assertEqual(generate_chat_response("new-student", "Hello", context={"pathname": "/pyqs"})["reply"],
                         "Hello new student")

    @patch("app.ai.urlopen")
    def test_malformed_or_empty_provider_output_is_not_an_ai_answer(self, provider):
        for body in ({}, {"choices": []}, {"choices": [{"message": {"content": None}}]},
                     {"choices": [{"message": {"content": " "}}]}):
            with self.subTest(body=body):
                provider.return_value.__enter__.return_value.read.return_value = json.dumps(body).encode()
                with self.assertLogs("app.ai", level="WARNING"):
                    with self.assertRaises(RuntimeError):
                        generate_chat_response("student", "Hello", context={"pathname": "/dashboard"})

    @patch("app.ai.urlopen")
    def test_provider_error_is_reported_without_fake_answer_or_secret_log(self, provider):
        provider.side_effect = HTTPError("https://provider", 429, "rate limited", {}, io.BytesIO())
        with self.assertLogs("app.ai", level="WARNING") as logs:
            with self.assertRaisesRegex(RuntimeError, "rate or usage limit"):
                generate_chat_response("student", "Hello", context={"pathname": "/dashboard"})
        self.assertIn("429", " ".join(logs.output))
        self.assertNotIn("test-secret", " ".join(logs.output))

    @patch("app.ai.urlopen")
    def test_invalid_groq_key_has_actionable_error_without_secret_log(self, provider):
        provider.side_effect = HTTPError("https://provider", 401, "Unauthorized", {}, io.BytesIO())
        with self.assertLogs("app.ai", level="WARNING") as logs:
            with self.assertRaisesRegex(RuntimeError, "Groq.*credentials"):
                generate_chat_response("student", "Hello", context={"pathname": "/pyqs"})
        self.assertIn("401", " ".join(logs.output))
        self.assertNotIn("test-secret", " ".join(logs.output))

    @patch("app.ai.urlopen")
    def test_reasoning_model_uses_low_effort_without_exposing_reasoning(self, provider):
        with patch.dict(os.environ, {"GROQ_MODEL": "openai/gpt-oss-20b"}):
            provider.return_value.__enter__.return_value.read.return_value = json.dumps({
                "choices": [{"finish_reason": "stop", "message": {
                    "content": "Generated explanation", "reasoning": "private reasoning"}}]
            }).encode()
            result = generate_chat_response("student", "Explain King's rule", context={"pathname": "/dashboard"})
        payload = json.loads(provider.call_args.args[0].data)
        self.assertEqual(payload["reasoning_effort"], "low")
        self.assertFalse(payload["include_reasoning"])
        self.assertEqual(result["reply"], "Generated explanation")
        self.assertNotIn("private reasoning", json.dumps(result))

    @patch("app.ai.urlopen")
    def test_reasoning_only_length_limit_retries_with_more_answer_budget(self, provider):
        response = provider.return_value.__enter__.return_value
        response.read.side_effect = [
            json.dumps({"choices": [{"finish_reason": "length", "message": {
                "content": "", "reasoning": "not a visible answer"}}]}).encode(),
            json.dumps({"choices": [{"finish_reason": "stop", "message": {
                "content": "A complete generated explanation"}}]}).encode(),
        ]
        with self.assertLogs("app.ai", level="INFO") as logs:
            result = generate_chat_response("student", "Explain King's rule", context={"pathname": "/dashboard"})
        self.assertEqual(result["reply"], "A complete generated explanation")
        self.assertEqual(provider.call_count, 2)
        budgets = [json.loads(call.args[0].data)["max_completion_tokens"] for call in provider.call_args_list]
        self.assertEqual(budgets, [4096, 6144])
        self.assertNotIn("not a visible answer", " ".join(logs.output))

    @patch("app.ai.urlopen")
    def test_repeated_truncation_stops_after_one_retry(self, provider):
        provider.return_value.__enter__.return_value.read.return_value = json.dumps({
            "choices": [{"finish_reason": "length", "message": {"content": "partial answer"}}]
        }).encode()
        with self.assertLogs("app.ai", level="WARNING"):
            with self.assertRaisesRegex(RuntimeError, "generation limit"):
                generate_chat_response("student", "Explain King's rule", context={"pathname": "/dashboard"})
        self.assertEqual(provider.call_count, 2)

    @patch("app.ai.urlopen")
    def test_named_concept_uses_existing_question_reference(self, provider):
        provider.return_value.__enter__.return_value.read.return_value = b'{"choices":[{"message":{"content":"Generated explanation"}}]}'
        generate_chat_response("student", "explain king's rule in integrals", context={"pathname": "/dashboard"})
        payload = json.loads(provider.call_args.args[0].data)
        context = json.loads(payload["messages"][1]["content"])
        self.assertEqual(context["reference_material"][0]["concept"], "Definite Integrals and King's Property")
        self.assertIn("f(a+b-x)", context["reference_material"][0]["explanation"])


if __name__ == "__main__":
    unittest.main()
