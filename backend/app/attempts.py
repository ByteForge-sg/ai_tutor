import json
import uuid
import datetime
from typing import Dict, Any, List, Optional
from app.database import get_db_connection
from app.mistakes import diagnose_mistake, update_weakness_profile, datetime_now_iso


def get_test_attempt_result(attempt_id: str, user_id: str) -> Dict[str, Any]:
    """Build a report from the answer rows already persisted for an attempt."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM attempts WHERE id = ? AND user_id = ?", (attempt_id, user_id))
    attempt = cursor.fetchone()
    if not attempt:
        conn.close()
        raise ValueError("Attempt not found")
    cursor.execute("SELECT * FROM tests WHERE id = ?", (attempt["test_id"],))
    test = cursor.fetchone()
    cursor.execute("""
        SELECT qa.*, q.question_text, q.options_json, q.concept, q.explanation, q.common_mistake
        FROM question_attempts qa JOIN questions q ON q.id = qa.question_id
        WHERE qa.attempt_id = ? AND qa.user_id = ?
    """, (attempt_id, user_id))
    rows = {row["question_id"]: row for row in cursor.fetchall()}
    question_ids = json.loads(test["question_ids_json"]) if test else list(rows)
    subject_map: Dict[str, Dict[str, Any]] = {}
    question_results = []
    for question_id in question_ids:
        row = rows.get(question_id)
        if row is None:
            continue
        subject = row["subject"]
        stats = subject_map.setdefault(subject, {"subject": subject, "total_questions": 0, "attempted": 0, "correct": 0, "incorrect": 0, "score": 0, "total_time": 0})
        stats["total_questions"] += 1
        unanswered = row["is_correct"] == -1 or not row["selected_answer"]
        correct = row["is_correct"] == 1
        marks = (test["marking_unattempted"] if test else 0) if unanswered else ((test["marking_correct"] if test else 4) if correct else (test["marking_incorrect"] if test else -1))
        if not unanswered:
            stats["attempted"] += 1
            stats["correct" if correct else "incorrect"] += 1
            stats["score"] += marks
        stats["total_time"] += row["time_taken_seconds"]
        question_results.append({
            "question_id": question_id,
            "question_text": row["question_text"],
            "options": json.loads(row["options_json"]),
            "selected_answer": row["selected_answer"],
            "correct_answer": row["correct_answer"],
            "is_correct": correct,
            "is_unattempted": unanswered,
            "time_taken_seconds": row["time_taken_seconds"],
            "marks_awarded": marks,
            "concept": row["concept"],
            "explanation": row["explanation"],
            "common_mistake": row["common_mistake"],
            "mistake_type": row["mistake_type"],
            "ai_diagnosis": json.loads(row["ai_diagnosis_json"]) if row["ai_diagnosis_json"] else None,
        })
    subject_breakdown = []
    for stats in subject_map.values():
        attempted = stats["attempted"]
        subject_breakdown.append({
            "subject": stats["subject"], "total_questions": stats["total_questions"],
            "attempted": attempted, "correct": stats["correct"], "incorrect": stats["incorrect"],
            "accuracy_percent": round(stats["correct"] / attempted * 100, 1) if attempted else 0.0,
            "score": stats["score"],
            "avg_time_seconds": round(stats["total_time"] / stats["total_questions"]) if stats["total_questions"] else 0,
        })
    conn.close()
    attempted = (attempt["correct_count"] or 0) + (attempt["incorrect_count"] or 0)
    return {
        "attempt_id": attempt["id"], "test_id": attempt["test_id"],
        "test_title": attempt["test_title"] or "Test Evaluation", "exam": attempt["exam"],
        "status": attempt["status"], "started_at": attempt["started_at"],
        "submitted_at": attempt["submitted_at"] or attempt["started_at"],
        "score": attempt["score"] or 0, "max_score": attempt["max_score"] or 0,
        "accuracy_percent": round((attempt["correct_count"] or 0) / attempted * 100, 1) if attempted else 0.0,
        "total_questions": attempt["total_questions"], "correct_count": attempt["correct_count"] or 0,
        "incorrect_count": attempt["incorrect_count"] or 0, "unanswered_count": attempt["unanswered_count"] or 0,
        "time_used_seconds": attempt["time_taken_seconds"] or 0,
        "integrity_flags_count": attempt["integrity_flags_count"] or 0,
        "subject_breakdown": subject_breakdown, "question_results": question_results,
    }

def create_test_attempt(test_id: str, user_id: str) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM tests WHERE id = ?", (test_id,))
    test = cursor.fetchone()
    if not test:
        conn.close()
        raise ValueError(f"Test with id '{test_id}' not found")

    attempt_id = f"attempt-{uuid.uuid4().hex[:8]}"
    now = datetime.datetime.now(datetime.timezone.utc)
    duration_seconds = test["duration_minutes"] * 60
    deadline = now + datetime.timedelta(seconds=duration_seconds)

    cursor.execute("""
        INSERT INTO attempts (
            id, user_id, attempt_type, test_id, test_title, exam, status,
            started_at, deadline_at, score, max_score, total_questions,
            correct_count, incorrect_count, unanswered_count, time_taken_seconds, integrity_flags_count
        ) VALUES (?, ?, 'TEST', ?, ?, ?, 'RUNNING', ?, ?, 0, ?, ?, 0, 0, ?, 0, 0)
    """, (
        attempt_id,
        user_id,
        test["id"],
        test["title"],
        test["exam"],
        now.isoformat(),
        deadline.isoformat(),
        test["total_marks"],
        test["questions_count"],
        test["questions_count"]
    ))

    # Fetch question list
    q_ids = json.loads(test["question_ids_json"])
    placeholders = ",".join("?" for _ in q_ids)
    cursor.execute(f"SELECT * FROM questions WHERE id IN ({placeholders})", q_ids)
    q_rows = cursor.fetchall()
    q_map = {r["id"]: r for r in q_rows}

    ordered_questions = []
    for qid in q_ids:
        if qid in q_map:
            r = q_map[qid]
            ordered_questions.append({
                "id": r["id"],
                "exam": r["exam"],
                "subject": r["subject"],
                "chapter": r["chapter"],
                "topic": r["topic"],
                "difficulty": r["difficulty"],
                "question_text": r["question_text"],
                "options": json.loads(r["options_json"]),
                "source_type": r["source_type"],
                "year": r["year"]
            })

    conn.commit()
    conn.close()

    return {
        "id": attempt_id,
        "test_id": test["id"],
        "test_title": test["title"],
        "exam": test["exam"],
        "status": "RUNNING",
        "started_at": now.isoformat(),
        "deadline_at": deadline.isoformat(),
        "duration_seconds": duration_seconds,
        "time_remaining_seconds": duration_seconds,
        "total_questions": len(ordered_questions),
        "questions": ordered_questions,
        "answers": {},
        "review_status": {}
    }

def get_active_test_attempt(attempt_id: str) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM attempts WHERE id = ?", (attempt_id,))
    attempt = cursor.fetchone()
    if not attempt:
        conn.close()
        raise ValueError("Attempt not found")

    test_id = attempt["test_id"]
    cursor.execute("SELECT * FROM tests WHERE id = ?", (test_id,))
    test = cursor.fetchone()

    # Calculate remaining time from server deadline
    now = datetime.datetime.now(datetime.timezone.utc)
    deadline = datetime.datetime.fromisoformat(attempt["deadline_at"])
    time_remaining_seconds = max(0, int((deadline - now).total_seconds()))

    # If time expired, auto-submit
    if time_remaining_seconds == 0 and attempt["status"] == "RUNNING":
        cursor.execute("UPDATE attempts SET status = 'AUTO_SUBMITTED' WHERE id = ?", (attempt_id,))
        conn.commit()
        status = "AUTO_SUBMITTED"
    else:
        status = attempt["status"]

    q_ids = json.loads(test["question_ids_json"])
    placeholders = ",".join("?" for _ in q_ids)
    cursor.execute(f"SELECT * FROM questions WHERE id IN ({placeholders})", q_ids)
    q_rows = cursor.fetchall()
    q_map = {r["id"]: r for r in q_rows}

    ordered_questions = []
    for qid in q_ids:
        if qid in q_map:
            r = q_map[qid]
            ordered_questions.append({
                "id": r["id"],
                "exam": r["exam"],
                "subject": r["subject"],
                "chapter": r["chapter"],
                "topic": r["topic"],
                "difficulty": r["difficulty"],
                "question_text": r["question_text"],
                "options": json.loads(r["options_json"]),
                "source_type": r["source_type"],
                "year": r["year"]
            })

    # Fetch recorded answers so far for this attempt
    cursor.execute("SELECT question_id, selected_answer FROM question_attempts WHERE attempt_id = ?", (attempt_id,))
    qa_rows = cursor.fetchall()
    answers = {r["question_id"]: r["selected_answer"] for r in qa_rows if r["selected_answer"]}

    conn.close()

    duration_seconds = test["duration_minutes"] * 60
    return {
        "id": attempt_id,
        "test_id": test["id"],
        "test_title": test["title"],
        "exam": test["exam"],
        "status": status,
        "started_at": attempt["started_at"],
        "deadline_at": attempt["deadline_at"],
        "duration_seconds": duration_seconds,
        "time_remaining_seconds": time_remaining_seconds,
        "total_questions": len(ordered_questions),
        "questions": ordered_questions,
        "answers": answers,
        "review_status": {}
    }

def save_attempt_answer(attempt_id: str, user_id: str, question_id: str, selected_answer: Optional[str]) -> None:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("BEGIN IMMEDIATE")
    cursor.execute("SELECT user_id, test_id, status FROM attempts WHERE id = ?", (attempt_id,))
    attempt = cursor.fetchone()
    if not attempt or attempt["user_id"] != user_id:
        conn.close()
        raise ValueError("Attempt not found")
    if attempt["status"] != "RUNNING":
        conn.close()
        raise ValueError("Attempt is not active")
    cursor.execute("SELECT question_ids_json FROM tests WHERE id = ?", (attempt["test_id"],))
    test = cursor.fetchone()
    if not test or question_id not in json.loads(test["question_ids_json"]):
        conn.close()
        raise ValueError("Question is not part of this test")
    cursor.execute("SELECT * FROM questions WHERE id = ?", (question_id,))
    question = cursor.fetchone()
    if not question:
        conn.close()
        raise ValueError("Question not found")
    now = datetime_now_iso()
    cursor.execute("""
        INSERT OR REPLACE INTO question_attempts (
            id, attempt_id, user_id, question_id, selected_answer, correct_answer,
            is_correct, time_taken_seconds, timestamp, activity_date,
            exam, subject, chapter, topic, difficulty, mistake_type, ai_diagnosis_json
        ) VALUES (?, ?, ?, ?, ?, ?, -1, 0, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)
    """, (f"test-qa-{attempt_id}-{question_id}", attempt_id, user_id, question_id,
          selected_answer or None, question["correct_answer"], now,
          datetime.datetime.now(datetime.timezone.utc).date().isoformat(),
          question["exam"], question["subject"], question["chapter"],
          question["topic"], question["difficulty"]))
    conn.commit()
    conn.close()

def record_integrity_event(attempt_id: str, event_type: str, details: Optional[str] = None) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()

    event_id = f"integ-{uuid.uuid4().hex[:8]}"
    now = datetime_now_iso()

    cursor.execute("""
        INSERT INTO integrity_events (id, attempt_id, event_type, timestamp, details)
        VALUES (?, ?, ?, ?, ?)
    """, (event_id, attempt_id, event_type, now, details))

    # Increment integrity count on attempt
    cursor.execute("""
        UPDATE attempts
        SET integrity_flags_count = integrity_flags_count + 1
        WHERE id = ?
    """, (attempt_id,))

    cursor.execute("SELECT integrity_flags_count FROM attempts WHERE id = ?", (attempt_id,))
    flags_count = cursor.fetchone()[0]

    # If excessive violations (e.g. >= 4), flag attempt
    if flags_count >= 4:
        cursor.execute("UPDATE attempts SET status = 'FLAGGED' WHERE id = ? AND status = 'RUNNING'", (attempt_id,))

    conn.commit()
    conn.close()

    warning_level = "warning" if flags_count == 1 else ("strong_warning" if flags_count < 4 else "flagged")
    return {
        "event_id": event_id,
        "flags_count": flags_count,
        "warning_level": warning_level,
        "message": f"Integrity Event Recorded: {event_type}. Controlled exam environment monitoring active."
    }

def submit_test_attempt(attempt_id: str, answers: Dict[str, str], user_id: str) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("BEGIN IMMEDIATE")
    cursor.execute("SELECT * FROM attempts WHERE id = ? AND user_id = ?", (attempt_id, user_id))
    attempt = cursor.fetchone()
    if not attempt:
        conn.rollback()
        conn.close()
        raise ValueError("Attempt not found")
    if attempt["status"] == "SUBMITTED" or (attempt["status"] == "AUTO_SUBMITTED" and attempt["submitted_at"]):
        conn.rollback()
        conn.close()
        return get_test_attempt_result(attempt_id, user_id)
    if attempt["status"] not in ("RUNNING", "AUTO_SUBMITTED"):
        conn.rollback()
        conn.close()
        raise ValueError("Attempt is not active")

    cursor.execute("SELECT * FROM tests WHERE id = ?", (attempt["test_id"],))
    test = cursor.fetchone()
    if not test:
        conn.rollback()
        conn.close()
        raise ValueError("Test not found")
    question_ids = json.loads(test["question_ids_json"])
    if not question_ids:
        conn.rollback()
        conn.close()
        raise ValueError("Test has no questions")
    placeholders = ",".join("?" for _ in question_ids)
    cursor.execute(f"SELECT * FROM questions WHERE id IN ({placeholders})", question_ids)
    questions = {row["id"]: dict(row) for row in cursor.fetchall()}
    cursor.execute("SELECT question_id, selected_answer FROM question_attempts WHERE attempt_id = ? AND user_id = ?", (attempt_id, user_id))
    final_answers = {row["question_id"]: row["selected_answer"] for row in cursor.fetchall()}
    final_answers.update({key: value for key, value in answers.items() if key in question_ids})

    correct_count = incorrect_count = unanswered_count = total_score = 0
    now = datetime.datetime.now(datetime.timezone.utc)
    now_iso = now.isoformat()
    today_iso = now.date().isoformat()
    started_at = datetime.datetime.fromisoformat(attempt["started_at"])
    if started_at.tzinfo is None:
        started_at = started_at.replace(tzinfo=datetime.timezone.utc)
    time_used = min(test["duration_minutes"] * 60, max(0, int((now - started_at).total_seconds())))
    per_question_time = max(0, time_used // max(1, len(question_ids)))

    for question_id in question_ids:
        question = questions.get(question_id)
        if question is None:
            continue
        selected = final_answers.get(question_id)
        if not selected:
            correctness = -1
            unanswered_count += 1
            marks = test["marking_unattempted"]
        elif selected == question["correct_answer"]:
            correctness = 1
            correct_count += 1
            marks = test["marking_correct"]
        else:
            correctness = 0
            incorrect_count += 1
            marks = test["marking_incorrect"]
        total_score += marks
        cursor.execute("""
            INSERT OR REPLACE INTO question_attempts (
                id, attempt_id, user_id, question_id, selected_answer, correct_answer,
                is_correct, time_taken_seconds, timestamp, activity_date,
                exam, subject, chapter, topic, difficulty, mistake_type, ai_diagnosis_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)
        """, (f"test-qa-{attempt_id}-{question_id}", attempt_id, user_id, question_id,
              selected or None, question["correct_answer"], correctness, per_question_time,
              now_iso, today_iso, question["exam"], question["subject"], question["chapter"],
              question["topic"], question["difficulty"]))

    final_status = "AUTO_SUBMITTED" if attempt["status"] == "AUTO_SUBMITTED" else "SUBMITTED"
    cursor.execute("""
        UPDATE attempts SET status = ?, submitted_at = ?, score = ?,
            correct_count = ?, incorrect_count = ?, unanswered_count = ?, time_taken_seconds = ?
        WHERE id = ? AND user_id = ? AND status IN ('RUNNING', 'AUTO_SUBMITTED')
    """, (final_status, now_iso, total_score, correct_count, incorrect_count, unanswered_count, time_used, attempt_id, user_id))
    conn.commit()
    conn.close()
    return get_test_attempt_result(attempt_id, user_id)


def process_attempt_analytics(attempt_id: str, user_id: str) -> bool:
    """Analyze incorrect answers once, after the fast result has been saved."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("BEGIN IMMEDIATE")
    cursor.execute("SELECT status, analysis_processed_at FROM attempts WHERE id = ? AND user_id = ?", (attempt_id, user_id))
    attempt = cursor.fetchone()
    if not attempt:
        conn.rollback()
        conn.close()
        raise ValueError("Attempt not found")
    if attempt["status"] not in ("SUBMITTED", "AUTO_SUBMITTED"):
        conn.rollback()
        conn.close()
        raise ValueError("Attempt has not been submitted")
    if attempt["analysis_processed_at"]:
        conn.rollback()
        conn.close()
        return False
    cursor.execute("""
        SELECT qa.question_id, qa.selected_answer, q.*
        FROM question_attempts qa JOIN questions q ON q.id = qa.question_id
        WHERE qa.attempt_id = ? AND qa.user_id = ? AND qa.is_correct = 0
    """, (attempt_id, user_id))
    for row in cursor.fetchall():
        question = dict(row)
        diagnosis = diagnose_mistake(question, row["selected_answer"] or "", time_taken_seconds=row["time_taken_seconds"] if "time_taken_seconds" in row.keys() else 60, user_id=user_id)
        cursor.execute("UPDATE question_attempts SET mistake_type = ?, ai_diagnosis_json = ? WHERE attempt_id = ? AND question_id = ? AND user_id = ?",
                       (diagnosis["mistakeType"], json.dumps(diagnosis), attempt_id, row["question_id"], user_id))
        update_weakness_profile(user_id, question, False, diagnosis["mistakeType"], connection=conn)
    cursor.execute("UPDATE attempts SET analysis_processed_at = ? WHERE id = ? AND user_id = ?",
                   (datetime_now_iso(), attempt_id, user_id))
    conn.commit()
    conn.close()
    return True

