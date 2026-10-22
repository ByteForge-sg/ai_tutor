import os
import json
from fastapi import FastAPI, HTTPException, Depends, Query, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any

from app.database import init_db, get_db_connection
from app.seed_data import seed_database
from app.models import (
    UserLoginRequest, UserResponse, QuestionOut, QuestionDetail,
    TestListItem, StartTestRequest, TestAttemptOut, SaveAnswerRequest,
    IntegrityEventRequest, SubmitTestRequest, TestResultOut,
    PracticeAnswerRequest, PracticeAnswerResponse, MistakeDiagnosisOut,
    DashboardSummaryOut, AIChatRequest, AIChatResponse,
    FixWeaknessInterventionOut, CompleteInterventionRequest, InterventionResultOut,
    WeaknessItem, ContributionGridData
)
from app.attempts import (
    create_test_attempt, get_active_test_attempt, record_integrity_event,
    submit_test_attempt, record_practice_answer
)
from app.mistakes import diagnose_mistake
from app.weaknesses import get_user_weaknesses, generate_intervention, complete_intervention
from app.analytics import get_dashboard_analytics
from app.ai import generate_chat_response

app = FastAPI(
    title="WHY — AI Mistake Coach API",
    description="Backend engine powering the JEE/NEET Question -> Attempt -> Feedback -> Mistake -> Pattern -> Intervention -> Reattempt -> Improvement feedback loop.",
    version="1.0.0"
)

# Enable CORS for frontend development and demo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Initialize DB and seed initial data if empty
    seed_database()
    print("WHY Backend initialized with data-driven feedback loop.")

# ----------------- AUTH & USER -----------------
@app.post("/auth/login", response_model=UserResponse)
def login(req: UserLoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (req.email,))
    user = cursor.fetchone()
    
    if not user:
        # Create user
        uid = f"user-{req.email.split('@')[0]}"
        name = req.name or req.email.split('@')[0].capitalize()
        exam = req.target_exam or "JEE"
        avatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80"
        cursor.execute("""
            INSERT INTO users (id, email, name, target_exam, avatar, created_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))
        """, (uid, req.email, name, exam, avatar))
        conn.commit()
        cursor.execute("SELECT * FROM users WHERE id = ?", (uid,))
        user = cursor.fetchone()
    elif req.target_exam and req.target_exam != user["target_exam"]:
        # Update target exam if requested
        cursor.execute("UPDATE users SET target_exam = ? WHERE id = ?", (req.target_exam, user["id"]))
        conn.commit()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user["id"],))
        user = cursor.fetchone()

    user_dict = dict(user)
    conn.close()
    return user_dict

