import os
import json
import logging
from pathlib import Path
from datetime import datetime, timedelta, timezone
from uuid import uuid4
from typing import List, Optional, Dict, Any

import jwt
from pwdlib import PasswordHash
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.database import init_db, get_db_connection
from app.seed_data import seed_database
from app.models import (
    UserSignupRequest, UserLoginRequest, PasswordChangeRequest, UserResponse, AuthResponse,
    ExamUpdateRequest, QuestionOut, QuestionDetail,
    TestListItem, StartTestRequest, TestAttemptOut, SaveAnswerRequest,
    IntegrityEventRequest, SubmitTestRequest, TestResultOut,
    PracticeAnswerRequest, PracticeAnswerResponse, MistakeDiagnosisOut,
    DashboardSummaryOut, AIChatRequest, AIChatResponse,
    FixWeaknessInterventionOut, CompleteInterventionRequest,
    InterventionResultOut, WeaknessItem
)
from app.attempts import (
    create_test_attempt, get_active_test_attempt, record_integrity_event,
    submit_test_attempt, record_practice_answer, save_attempt_answer,
    process_attempt_analytics,
)
from app.mistakes import diagnose_mistake
from app.weaknesses import get_user_weaknesses, generate_intervention, complete_intervention
from app.analytics import get_dashboard_analytics
from app.ai import generate_chat_response

logger = logging.getLogger(__name__)
app_logger = logging.getLogger("app")
app_logger.setLevel(logging.INFO)
if not app_logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(levelname)s: %(name)s: %(message)s"))
    app_logger.addHandler(handler)

app = FastAPI(
    title="WHY — AI Mistake Coach API",
    description="Backend engine powering the JEE/NEET Question -> Attempt -> Feedback -> Mistake -> Pattern -> Intervention -> Reattempt -> Improvement feedback loop.",
    version="1.0.0"
)

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
if not JWT_SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY must be set in backend/.env")

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
password_hash = PasswordHash.recommended()
bearer_scheme = HTTPBearer(auto_error=False)

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
    # Always run safe schema migrations first. Seed only a genuinely empty
    # question catalog so startup cannot replace existing users or content.
    init_db()
    conn = get_db_connection()
    try:
        question_count = conn.execute(
            "SELECT COUNT(*) FROM questions"
        ).fetchone()[0]
    finally:
        conn.close()

    if question_count == 0:
        seed_database()

    print("WHY Backend initialized with data-driven feedback loop.")