def record_practice_answer(user_id: str, question_id: str, selected_answer: str, time_taken_seconds: int = 45) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM questions WHERE id = ?", (question_id,))
    q = cursor.fetchone()
    if not q:
        conn.close()
        raise ValueError("Question not found")

    is_correct = (selected_answer == q["correct_answer"])
    now_iso = datetime_now_iso()
    today_iso = datetime.date.today().isoformat()

    mistake_type = None
    ai_diag = None

    if not is_correct:
        ai_diag = diagnose_mistake(dict(q), selected_answer, time_taken_seconds, user_id=user_id)
        mistake_type = ai_diag["mistakeType"]

    qa_id = f"prac-qa-{uuid.uuid4().hex[:8]}"
    cursor.execute("""
        INSERT INTO question_attempts (
            id, attempt_id, user_id, question_id, selected_answer, correct_answer,
            is_correct, time_taken_seconds, timestamp, activity_date,
            exam, subject, chapter, topic, difficulty, mistake_type, ai_diagnosis_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        qa_id,
        f"prac-session-{today_iso}",
        user_id,
        q["id"],
        selected_answer,
        q["correct_answer"],
        1 if is_correct else 0,
        time_taken_seconds,
        now_iso,
        today_iso,
        q["exam"],
        q["subject"],
        q["chapter"],
        q["topic"],
        q["difficulty"],
        mistake_type,
        json.dumps(ai_diag) if ai_diag else None
    ))
    conn.commit()

    # Update weakness profile in real time
    try:
        update_weakness_profile(user_id, dict(q), is_correct, mistake_type)
    except Exception as e:
        print(f"Weakness update warning: {e}")

    # Check today's total solved questions to return updated streak info
    cursor.execute("SELECT COUNT(*) FROM question_attempts WHERE user_id = ? AND activity_date = ?", (user_id, today_iso))
    today_solved = cursor.fetchone()[0]

    conn.close()

    return {
        "is_correct": is_correct,
        "correct_answer": q["correct_answer"],
        "selected_answer": selected_answer,
        "explanation": q["explanation"],
        "concept": q["concept"],
        "common_mistake": q["common_mistake"],
        "mistake_type": mistake_type,
        "ai_diagnosis": ai_diag,
        "streak_updated": 1 if today_solved >= 5 else 0,
        "questions_solved_today": today_solved
    }
