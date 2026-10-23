import json
import uuid
import datetime
from typing import Dict, Any, List
from app.database import get_db_connection
from app.mistakes import datetime_now_iso, update_weakness_profile

def get_user_weaknesses(user_id: str, exam: str = "JEE") -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, topic, subject, chapter, mistake_type, occurrences, accuracy_percent, last_seen, trend
        FROM weaknesses
        WHERE user_id = ? AND exam = ?
        ORDER BY occurrences DESC, accuracy_percent ASC
    """, (user_id, exam))
    
    rows = cursor.fetchall()
    weaknesses = [dict(r) for r in rows]
    conn.close()
    return weaknesses

def generate_intervention(user_id: str, topic: str, exam: str = "JEE") -> Dict[str, Any]:
    """
    Creates the 5-step adaptive intervention for 'Fix This Weakness':
    1. Concept Refresher
    2. Worked Example
    3. Similar Question
    4. Practice Set
    5. Challenge Question
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Query weakness details
    cursor.execute("""
        SELECT id, mistake_type, accuracy_percent, subject, chapter
        FROM weaknesses
        WHERE user_id = ? AND topic = ? AND exam = ?
    """, (user_id, topic, exam))
    w_row = cursor.fetchone()
    
    mistake_type = w_row["mistake_type"] if w_row else "FORMULA_RECALL"
    accuracy_before = w_row["accuracy_percent"] if w_row else 42.0
    subject = w_row["subject"] if w_row else "Physics"
    chapter = w_row["chapter"] if w_row else "Mechanics"

    # Fetch questions relevant to this topic or chapter
    cursor.execute("""
        SELECT id, exam, subject, chapter, topic, difficulty,
               question_text, options_json, correct_answer, explanation,
               concept, common_mistake, mistake_categories_json, source_type, year
        FROM questions
        WHERE exam = ? AND (topic = ? OR chapter = ?)
        ORDER BY CASE WHEN topic = ? THEN 0 ELSE 1 END, difficulty ASC
    """, (exam, topic, chapter, topic))
    rows = cursor.fetchall()

    if not rows:
        cursor.execute("SELECT * FROM questions WHERE exam = ? LIMIT 5", (exam,))
        rows = cursor.fetchall()

    def format_q(r):
        return {
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
        }

    question_pool = [dict(r) for r in rows]
    similar_q = format_q(question_pool[0])
    practice_set = [format_q(q) for q in question_pool[1:3]] if len(question_pool) >= 3 else [similar_q]
    challenge_q = format_q(question_pool[-1]) if len(question_pool) > 3 else similar_q

    # Specific curated Concept Refresher and Worked Example based on topic
    if topic == "Rotational Motion":
        concept_refresher = {
            "title": "Rotational Motion: Energy Partition & Axis Selection",
            "key_principles": [
                "Total Kinetic Energy = Translational KE (½ M v²) + Rotational KE (½ I ω²).",
                "Pure rolling constraint: v = Rω implies Rotational KE = ½ (I/R²) v².",
                "Fraction of total energy in translational motion: K_trans / K_total = 1 / (1 + k²/R²).",
                "Parallel axis theorem: I_axis = I_cm + M d². Always verify whether rotation occurs about the center of mass or a fixed hinge pin!"
            ],
            "common_trap": "Treating moment of inertia about the end of a rod as 1/12 ML² instead of 1/3 ML², or assuming all rolling bodies descend with identical translational speeds.",
            "formula_sheet": "Solid Sphere: k²/R² = 2/5 | Hollow Cylinder: k²/R² = 1 | Solid Cylinder: k²/R² = 1/2 | Rod (end hinge): I = 1/3 ML²"
        }
        worked_example = {
            "problem": "A uniform disc of mass M and radius R rolls without slipping down an incline. Find the fraction of its total kinetic energy that is rotational.",
            "step_1": "Write rotational inertia for disc: I = ½ M R², so radius of gyration ratio k²/R² = ½.",
            "step_2": "Express total kinetic energy: K_total = ½ M v² (1 + k²/R²) = ½ M v² (1 + ½) = ¾ M v².",
            "step_3": "Rotational energy: K_rot = ½ I ω² = ½ (½ M R²) (v/R)² = ¼ M v².",
            "step_4": "Ratio: K_rot / K_total = (¼) / (¾) = ⅓ (33.3%). Translational KE retains ⅔ (66.7%).",
            "takeaway": "Notice that translational speed depends only on the dimensionless geometric shape factor k²/R², independent of total mass M or radius R!"
        }
    elif topic == "Differential Equations":
        concept_refresher = {
            "title": "First Order Linear Differential Equations & Variable Inversion",
            "key_principles": [
                "Standard Form (linear in y): dy/dx + P(x) y = Q(x), Integrating Factor IF = e^(∫ P(x) dx).",
                "Swapped Form (linear in x): dx/dy + P(y) x = Q(y), Integrating Factor IF = e^(∫ P(y) dy).",
                "Criterion: When the expression has x to degree 1 and higher powers of y, immediately invert to dx/dy!"
            ],
            "common_trap": "Forcing dy/dx when the denominator cannot be split, causing complicated integration.",
            "formula_sheet": "General Solution: x · (IF) = ∫ Q(y) · (IF) dy + C"
        }
        worked_example = {
            "problem": "Solve: (x + y + 1) dy/dx = 1",
            "step_1": "Invert derivative: dx/dy = x + y + 1 => dx/dy - x = y + 1.",
            "step_2": "Identify P(y) = -1, Q(y) = y + 1.",
            "step_3": "Integrating factor: IF = e^(∫ -1 dy) = e^(-y).",
            "step_4": "Solution: x e^(-y) = ∫ (y + 1) e^(-y) dy = - (y + 2) e^(-y) + C => x + y + 2 = C e^y.",
            "takeaway": "Inverting the derivative turns an insoluble non-separable equation into a trivial 2-line linear ODE."
        }
    else:
        concept_refresher = {
            "title": f"Targeted Diagnostic Refresher: {topic}",
            "key_principles": [
                f"Verify the governing boundary conditions and definitions for {chapter}.",
                "Dissect the problem statement into known givens and target output.",
                "Avoid skipping intermediate algebraic steps under time pressure."
            ],
            "common_trap": f"Conflating proximate variables under {mistake_type}.",
            "formula_sheet": f"Review standard NCERT definitions for {topic}."
        }
        worked_example = {
            "problem": f"Archetype standard problem in {topic}",
            "step_1": "State the governing principle and boundary conditions.",
            "step_2": "Substitute parameters carefully maintaining SI units.",
            "step_3": "Compute step-by-step to prevent arithmetic slips.",
            "step_4": "Validate units and dimensions of the resulting expression.",
            "takeaway": "Methodical adherence to the standard workflow eliminates 90% of recurring errors."
        }

    intervention_id = f"interv-{uuid.uuid4().hex[:8]}"

    cursor.execute("""
        INSERT INTO interventions (id, user_id, weakness_id, topic, mistake_type, step, total_steps, status, accuracy_before, created_at)
        VALUES (?, ?, ?, ?, ?, 1, 5, 'IN_PROGRESS', ?, ?)
    """, (intervention_id, user_id, w_row["id"] if w_row else None, topic, mistake_type, accuracy_before, datetime_now_iso()))

    conn.commit()
    conn.close()

    return {
        "intervention_id": intervention_id,
        "topic": topic,
        "subject": subject,
        "mistake_type": mistake_type,
        "step": 1,
        "total_steps": 5,
        "accuracy_before": accuracy_before,
        "concept_refresher": concept_refresher,
        "worked_example": worked_example,
        "similar_question": similar_q,
        "practice_set": practice_set,
        "challenge_question": challenge_q
    }