# ----------------- AUTH & USER -----------------
def create_access_token(user_id: str) -> str:
    expires = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )
    return jwt.encode(
        {"sub": user_id, "exp": expires},
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
):
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    conn = get_db_connection()
    try:
        user = conn.execute(
            "SELECT id, email, name, target_exam, avatar, created_at "
            "FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
    finally:
        conn.close()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return dict(user)


def ensure_attempt_owner(attempt_id: str, user_id: str) -> None:
    conn = get_db_connection()
    try:
        attempt = conn.execute(
            "SELECT user_id FROM attempts WHERE id = ?", (attempt_id,)
        ).fetchone()
    finally:
        conn.close()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    if attempt["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")


@app.post("/auth/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(req: UserSignupRequest):
    email = str(req.email).strip().lower()
    name = req.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Name cannot be blank")

    uid = f"user-{uuid4().hex}"
    avatar = (
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb"
        "?auto=format&fit=crop&w=256&q=80"
    )
    hashed_password = password_hash.hash(req.password)
    created_at = datetime.now(timezone.utc).isoformat()

    conn = get_db_connection()
    try:
        existing = conn.execute(
            "SELECT id FROM users WHERE lower(email) = ?", (email,)
        ).fetchone()
        if existing:
            raise HTTPException(
                status_code=409,
                detail="An account with this email already exists",
            )

        conn.execute(
            """INSERT INTO users
               (id, email, name, target_exam, avatar, created_at, password_hash)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (uid, email, name, req.target_exam.value, avatar, created_at, hashed_password),
        )
        conn.commit()
        user = conn.execute(
            """SELECT id, email, name, target_exam, avatar, created_at
               FROM users WHERE id = ?""",
            (uid,),
        ).fetchone()
    except HTTPException:
        raise
    except Exception as exc:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Could not create account") from exc
    finally:
        conn.close()

    return {
        "access_token": create_access_token(uid),
        "token_type": "bearer",
        "user": dict(user),
    }


@app.post("/auth/login", response_model=AuthResponse)
def login(req: UserLoginRequest):
    email = str(req.email).strip().lower()
    conn = get_db_connection()
    try:
        user = conn.execute(
            "SELECT * FROM users WHERE lower(email) = ?", (email,)
        ).fetchone()
    finally:
        conn.close()

    if not user or not user["password_hash"]:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    try:
        valid_password = password_hash.verify(req.password, user["password_hash"])
    except Exception:
        valid_password = False
    if not valid_password:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    safe_user = {
        key: user[key]
        for key in ("id", "email", "name", "target_exam", "avatar", "created_at")
    }
    return {
        "access_token": create_access_token(user["id"]),
        "token_type": "bearer",
        "user": safe_user,
    }


@app.get("/users/me", response_model=UserResponse)
def get_my_profile(current_user: dict = Depends(get_current_user)):
    return current_user


@app.patch("/users/me/password")
def change_my_password(
    req: PasswordChangeRequest,
    current_user: dict = Depends(get_current_user),
):
    conn = get_db_connection()
    try:
        user = conn.execute(
            "SELECT password_hash FROM users WHERE id = ?",
            (current_user["id"],),
        ).fetchone()
        if not user or not user["password_hash"]:
            raise HTTPException(status_code=400, detail="Current password is incorrect")

        try:
            valid_password = password_hash.verify(
                req.current_password, user["password_hash"]
            )
        except Exception:
            valid_password = False
        if not valid_password:
            raise HTTPException(status_code=400, detail="Current password is incorrect")

        updated = conn.execute(
            "UPDATE users SET password_hash = ? WHERE id = ? AND password_hash = ?",
            (
                password_hash.hash(req.new_password),
                current_user["id"],
                user["password_hash"],
            ),
        )
        if updated.rowcount != 1:
            conn.rollback()
            raise HTTPException(
                status_code=409,
                detail="Password changed in another request. Please try again.",
            )
        conn.commit()
        return {"message": "Password updated successfully"}
    finally:
        conn.close()


@app.patch("/users/me/exam", response_model=UserResponse)
def update_my_exam(
    req: ExamUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    conn = get_db_connection()
    try:
        conn.execute(
            "UPDATE users SET target_exam = ? WHERE id = ?",
            (req.target_exam.value, current_user["id"]),
        )
        conn.commit()
        user = conn.execute(
            """SELECT id, email, name, target_exam, avatar, created_at
               FROM users WHERE id = ?""",
            (current_user["id"],),
        ).fetchone()
        return dict(user)
    finally:
        conn.close()


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
def submit_practice_answer(
    req: PracticeAnswerRequest, current_user: dict = Depends(get_current_user)
):
    try:
        return record_practice_answer(
            user_id=current_user["id"],
            question_id=req.question_id,
            selected_answer=req.selected_answer,
            time_taken_seconds=req.time_taken_seconds
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ----------------- TESTS & FULLSCREEN EXAM -----------------
@app.get("/tests", response_model=List[TestListItem])
def list_tests(
    exam: Optional[str] = "JEE", category: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    conn = get_db_connection()
    cursor = conn.cursor()
    if category == "PYP":
        # Build stable paper definitions from the catalog's actual PYQ records.
        cursor.execute("""
            SELECT exam, year, GROUP_CONCAT(id) AS question_ids, COUNT(*) AS count
            FROM questions WHERE exam = ? AND source_type = 'PYQ'
            GROUP BY exam, year ORDER BY year DESC
        """, (exam,))
        for paper in cursor.fetchall():
            paper_id = f"pyp-{paper['exam'].lower()}-{paper['year']}"
            ids = paper["question_ids"].split(",")
            cursor.execute("""
                INSERT OR IGNORE INTO tests (
                    id, title, exam, test_type, subject, chapter, questions_count,
                    duration_minutes, total_marks, marking_correct, marking_incorrect,
                    marking_unattempted, difficulty, question_ids_json
                ) VALUES (?, ?, ?, 'Previous Year Paper', 'All Subjects', ?, ?, ?, ?, 4, -1, 0, 'Mixed', ?)
            """, (paper_id, f"{paper['exam']} Previous Year Paper {paper['year']}",
                  paper["exam"], str(paper["year"]), len(ids), max(1, len(ids) * 2),
                  len(ids) * 4, json.dumps(ids)))
        conn.commit()
        cursor.execute("SELECT * FROM tests WHERE exam = ? AND test_type = 'Previous Year Paper' ORDER BY title DESC", (exam,))
    elif category == "TEST_SERIES":
        cursor.execute("SELECT * FROM tests WHERE exam = ? AND test_type != 'Previous Year Paper'", (exam,))
    else:
        cursor.execute("SELECT * FROM tests WHERE exam = ? AND test_type != 'Previous Year Paper'", (exam,))
    rows = cursor.fetchall()
    
    # Check attempt status for user
    res = []
    for r in rows:
        cursor.execute("""
            SELECT id, status, score, max_score, started_at FROM attempts
            WHERE user_id = ? AND test_id = ?
            ORDER BY started_at DESC LIMIT 1
        """, (current_user["id"], r["id"]))
        att = cursor.fetchone()
        att_status = "NOT_STARTED"
        last_score = None
        if att:
            att_status = att["status"]
            last_score = att["score"]

        cursor.execute("""
            SELECT id, status, score, max_score, submitted_at
            FROM attempts WHERE user_id = ? AND test_id = ?
              AND status IN ('SUBMITTED', 'AUTO_SUBMITTED')
            ORDER BY started_at DESC
        """, (current_user["id"], r["id"]))
        submitted_attempts = [dict(a) for a in cursor.fetchall()]

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
            "last_score": last_score,
            "attempts": submitted_attempts,
        })
    conn.close()
    return res

@app.post("/attempts", response_model=TestAttemptOut)
def start_exam(
    req: StartTestRequest, current_user: dict = Depends(get_current_user)
):
    try:
        return create_test_attempt(test_id=req.test_id, user_id=current_user["id"])
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/attempts/{attempt_id}", response_model=TestAttemptOut)
def get_exam_state(
    attempt_id: str, current_user: dict = Depends(get_current_user)
):
    ensure_attempt_owner(attempt_id, current_user["id"])
    try:
        return get_active_test_attempt(attempt_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.put("/attempts/{attempt_id}/answers")
def save_exam_answer(
    attempt_id: str, req: SaveAnswerRequest,
    current_user: dict = Depends(get_current_user),
):
    ensure_attempt_owner(attempt_id, current_user["id"])
    try:
        save_attempt_answer(attempt_id, current_user["id"], req.question_id, req.selected_answer)
        return {"saved": True}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@app.post("/attempts/{attempt_id}/integrity")
def post_integrity_event(
    attempt_id: str, req: IntegrityEventRequest,
    current_user: dict = Depends(get_current_user),
):
    ensure_attempt_owner(attempt_id, current_user["id"])
    try:
        return record_integrity_event(attempt_id, req.event_type, req.details)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/attempts/{attempt_id}/submit", response_model=TestResultOut)
def submit_exam(
    attempt_id: str, req: SubmitTestRequest,
    current_user: dict = Depends(get_current_user),
):
    ensure_attempt_owner(attempt_id, current_user["id"])
    try:
        answers = req.answers or {}
        return submit_test_attempt(
            attempt_id=attempt_id, answers=answers, user_id=current_user["id"]
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/attempts/{attempt_id}/analytics")
def process_submitted_attempt_analytics(
    attempt_id: str, current_user: dict = Depends(get_current_user),
):
    ensure_attempt_owner(attempt_id, current_user["id"])
    try:
        return {"processed": process_attempt_analytics(attempt_id, current_user["id"])}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@app.get("/results/{attempt_id}", response_model=TestResultOut)
def get_exam_results(
    attempt_id: str, current_user: dict = Depends(get_current_user)
):
    ensure_attempt_owner(attempt_id, current_user["id"])
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
def get_dashboard(
    exam: str = "JEE", current_user: dict = Depends(get_current_user)
):
    return get_dashboard_analytics(user_id=current_user["id"], exam=exam)

@app.get("/analytics/weaknesses", response_model=List[WeaknessItem])
def get_weaknesses_list(
    exam: str = "JEE", current_user: dict = Depends(get_current_user)
):
    return get_user_weaknesses(user_id=current_user["id"], exam=exam)

# ----------------- FIX THIS WEAKNESS INTERVENTIONS -----------------
@app.post("/weaknesses/{topic}/intervention", response_model=FixWeaknessInterventionOut)
def start_topic_intervention(
    topic: str, exam: str = "JEE", current_user: dict = Depends(get_current_user)
):
    try:
        return generate_intervention(user_id=current_user["id"], topic=topic, exam=exam)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/weaknesses/interventions/{intervention_id}/complete", response_model=InterventionResultOut)
def submit_intervention(
    intervention_id: str, req: CompleteInterventionRequest,
    current_user: dict = Depends(get_current_user),
):
    try:
        return complete_intervention(
            user_id=current_user["id"], intervention_id=intervention_id, answers=req.answers
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ----------------- AI CHAT & DIAGNOSIS -----------------
@app.post("/ai/chat", response_model=AIChatResponse)
def chat_with_coach(
    req: AIChatRequest, current_user: dict = Depends(get_current_user)
):
    try:
        return generate_chat_response(
            user_id=current_user["id"],
            message=req.message,
            current_attempt_id=req.current_attempt_id,
            context=req.context
        )
    except RuntimeError as exc:
        logger.warning("WHY AI chat request failed: %s", exc)
        raise HTTPException(status_code=503, detail=str(exc)) from exc

@app.post("/ai/analyze-mistake", response_model=MistakeDiagnosisOut)
def analyze_single_mistake(question_id: str, selected_answer: str, time_taken_seconds: int = 45, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM questions WHERE id = ?", (question_id,))
    q = cursor.fetchone()
    conn.close()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
        
    diag = diagnose_mistake(dict(q), selected_answer, time_taken_seconds, user_id=current_user["id"])
    return diag

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
