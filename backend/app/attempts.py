import json
import uuid
import datetime
from typing import Dict, Any, List, Optional
from app.database import get_db_connection
from app.mistakes import diagnose_mistake, update_weakness_profile, datetime_now_iso

def create_test_attempt(test_id: str, user_id: str = "user_demo") -> Dict[str, Any]:
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

def submit_test_attempt(attempt_id: str, answers: Dict[str, str], user_id: str = "user_demo") -> Dict[str, Any]:
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

    q_ids = json.loads(test["question_ids_json"])
    placeholders = ",".join("?" for _ in q_ids)
    cursor.execute(f"SELECT * FROM questions WHERE id IN ({placeholders})", q_ids)
    q_rows = cursor.fetchall()
    q_map = {r["id"]: dict(r) for r in q_rows}

    # Evaluate scoring: JEE (+4, -1, 0)
    total_score = 0
    correct_count = 0
    incorrect_count = 0
    unanswered_count = 0

    now_iso = datetime_now_iso()
    today_iso = datetime.date.today().isoformat()

    started_at = datetime.datetime.fromisoformat(attempt["started_at"])
    now = datetime.datetime.now(datetime.timezone.utc)
    time_used_seconds = min(test["duration_minutes"] * 60, int((now - started_at).total_seconds()))

    question_results = []
    subject_stats: Dict[str, Dict[str, Any]] = {}

    for qid in q_ids:
        q = q_map.get(qid)
        if not q:
            continue

        subj = q["subject"]
        if subj not in subject_stats:
            subject_stats[subj] = {
                "subject": subj,
                "total_questions": 0,
                "attempted": 0,
                "correct": 0,
                "incorrect": 0,
                "score": 0,
                "total_time": 0
            }

        subject_stats[subj]["total_questions"] += 1
        selected = answers.get(qid)

        is_unattempted = (selected is None or selected == "")
        is_corr = False
        marks = 0
        mistake_type = None
        ai_diag = None

        if is_unattempted:
            unanswered_count += 1
            is_corr_val = -1
            marks = test["marking_unattempted"]
        elif selected == q["correct_answer"]:
            correct_count += 1
            is_corr = True
            is_corr_val = 1
            marks = test["marking_correct"]
            subject_stats[subj]["attempted"] += 1
            subject_stats[subj]["correct"] += 1
            subject_stats[subj]["score"] += marks
        else:
            incorrect_count += 1
            is_corr = False
            is_corr_val = 0
            marks = test["marking_incorrect"]
            subject_stats[subj]["attempted"] += 1
            subject_stats[subj]["incorrect"] += 1
            subject_stats[subj]["score"] += marks

            # Trigger AI Mistake Diagnosis
            ai_diag = diagnose_mistake(q, selected, time_taken_seconds=60, user_id=user_id)
            mistake_type = ai_diag["mistakeType"]

            # Update weakness profile in real time!
            update_weakness_profile(user_id, q, is_correct=False, mistake_type=mistake_type)

        total_score += marks
        q_time = max(30, time_used_seconds // max(1, len(q_ids)))
        subject_stats[subj]["total_time"] += q_time

        # Store in question_attempts to feed the feedback loop!
        cursor.execute("""
            INSERT OR REPLACE INTO question_attempts (
                id, attempt_id, user_id, question_id, selected_answer, correct_answer,
                is_correct, time_taken_seconds, timestamp, activity_date,
                exam, subject, chapter, topic, difficulty, mistake_type, ai_diagnosis_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            f"test-qa-{attempt_id}-{qid}",
            attempt_id,
            user_id,
            qid,
            selected,
            q["correct_answer"],
            is_corr_val,
            q_time,
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

        question_results.append({
            "question_id": qid,
            "question_text": q["question_text"],
            "options": json.loads(q["options_json"]),
            "selected_answer": selected,
            "correct_answer": q["correct_answer"],
            "is_correct": is_corr,
            "is_unattempted": is_unattempted,
            "time_taken_seconds": q_time,
            "marks_awarded": marks,
            "concept": q["concept"],
            "explanation": q["explanation"],
            "common_mistake": q["common_mistake"],
            "mistake_type": mistake_type,
            "ai_diagnosis": ai_diag
        })

    total_attempted = correct_count + incorrect_count
    accuracy = round((correct_count / total_attempted * 100), 1) if total_attempted > 0 else 0.0

    # Build subject breakdown list
    subject_breakdown = []
    for s_name, s_data in subject_stats.items():
        att = s_data["attempted"]
        s_acc = round((s_data["correct"] / att * 100), 1) if att > 0 else 0.0
        avg_t = round(s_data["total_time"] / s_data["total_questions"]) if s_data["total_questions"] > 0 else 0
        subject_breakdown.append({
            "subject": s_name,
            "total_questions": s_data["total_questions"],
            "attempted": att,
            "correct": s_data["correct"],
            "incorrect": s_data["incorrect"],
            "accuracy_percent": s_acc,
            "score": s_data["score"],
            "avg_time_seconds": avg_t
        })

    cursor.execute("""
        UPDATE attempts
        SET status = 'SUBMITTED',
            submitted_at = ?,
            score = ?,
            correct_count = ?,
            incorrect_count = ?,
            unanswered_count = ?,
            time_taken_seconds = ?
        WHERE id = ?
    """, (now_iso, total_score, correct_count, incorrect_count, unanswered_count, time_used_seconds, attempt_id))

    conn.commit()
    conn.close()

    return {
        "attempt_id": attempt_id,
        "test_id": test["id"],
        "test_title": test["title"],
        "exam": test["exam"],
        "status": "SUBMITTED",
        "started_at": attempt["started_at"],
        "submitted_at": now_iso,
        "score": total_score,
        "max_score": test["total_marks"],
        "accuracy_percent": accuracy,
        "total_questions": len(q_ids),
        "correct_count": correct_count,
        "incorrect_count": incorrect_count,
        "unanswered_count": unanswered_count,
        "time_used_seconds": time_used_seconds,
        "integrity_flags_count": attempt["integrity_flags_count"] or 0,
        "subject_breakdown": subject_breakdown,
        "question_results": question_results
    }

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
