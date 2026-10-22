import sqlite3
import os
import json
from pathlib import Path

DB_PATH = os.environ.get("DB_PATH", str(Path(__file__).parent.parent / "why_mistake_coach.db"))

def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA busy_timeout=30000;")
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def get_db_connection():
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA busy_timeout=30000;")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Users
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        target_exam TEXT NOT NULL DEFAULT 'JEE',
        avatar TEXT,
        created_at TEXT NOT NULL
    )
    """)

    # Questions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        exam TEXT NOT NULL,
        subject TEXT NOT NULL,
        chapter TEXT NOT NULL,
        topic TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        question_text TEXT NOT NULL,
        options_json TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        explanation TEXT NOT NULL,
        concept TEXT NOT NULL,
        common_mistake TEXT NOT NULL,
        mistake_categories_json TEXT NOT NULL,
        source_type TEXT NOT NULL,
        year INTEGER NOT NULL
    )
    """)

    # Test definitions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tests (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        exam TEXT NOT NULL,
        test_type TEXT NOT NULL, -- Full Simulation, Subject Test, Chapter Test, Previous Year Paper
        subject TEXT,
        chapter TEXT,
        questions_count INTEGER NOT NULL,
        duration_minutes INTEGER NOT NULL,
        total_marks INTEGER NOT NULL,
        marking_correct INTEGER NOT NULL DEFAULT 4,
        marking_incorrect INTEGER NOT NULL DEFAULT -1,
        marking_unattempted INTEGER NOT NULL DEFAULT 0,
        difficulty TEXT NOT NULL,
        question_ids_json TEXT NOT NULL
    )
    """)

    # Test Attempts / Sessions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS attempts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        attempt_type TEXT NOT NULL, -- TEST, PRACTICE, INTERVENTION
        test_id TEXT,
        test_title TEXT,
        exam TEXT NOT NULL,
        status TEXT NOT NULL, -- CREATED, RUNNING, SUBMITTED, AUTO_SUBMITTED, FLAGGED
        started_at TEXT NOT NULL,
        deadline_at TEXT,
        submitted_at TEXT,
        score INTEGER DEFAULT 0,
        max_score INTEGER DEFAULT 0,
        total_questions INTEGER DEFAULT 0,
        correct_count INTEGER DEFAULT 0,
        incorrect_count INTEGER DEFAULT 0,
        unanswered_count INTEGER DEFAULT 0,
        time_taken_seconds INTEGER DEFAULT 0,
        integrity_flags_count INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)

    # Question Attempts (Every single question attempt contributes to the feedback loop)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS question_attempts (
        id TEXT PRIMARY KEY,
        attempt_id TEXT,
        user_id TEXT NOT NULL,
        question_id TEXT NOT NULL,
        selected_answer TEXT,
        correct_answer TEXT NOT NULL,
        is_correct INTEGER NOT NULL, -- 1: correct, 0: incorrect, -1: unattempted
        time_taken_seconds INTEGER NOT NULL DEFAULT 0,
        timestamp TEXT NOT NULL,
        activity_date TEXT NOT NULL, -- YYYY-MM-DD
        exam TEXT NOT NULL,
        subject TEXT NOT NULL,
        chapter TEXT NOT NULL,
        topic TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        mistake_type TEXT,
        ai_diagnosis_json TEXT,
        FOREIGN KEY (question_id) REFERENCES questions(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)

    # Exam Integrity Events
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS integrity_events (
        id TEXT PRIMARY KEY,
        attempt_id TEXT NOT NULL,
        event_type TEXT NOT NULL, -- TAB_SWITCH, FULLSCREEN_EXIT, WINDOW_BLUR, PAGE_LEAVE
        timestamp TEXT NOT NULL,
        details TEXT,
        FOREIGN KEY (attempt_id) REFERENCES attempts(id)
    )
    """)

    # Weakness Profiles (Aggregated / detected recurring patterns)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS weaknesses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        exam TEXT NOT NULL,
        subject TEXT NOT NULL,
        chapter TEXT NOT NULL,
        topic TEXT NOT NULL,
        mistake_type TEXT NOT NULL,
        occurrences INTEGER NOT NULL DEFAULT 1,
        accuracy_percent REAL NOT NULL DEFAULT 0.0,
        last_seen TEXT NOT NULL,
        trend TEXT NOT NULL DEFAULT 'recurring', -- recurring, improving, critical
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)

    # Interventions (Fix This Weakness adaptive workflow)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS interventions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        weakness_id TEXT,
        topic TEXT NOT NULL,
        mistake_type TEXT NOT NULL,
        step INTEGER NOT NULL DEFAULT 1,
        total_steps INTEGER NOT NULL DEFAULT 5,
        status TEXT NOT NULL DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, COMPLETED
        accuracy_before REAL NOT NULL,
        accuracy_after REAL,
        created_at TEXT NOT NULL,
        completed_at TEXT
    )
    """)

    # Chat messages history
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL, -- user, assistant, system
        content TEXT NOT NULL,
        context_data_json TEXT,
        created_at TEXT NOT NULL
    )
    """)

    # Indexes for fast aggregation
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_qa_user_date ON question_attempts(user_id, activity_date)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_qa_user_mistake ON question_attempts(user_id, mistake_type)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_qa_topic ON question_attempts(user_id, topic)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts(user_id, started_at)")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
