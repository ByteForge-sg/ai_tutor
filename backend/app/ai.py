import os
import json
import sqlite3
from typing import Dict, Any, Optional, List
from app.database import get_db_connection

def is_exam_running(user_id: str, attempt_id: Optional[str] = None) -> bool:
    """
    Checks if the user has an active running exam attempt.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if attempt_id:
        cursor.execute("SELECT status FROM attempts WHERE id = ?", (attempt_id,))
        row = cursor.fetchone()
        conn.close()
        return row is not None and row["status"] == "RUNNING"

    cursor.execute("""
        SELECT id FROM attempts
        WHERE user_id = ? AND status = 'RUNNING'
        LIMIT 1
    """, (user_id,))
    row = cursor.fetchone()
    conn.close()
    return row is not None

def generate_chat_response(
    user_id: str,
    message: str,
    current_attempt_id: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    WHY AI Coach chat handler.
    Strictly refuses help if an exam attempt is RUNNING.
    Otherwise provides contextual pedagogical reasoning.
    """
    # 1. LIVE EXAM INTEGRITY CHECK (Backend Enforced)
    if is_exam_running(user_id, current_attempt_id):
        return {
            "mode": "EXAM_BLOCKED",
            "reply": "Exam Mode Active.\n\nAI assistance is strictly unavailable during a live test.\nSubmit your test to ask WHY about your mistakes.",
            "suggestions": []
        }

    # Contextual awareness: check student's weakest area and recent mistakes
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT topic, mistake_type, accuracy_percent, occurrences
        FROM weaknesses
        WHERE user_id = ?
        ORDER BY occurrences DESC LIMIT 2
    """, (user_id,))
    weak_rows = cursor.fetchall()
    weaknesses_context = [dict(r) for r in weak_rows]
    conn.close()

    msg_lower = message.lower()
    
    # Check if asking about specific mistake
    if "why did i get" in msg_lower or "explain my mistake" in msg_lower or "rotational" in msg_lower:
        reply = (
            "Here is the breakdown of WHY you encountered difficulty on this concept:\n\n"
            "**Primary Misconception: Formula Selection & Inertia Axis**\n"
            "In rolling without slipping, energy divides into translational ($K_{trans} = \\frac{1}{2} M v^2$) "
            "and rotational ($K_{rot} = \\frac{1}{2} I \\omega^2$). The fraction of energy remaining translational is "
            "$1 / (1 + k^2/R^2)$.\n\n"
            "- For a Solid Sphere: $k^2/R^2 = 2/5 \\implies K_{trans} = \\frac{5}{7} Mgh$\n"
            "- For a Hollow Cylinder: $k^2/R^2 = 1 \\implies K_{trans} = \\frac{1}{2} Mgh$\n\n"
            "The ratio is $(\\frac{5}{7}) / (\\frac{1}{2}) = 10 : 7$. The recurring trap is assuming translational energy is identical for all rolling bodies because total potential energy is $Mgh$.\n\n"
            "Would you like to start a targeted 5-step practice intervention to lock down this formula distinction?"
        )
        suggestions = [
            "Start 'Fix This Weakness' intervention",
            "Show me another Rotational Motion example",
            "How do I remember k²/R² for standard shapes?"
        ]
    elif "weakness" in msg_lower or "what should i practice" in msg_lower:
        if weaknesses_context:
            primary_weak = weaknesses_context[0]
            reply = (
                f"Based on your recent attempts, your primary recurring issue is **{primary_weak['mistake_type'].replace('_', ' ').title()}** "
                f"in **{primary_weak['topic']}** (current accuracy: {primary_weak['accuracy_percent']}%, {primary_weak['occurrences']} detections).\n\n"
                f"Recommended Action:\n"
                f"1. Spend 10 minutes on the **Concept Refresher** for {primary_weak['topic']}.\n"
                f"2. Solve the 3-question adaptive practice set.\n"
                f"3. Recheck your contribution grid to maintain your daily streak!"
            )
        else:
            reply = (
                "Your performance across core topics is balanced! To push your score higher, "
                "attempt a Full Simulation Test or select Hard difficulty questions in Mechanics and Calculus."
            )
        suggestions = [
            "Fix Rotational Motion weakness",
            "View My Weaknesses dashboard",
            "Take a Subject Test"
        ]
    elif "streak" in msg_lower or "grid" in msg_lower or "consistency" in msg_lower:
        reply = (
            "Your **Practice Consistency Grid** tracks every completed question attempt over the last 6 months.\n\n"
            "Remember: A day qualifies for your streak when you complete **at least 5 questions**.\n"
            "Consistency is independent of correctness — the goal is deliberate daily problem-solving discipline!"
        )
        suggestions = [
            "Practice 5 questions now",
            "View my 6-month contribution grid",
            "What are today's daily goals?"
        ]
    else:
        reply = (
            f"Hello Aditya! I'm your **WHY AI Mistake Coach**.\n\n"
            f"Unlike traditional preparation tools that simply tell you whether an answer is correct or incorrect, "
            f"I analyze your reasoning errors, detect recurring patterns across tests, and build targeted interventions so you never repeat the same mistake twice.\n\n"
            f"How can I assist you right now? You can ask me to explain a solution, diagnose a recurring misconception, or recommend your next high-yield practice topic."
        )
        suggestions = [
            "Why do I keep missing Rotational Motion questions?",
            "What is my weakest topic right now?",
            "Explain King's Property in Definite Integrals"
        ]

    return {
        "mode": "HELPFUL",
        "reply": reply,
        "suggestions": suggestions
    }