def complete_intervention(user_id: str, intervention_id: str, answers: Dict[str, str]) -> Dict[str, Any]:
    """
    Submits answers for an intervention, calculates real Before vs After accuracy,
    and updates the database.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM interventions WHERE id = ? AND user_id = ?", (intervention_id, user_id))
    interv = cursor.fetchone()
    if not interv:
        conn.close()
        raise ValueError("Intervention not found")

    topic = interv["topic"]
    mistake_type = interv["mistake_type"]
    accuracy_before = interv["accuracy_before"]

    # Grade the submitted answers
    correct_count = 0
    total_q = len(answers)
    now_iso = datetime_now_iso()
    today_iso = datetime.date.today().isoformat()

    for q_id, selected_opt in answers.items():
        cursor.execute("SELECT * FROM questions WHERE id = ?", (q_id,))
        q = cursor.fetchone()
        if not q:
            continue
        is_corr = 1 if selected_opt == q["correct_answer"] else 0
        if is_corr:
            correct_count += 1
        
        # Log attempt in question_attempts
        cursor.execute("""
            INSERT INTO question_attempts (
                id, attempt_id, user_id, question_id, selected_answer, correct_answer,
                is_correct, time_taken_seconds, timestamp, activity_date,
                exam, subject, chapter, topic, difficulty, mistake_type, ai_diagnosis_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            f"interv-qa-{uuid.uuid4().hex[:8]}",
            intervention_id,
            user_id,
            q["id"],
            selected_opt,
            q["correct_answer"],
            is_corr,
            45,
            now_iso,
            today_iso,
            q["exam"],
            q["subject"],
            q["chapter"],
            q["topic"],
            q["difficulty"],
            None if is_corr else mistake_type,
            None
        ))

    accuracy_after = round((correct_count / total_q) * 100, 1) if total_q > 0 else 100.0
    delta = round(accuracy_after - accuracy_before, 1)

    cursor.execute("""
        UPDATE interventions
        SET status = 'COMPLETED', accuracy_after = ?, completed_at = ?
        WHERE id = ?
    """, (accuracy_after, now_iso, intervention_id))

    # Update weakness table with new trend
    trend = "improving" if accuracy_after >= accuracy_before else "recurring"
    cursor.execute("""
        UPDATE weaknesses
        SET accuracy_percent = ?, last_seen = ?, trend = ?
        WHERE user_id = ? AND topic = ?
    """, (accuracy_after, now_iso, trend, user_id, topic))

    conn.commit()
    conn.close()

    return {
        "intervention_id": intervention_id,
        "topic": topic,
        "mistake_type": mistake_type,
        "accuracy_before": accuracy_before,
        "accuracy_after": accuracy_after,
        "improvement_delta": delta,
        "questions_completed": total_q,
        "correct_count": correct_count,
        "message": f"Adaptive intervention completed! Your accuracy in {topic} improved from {accuracy_before}% to {accuracy_after}% (+{delta}%)."
    }
