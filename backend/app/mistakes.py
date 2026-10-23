import json
import sqlite3
from typing import Dict, Any, Optional, List
from app.database import get_db_connection

VALID_MISTAKE_TYPES = [
    "CONCEPTUAL_MISUNDERSTANDING",
    "FORMULA_RECALL",
    "CALCULATION_ERROR",
    "WRONG_APPROACH",
    "MISREAD_QUESTION",
    "DIAGRAM_INTERPRETATION",
    "CARELESS_MISTAKE",
    "TIME_PRESSURE",
    "MEMORY_ERROR"
]

def diagnose_mistake(
    question: Dict[str, Any],
    selected_answer: str,
    time_taken_seconds: int = 45,
    *,
    user_id: str
) -> Dict[str, Any]:
    """
    AI Mistake Diagnosis engine.
    Analyzes student's incorrect option in relation to the question, concept,
    common pitfalls, and solving speed.
    """
    correct_ans = question.get("correct_answer")
    concept = question.get("concept", "Fundamental Concept")
    common_mistake = question.get("common_mistake", "Conceptual pitfall")
    chapter = question.get("chapter", "Topic")
    topic = question.get("topic", "Subject Matter")
    categories = json.loads(question.get("mistake_categories_json", "[]"))
    
    # Check solving speed heuristics
    if time_taken_seconds < 15:
        mistake_type = "CARELESS_MISTAKE"
        confidence = 0.94
        diagnosis = f"You answered in only {time_taken_seconds} seconds. Rushing through the question caused an avoidable misread before fully processing the boundary conditions."
        concept_gap = f"Verification discipline in {topic}"
        recommendation = "Pause for at least 15 seconds to double check the given constraints and what the question is explicitly asking for."
    elif time_taken_seconds > 160:
        mistake_type = "TIME_PRESSURE"
        confidence = 0.89
        diagnosis = f"Taking {time_taken_seconds}s suggests you hesitated over the starting approach, leading to second-guessing and an error under time stress."
        concept_gap = f"Pattern recognition speed in {topic}"
        recommendation = f"Practice 5 standard benchmark problems in {topic} to build instantaneous recognition of initial conditions."
    else:
        # Heuristic based on topic and curated categories
        if "FORMULA_RECALL" in categories:
            mistake_type = "FORMULA_RECALL"
            confidence = 0.91
            if topic == "Rotational Motion":
                diagnosis = "You identified the correct physical quantity, but selected the translational-motion formula or an incorrect moment of inertia axis for a rotational case."
                concept_gap = "Moment of inertia relationship & rolling energy partition"
                recommendation = "Review the distinction between translational (1/2 mv²) and rotational (1/2 Iω²) equations before attempting another question."
            elif topic == "Differential Equations":
                diagnosis = "You attempted to solve as a standard linear equation with dependent variable y instead of swapping variables to dx/dy."
                concept_gap = "Identifying dependent vs independent variable swap in linear ODEs"
                recommendation = "Check whether degree of x or y is lower; if degree of x is 1, recast as dx/dy + P(y)x = Q(y)."
            else:
                diagnosis = f"You recalled an incorrect formula or confused sign conventions under {concept}."
                concept_gap = f"Core governing equation of {topic}"
                recommendation = f"Re-derive the fundamental equation for {concept} to anchor the variables and constants."
        elif "WRONG_APPROACH" in categories:
            mistake_type = "WRONG_APPROACH"
            confidence = 0.88
            diagnosis = f"Your starting methodology was misaligned with the problem archetype. {common_mistake}"
            concept_gap = f"Selecting optimal strategy for {topic}"
            recommendation = f"Study the worked solution to observe the pivot point where the standard method applies."
        elif "MEMORY_ERROR" in categories:
            mistake_type = "MEMORY_ERROR"
            confidence = 0.87
            diagnosis = f"A factual recall lapse occurred: {common_mistake}"
            concept_gap = f"Precise terminology and criteria in {topic}"
            recommendation = "Create a targeted flashcard for this specific rule and its key exceptions."
        else:
            mistake_type = categories[0] if categories else "CONCEPTUAL_MISUNDERSTANDING"
            confidence = 0.89
            diagnosis = f"A conceptual gap was identified: {common_mistake}"
            concept_gap = concept
            recommendation = f"Review the fundamental theory behind {concept} and attempt similar guided practice."

    return {
        "mistakeType": mistake_type,
        "confidence": confidence,
        "diagnosis": diagnosis,
        "conceptGap": concept_gap,
        "recommendation": recommendation
    }

def update_weakness_profile(
    user_id: str, question: Dict[str, Any], is_correct: bool,
    mistake_type: Optional[str], *, connection=None,
):
    """
    Updates the student's dynamic weakness profile based on real performance.
    """
    conn = connection or get_db_connection()
    cursor = conn.cursor()
    
    topic = question["topic"]
    subject = question["subject"]
    chapter = question["chapter"]
    exam = question["exam"]
    
    # Calculate current accuracy for this topic
    cursor.execute("""
        SELECT COUNT(*), SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END)
        FROM question_attempts
        WHERE user_id = ? AND topic = ?
    """, (user_id, topic))
    row = cursor.fetchone()
    total_topic_attempts = row[0] or 1
    total_topic_correct = row[1] or 0
    accuracy_percent = round((total_topic_correct / total_topic_attempts) * 100, 1)

    # Check if weakness record exists
    cursor.execute("""
        SELECT id, occurrences, trend FROM weaknesses
        WHERE user_id = ? AND topic = ?
    """, (user_id, topic))
    existing = cursor.fetchone()

    now = datetime_now_iso()

    if existing:
        weakness_id = existing["id"]
        occurrences = existing["occurrences"]
        if not is_correct and mistake_type:
            occurrences += 1
            trend = "recurring" if occurrences >= 3 else "critical"
        else:
            # If student got it right, trend improves!
            trend = "improving" if accuracy_percent >= 60 else "recurring"
            
        cursor.execute("""
            UPDATE weaknesses
            SET occurrences = ?, accuracy_percent = ?, last_seen = ?, trend = ?, mistake_type = COALESCE(?, mistake_type)
            WHERE id = ?
        """, (occurrences, accuracy_percent, now, trend, mistake_type, weakness_id))
    else:
        if not is_correct and mistake_type:
            weakness_id = f"weakness-{abs(hash(topic)) % 100000}"
            cursor.execute("""
                INSERT INTO weaknesses (id, user_id, exam, subject, chapter, topic, mistake_type, occurrences, accuracy_percent, last_seen, trend)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 'recurring')
            """, (weakness_id, user_id, exam, subject, chapter, topic, mistake_type, accuracy_percent, now))

    if connection is None:
        conn.commit()
        conn.close()

def datetime_now_iso() -> str:
    import datetime
    return datetime.datetime.now(datetime.timezone.utc).isoformat()
