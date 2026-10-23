import datetime
import sqlite3
from typing import Dict, Any, List, Optional
from app.database import get_db_connection

def calculate_streak(active_dates_set: set, reference_date: datetime.date) -> tuple[int, int]:
    """
    Calculates current streak and longest streak.
    A day counts toward a streak when the student completes at least 5 questions.
    """
    if not active_dates_set:
        return 0, 0

    # Determine current streak
    current_streak = 0
    check_date = reference_date

    # If student didn't practice today yet, streak might still be intact from yesterday
    if check_date not in active_dates_set:
        check_date = reference_date - datetime.timedelta(days=1)

    while check_date in active_dates_set:
        current_streak += 1
        check_date -= datetime.timedelta(days=1)

    # Calculate longest streak across all active dates
    sorted_dates = sorted(list(active_dates_set))
    longest_streak = 0
    temp_streak = 0
    prev_date = None

    for d in sorted_dates:
        if prev_date is None:
            temp_streak = 1
        elif d == prev_date + datetime.timedelta(days=1):
            temp_streak += 1
        else:
            temp_streak = 1
        prev_date = d
        if temp_streak > longest_streak:
            longest_streak = temp_streak

    return current_streak, max(longest_streak, current_streak)

def get_dashboard_analytics(user_id: str, exam: str = "JEE") -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()

    # User details
    cursor.execute("SELECT id, email, name, target_exam, avatar, created_at FROM users WHERE id = ?", (user_id,))
    user_row = cursor.fetchone()
    if not user_row:
        conn.close()
        raise ValueError("User not found")
    user_data = dict(user_row)

    # 1. Total questions solved (completed attempts)
    cursor.execute("""
        SELECT SUM(CASE WHEN is_correct != -1 THEN 1 ELSE 0 END),
               SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END),
               SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END)
        FROM question_attempts
        WHERE user_id = ? AND exam = ?
    """, (user_id, exam))
    agg = cursor.fetchone()
    total_solved = agg[0] or 0
    total_correct = agg[1] or 0
    total_incorrect = agg[2] or 0
    total_answered = total_correct + total_incorrect
    overall_accuracy = round((total_correct / total_answered * 100), 1) if total_answered > 0 else 0.0
    today = datetime.datetime.now(datetime.timezone.utc).date()

    month_start = today.replace(day=1)
    previous_month_end = month_start - datetime.timedelta(days=1)
    previous_month_start = previous_month_end.replace(day=1)
    cursor.execute("""
        SELECT COUNT(*) FROM question_attempts
        WHERE user_id = ? AND exam = ? AND is_correct != -1
          AND activity_date >= ? AND activity_date < ?
    """, (user_id, exam, month_start.isoformat(), (month_start + datetime.timedelta(days=32)).replace(day=1).isoformat()))
    this_month_questions = cursor.fetchone()[0] or 0
    cursor.execute("""
        SELECT COUNT(*) FROM question_attempts
        WHERE user_id = ? AND exam = ? AND is_correct != -1
          AND activity_date >= ? AND activity_date < ?
    """, (user_id, exam, previous_month_start.isoformat(), month_start.isoformat()))
    previous_month_questions = cursor.fetchone()[0] or 0
    monthly_growth = round((this_month_questions - previous_month_questions) / previous_month_questions * 100, 1) if previous_month_questions else None

    cursor.execute("""
        SELECT subject, SUM(CASE WHEN is_correct != -1 THEN 1 ELSE 0 END) AS solved,
               SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS correct,
               SUM(CASE WHEN is_correct != -1 THEN 1 ELSE 0 END) AS attempted
        FROM question_attempts
        WHERE user_id = ? AND exam = ?
        GROUP BY subject ORDER BY subject
    """, (user_id, exam))
    subject_performance = [
        {"subject": r["subject"], "solved": r["solved"],
         "accuracy": round(r["correct"] / r["attempted"] * 100, 1) if r["attempted"] else None}
        for r in cursor.fetchall()
    ]

    cursor.execute("""
        SELECT substr(activity_date, 1, 7) AS month,
               COUNT(*) AS questions,
               SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS correct,
               SUM(CASE WHEN is_correct != -1 THEN 1 ELSE 0 END) AS attempted
        FROM question_attempts
        WHERE user_id = ? AND exam = ? AND is_correct != -1 AND activity_date >= ?
        GROUP BY substr(activity_date, 1, 7) ORDER BY month
    """, (user_id, exam, (today - datetime.timedelta(days=180)).isoformat()))
    monthly_trends = [
        {"month": r["month"], "questions": r["questions"],
         "accuracy": round(r["correct"] / r["attempted"] * 100, 1) if r["attempted"] else None}
        for r in cursor.fetchall()
    ]

    # 2. Total tests completed
    cursor.execute("""
        SELECT COUNT(*) FROM attempts
        WHERE user_id = ? AND exam = ? AND status IN ('SUBMITTED', 'AUTO_SUBMITTED')
    """, (user_id, exam))
    tests_completed = cursor.fetchone()[0] or 0

    # 3. Daily activity breakdown for past 180 days (6 months)
    start_date = today - datetime.timedelta(days=180)

    cursor.execute("""
        SELECT activity_date,
               COUNT(*) as total_attempts,
               SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct,
               SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) as incorrect,
               SUM(time_taken_seconds) as total_time,
               SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) as mistakes
        FROM question_attempts
        WHERE user_id = ? AND exam = ? AND activity_date >= ? AND is_correct != -1
        GROUP BY activity_date
        ORDER BY activity_date ASC
    """, (user_id, exam, start_date.isoformat()))
    
    rows = cursor.fetchall()
    daily_map = {}
    streak_qualifying_dates = set()

    for r in rows:
        d_str = r["activity_date"]
        q_count = r["total_attempts"]
        c_count = r["correct"] or 0
        i_count = r["incorrect"] or 0
        acc = round((c_count / q_count) * 100, 1) if q_count > 0 else 0.0
        time_min = round((r["total_time"] or 0) / 60)
        mistakes = r["mistakes"] or 0

        # Level determination (0 to 5)
        if q_count == 0:
            level = 0
        elif 1 <= q_count <= 5:
            level = 1
        elif 6 <= q_count <= 15:
            level = 2
        elif 16 <= q_count <= 30:
            level = 3
        elif 31 <= q_count <= 50:
            level = 4
        else:
            level = 5

        daily_map[d_str] = {
            "date": d_str,
            "questions_solved": q_count,
            "correct_count": c_count,
            "incorrect_count": i_count,
            "accuracy_percent": acc,
            "practice_time_minutes": time_min,
            "mistakes_detected": mistakes,
            "level": level
        }

        # Day counts toward streak if at least 5 questions solved!
        if q_count >= 5:
            try:
                dt_obj = datetime.date.fromisoformat(d_str)
                streak_qualifying_dates.add(dt_obj)
            except Exception:
                pass

    # Build continuous 180-day calendar list
    calendar_days = []
    curr = start_date
    total_active_days = 0

    while curr <= today:
        d_iso = curr.isoformat()
        if d_iso in daily_map:
            calendar_days.append(daily_map[d_iso])
            total_active_days += 1
        else:
            calendar_days.append({
                "date": d_iso,
                "questions_solved": 0,
                "correct_count": 0,
                "incorrect_count": 0,
                "accuracy_percent": 0.0,
                "practice_time_minutes": 0,
                "mistakes_detected": 0,
                "level": 0
            })
        curr += datetime.timedelta(days=1)

    current_streak, longest_streak = calculate_streak(streak_qualifying_dates, today)

    # 4. Weakest Area
    cursor.execute("""
        SELECT id, topic, subject, chapter, mistake_type, occurrences, accuracy_percent, last_seen, trend
        FROM weaknesses
        WHERE user_id = ? AND exam = ?
        ORDER BY occurrences DESC, accuracy_percent ASC
        LIMIT 1
    """, (user_id, exam))
    weakest_row = cursor.fetchone()
    weakest_area = dict(weakest_row) if weakest_row else None
    cursor.execute("SELECT COUNT(*) FROM weaknesses WHERE user_id = ? AND exam = ?", (user_id, exam))
    weaknesses_count = cursor.fetchone()[0] or 0

    # 5. Recurring Mistake
    cursor.execute("""
        SELECT mistake_type, COUNT(*) as count, subject, chapter, topic,
               ROUND(AVG(CASE WHEN is_correct = 1 THEN 100.0 ELSE 0.0 END), 1) as avg_acc,
               MAX(timestamp) as last_seen
        FROM question_attempts
        WHERE user_id = ? AND exam = ? AND is_correct = 0 AND mistake_type IS NOT NULL
        GROUP BY mistake_type, subject, topic
        ORDER BY count DESC
        LIMIT 1
    """, (user_id, exam))
    rec_row = cursor.fetchone()
    recurring_mistake = None
    if rec_row:
        m_type = rec_row["mistake_type"]
        title_map = {
            "FORMULA_RECALL": "Incorrect formula selection",
            "CONCEPTUAL_MISUNDERSTANDING": "Fundamental concept gap",
            "CALCULATION_ERROR": "Arithmetic & algebraic sign slip",
            "WRONG_APPROACH": "Suboptimal strategy selection",
            "CARELESS_MISTAKE": "Premature submission & hasty read",
            "TIME_PRESSURE": "Solving hesitation under countdown",
            "MEMORY_ERROR": "Standard fact recall exception",
            "MISREAD_QUESTION": "Constraint oversight in problem text"
        }
        recurring_mistake = {
            "mistake_type": m_type,
            "display_title": title_map.get(m_type, m_type.replace("_", " ").title()),
            "occurrences": rec_row["count"],
            "subject": rec_row["subject"],
            "chapter": rec_row["chapter"],
            "topic": rec_row["topic"],
            "accuracy_percent": rec_row["avg_acc"] or 0.0,
            "last_seen": rec_row["last_seen"],
            "trend": "recurring" if rec_row["count"] >= 3 else "active"
        }

    # 6. Daily Goals for today
    today_iso = today.isoformat()
    today_activity = daily_map.get(today_iso, {
        "questions_solved": 0,
        "practice_time_minutes": 0
    })

    cursor.execute("""
        SELECT COUNT(*) FROM attempts
        WHERE user_id = ? AND exam = ? AND started_at LIKE ? AND status IN ('SUBMITTED', 'AUTO_SUBMITTED')
    """, (user_id, exam, f"{today_iso}%"))
    tests_today = cursor.fetchone()[0] or 0

    daily_goals = {
        "target_questions": 20,
        "completed_questions": today_activity["questions_solved"],
        "target_tests": 1,
        "completed_tests": tests_today,
        "target_minutes": 30,
        "completed_minutes": today_activity["practice_time_minutes"],
        "overall_percentage": min(100, round((today_activity["questions_solved"] / 20) * 100))
    }

    # 7. Recent activity (last 5 attempts)
    cursor.execute("""
        SELECT qa.id, qa.question_id, q.question_text, qa.selected_answer, qa.correct_answer,
               qa.is_correct, qa.time_taken_seconds, qa.timestamp, qa.topic, qa.mistake_type
        FROM question_attempts qa
        JOIN questions q ON qa.question_id = q.id
        WHERE qa.user_id = ? AND qa.exam = ? AND qa.is_correct != -1
        ORDER BY qa.timestamp DESC
        LIMIT 5
    """, (user_id, exam))
    recent_rows = cursor.fetchall()
    recent_activity = [dict(r) for r in recent_rows]

    conn.close()

    return {
        "user": user_data,
        "questions_solved": total_solved,
        "accuracy_percent": overall_accuracy,
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "tests_completed": tests_completed,
        "monthly_growth_percent": monthly_growth,
        "monthly_trends": monthly_trends,
        "subject_performance": subject_performance,
        "weakest_area": weakest_area,
        "weaknesses_count": weaknesses_count,
        "recurring_mistake": recurring_mistake,
        "daily_goals": daily_goals,
        "contribution_grid": {
            "start_date": start_date.isoformat(),
            "end_date": today.isoformat(),
            "total_active_days": total_active_days,
            "total_questions_solved": total_solved,
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "days": calendar_days
        },
        "recent_activity": recent_activity
    }