@app.get("/users/{user_id}", response_model=UserResponse)
def get_user_profile(user_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return dict(user)

@app.patch("/users/{user_id}/exam")
def update_user_exam(user_id: str, exam: str = Query(..., pattern="^(JEE|NEET)$")):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET target_exam = ? WHERE id = ?", (exam, user_id))
    conn.commit()
    conn.close()
    return {"status": "success", "target_exam": exam}

# ----------------- QUESTIONS & PRACTICE -----------------
@app.get("/questions", response_model=List[QuestionOut])
def list_questions(
    exam: Optional[str] = "JEE",
    subject: Optional[str] = None,
    chapter: Optional[str] = None,
    topic: Optional[str] = None,
    difficulty: Optional[str] = None,
    source_type: Optional[str] = None,
    limit: int = 50
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM questions WHERE exam = ?"
    params: List[Any] = [exam]
    
    if subject:
        query += " AND subject = ?"
        params.append(subject)
    if chapter:
        query += " AND chapter = ?"
        params.append(chapter)
    if topic:
        query += " AND topic = ?"
        params.append(topic)
    if difficulty:
        query += " AND difficulty = ?"
        params.append(difficulty)
    if source_type:
        query += " AND source_type = ?"
        params.append(source_type)
        
    query += " LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    res = []
    for r in rows:
        res.append({
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
    return res

@app.get("/questions/{question_id}", response_model=QuestionDetail)
def get_question_detail(question_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM questions WHERE id = ?", (question_id,))
    r = cursor.fetchone()
    conn.close()
    if not r:
        raise HTTPException(status_code=404, detail="Question not found")
        
    return {
        "id": r["id"],
        "exam": r["exam"],
        "subject": r["subject"],
        "chapter": r["chapter"],
        "topic": r["topic"],
        "difficulty": r["difficulty"],
        "question_text": r["question_text"],
        "options": json.loads(r["options_json"]),
        "correct_answer": r["correct_answer"],
        "explanation": r["explanation"],
        "concept": r["concept"],
        "common_mistake": r["common_mistake"],
        "mistake_categories": json.loads(r["mistake_categories_json"]),
        "source_type": r["source_type"],
        "year": r["year"]
    }

@app.post("/practice/answer", response_model=PracticeAnswerResponse)
def submit_practice_answer(req: PracticeAnswerRequest):
    try:
        return record_practice_answer(
            user_id=req.user_id,
            question_id=req.question_id,
            selected_answer=req.selected_answer,
            time_taken_seconds=req.time_taken_seconds
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ----------------- TESTS & FULLSCREEN EXAM -----------------
@app.get("/tests", response_model=List[TestListItem])
def list_tests(exam: Optional[str] = "JEE", user_id: str = "user_demo"):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tests WHERE exam = ?", (exam,))
    rows = cursor.fetchall()
    
    # Check attempt status for user
    res = []
    for r in rows:
        cursor.execute("""
            SELECT status, score FROM attempts
            WHERE user_id = ? AND test_id = ?
            ORDER BY started_at DESC LIMIT 1
        """, (user_id, r["id"]))
        att = cursor.fetchone()
        att_status = "NOT_STARTED"
        last_score = None
        if att:
            att_status = att["status"]
            last_score = att["score"]

        res.append({
            "id": r["id"],
            "title": r["title"],
            "exam": r["exam"],
            "test_type": r["test_type"],
            "subject": r["subject"],
            "chapter": r["chapter"],
            "questions_count": r["questions_count"],
            "duration_minutes": r["duration_minutes"],
            "total_marks": r["total_marks"],
            "marking_correct": r["marking_correct"],
            "marking_incorrect": r["marking_incorrect"],
            "marking_unattempted": r["marking_unattempted"],
            "difficulty": r["difficulty"],
            "attempt_status": att_status,
            "last_score": last_score
        })
    conn.close()
    return res

@app.post("/attempts", response_model=TestAttemptOut)
def start_exam(req: StartTestRequest):
    try:
        return create_test_attempt(test_id=req.test_id, user_id=req.user_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/attempts/{attempt_id}", response_model=TestAttemptOut)
def get_exam_state(attempt_id: str):
    try:
        return get_active_test_attempt(attempt_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.post("/attempts/{attempt_id}/integrity")
def post_integrity_event(attempt_id: str, req: IntegrityEventRequest):
    try:
        return record_integrity_event(attempt_id, req.event_type, req.details)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/attempts/{attempt_id}/submit", response_model=TestResultOut)
def submit_exam(attempt_id: str, req: SubmitTestRequest, user_id: str = "user_demo"):
    try:
        answers = req.answers or {}
        return submit_test_attempt(attempt_id=attempt_id, answers=answers, user_id=user_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/results/{attempt_id}", response_model=TestResultOut)
def get_exam_results(attempt_id: str, user_id: str = "user_demo"):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM attempts WHERE id = ?", (attempt_id,))
    attempt = cursor.fetchone()
    if not attempt:
        conn.close()
        raise HTTPException(status_code=404, detail="Attempt not found")
        
    cursor.execute("SELECT * FROM tests WHERE id = ?", (attempt["test_id"],))
    test = cursor.fetchone()
    
    # Retrieve question attempts
    cursor.execute("""
        SELECT qa.*, q.question_text, q.options_json, q.concept, q.explanation, q.common_mistake
        FROM question_attempts qa
        JOIN questions q ON qa.question_id = q.id
        WHERE qa.attempt_id = ?
    """, (attempt_id,))
    qa_rows = cursor.fetchall()
    
    question_results = []
    subject_map: Dict[str, Dict[str, Any]] = {}
    
    for r in qa_rows:
        subj = r["subject"]
        if subj not in subject_map:
            subject_map[subj] = {
                "subject": subj,
                "total_questions": 0,
                "attempted": 0,
                "correct": 0,
                "incorrect": 0,
                "score": 0,
                "total_time": 0
            }
        
        subject_map[subj]["total_questions"] += 1
        is_unatt = (r["is_correct"] == -1 or r["selected_answer"] is None)
        is_corr = (r["is_correct"] == 1)
        
        marks = 0
        if is_unatt:
            marks = 0
        elif is_corr:
            marks = test["marking_correct"] if test else 4
            subject_map[subj]["attempted"] += 1
            subject_map[subj]["correct"] += 1
            subject_map[subj]["score"] += marks
        else:
            marks = test["marking_incorrect"] if test else -1
            subject_map[subj]["attempted"] += 1
            subject_map[subj]["incorrect"] += 1
            subject_map[subj]["score"] += marks
            
        subject_map[subj]["total_time"] += r["time_taken_seconds"]
        
        diag = json.loads(r["ai_diagnosis_json"]) if r["ai_diagnosis_json"] else None

        question_results.append({
            "question_id": r["question_id"],
            "question_text": r["question_text"],
            "options": json.loads(r["options_json"]),
            "selected_answer": r["selected_answer"],
            "correct_answer": r["correct_answer"],
            "is_correct": is_corr,
            "is_unattempted": is_unatt,
            "time_taken_seconds": r["time_taken_seconds"],
            "marks_awarded": marks,
            "concept": r["concept"],
            "explanation": r["explanation"],
            "common_mistake": r["common_mistake"],
            "mistake_type": r["mistake_type"],
            "ai_diagnosis": diag
        })

    subject_breakdown = []
    for s_name, s_data in subject_map.items():
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

    conn.close()

    total_attempted = attempt["correct_count"] + attempt["incorrect_count"]
    accuracy = round((attempt["correct_count"] / total_attempted * 100), 1) if total_attempted > 0 else 0.0

    return {
        "attempt_id": attempt["id"],
        "test_id": attempt["test_id"],
        "test_title": attempt["test_title"] or "Test Evaluation",
        "exam": attempt["exam"],
        "status": attempt["status"],
        "started_at": attempt["started_at"],
        "submitted_at": attempt["submitted_at"] or attempt["started_at"],
        "score": attempt["score"],
        "max_score": attempt["max_score"],
        "accuracy_percent": accuracy,
        "total_questions": attempt["total_questions"],
        "correct_count": attempt["correct_count"],
        "incorrect_count": attempt["incorrect_count"],
        "unanswered_count": attempt["unanswered_count"],
        "time_used_seconds": attempt["time_taken_seconds"],
        "integrity_flags_count": attempt["integrity_flags_count"] or 0,
        "subject_breakdown": subject_breakdown,
        "question_results": question_results
    }

# ----------------- ANALYTICS & DASHBOARD -----------------
@app.get("/analytics/dashboard", response_model=DashboardSummaryOut)
def get_dashboard(user_id: str = "user_demo", exam: str = "JEE"):
    return get_dashboard_analytics(user_id=user_id, exam=exam)

@app.get("/analytics/weaknesses", response_model=List[WeaknessItem])
def get_weaknesses_list(user_id: str = "user_demo", exam: str = "JEE"):
    return get_user_weaknesses(user_id=user_id, exam=exam)

# ----------------- FIX THIS WEAKNESS INTERVENTIONS -----------------
@app.post("/weaknesses/{topic}/intervention", response_model=FixWeaknessInterventionOut)
def start_topic_intervention(topic: str, user_id: str = "user_demo", exam: str = "JEE"):
    try:
        return generate_intervention(user_id=user_id, topic=topic, exam=exam)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/weaknesses/interventions/{intervention_id}/complete", response_model=InterventionResultOut)
def submit_intervention(intervention_id: str, req: CompleteInterventionRequest, user_id: str = "user_demo"):
    try:
        return complete_intervention(user_id=user_id, intervention_id=intervention_id, answers=req.answers)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ----------------- AI CHAT & DIAGNOSIS -----------------
@app.post("/ai/chat", response_model=AIChatResponse)
def chat_with_coach(req: AIChatRequest):
    return generate_chat_response(
        user_id=req.user_id,
        message=req.message,
        current_attempt_id=req.current_attempt_id,
        context=req.context
    )

@app.post("/ai/analyze-mistake", response_model=MistakeDiagnosisOut)
def analyze_single_mistake(question_id: str, selected_answer: str, time_taken_seconds: int = 45):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM questions WHERE id = ?", (question_id,))
    q = cursor.fetchone()
    conn.close()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
        
    diag = diagnose_mistake(dict(q), selected_answer, time_taken_seconds)
    return diag

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
