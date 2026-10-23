
import sqlite3
import os
from pathlib import Path

DB_PATH = os.environ.get(
    "DB_PATH",
    str(Path(__file__).parent.parent / "why_mistake_coach.db")
)


def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.execute("PRAGMA busy_timeout=30000;")
    conn.row_factory = sqlite3.Row

    try:
        yield conn
    finally:
        conn.close()


def get_db_connection():
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.execute("PRAGMA busy_timeout=30000;")
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn


def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # WAL is persistent database configuration; setting it on every new
        # connection takes a write lock and can contend with active requests.
        cursor.execute("PRAGMA journal_mode=WAL;")
        # Users
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            target_exam TEXT NOT NULL DEFAULT 'JEE',
            avatar TEXT,
            created_at TEXT NOT NULL,
            password_hash TEXT
        )
        """)

        # Safely migrate existing databases.
        cursor.execute("PRAGMA table_info(users)")
        user_columns = {row["name"] for row in cursor.fetchall()}

        if "password_hash" not in user_columns:
            cursor.execute(
                "ALTER TABLE users ADD COLUMN password_hash TEXT"
            )

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
            test_type TEXT NOT NULL,
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
            attempt_type TEXT NOT NULL,
            test_id TEXT,
            test_title TEXT,
            exam TEXT NOT NULL,
            status TEXT NOT NULL,
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
            analysis_processed_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        """)

        cursor.execute("PRAGMA table_info(attempts)")
        attempt_columns = {row["name"] for row in cursor.fetchall()}
        if "analysis_processed_at" not in attempt_columns:
            cursor.execute("ALTER TABLE attempts ADD COLUMN analysis_processed_at TEXT")

        # Question Attempts
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS question_attempts (
            id TEXT PRIMARY KEY,
            attempt_id TEXT,
            user_id TEXT NOT NULL,
            question_id TEXT NOT NULL,
            selected_answer TEXT,
            correct_answer TEXT NOT NULL,
            is_correct INTEGER NOT NULL,
            time_taken_seconds INTEGER NOT NULL DEFAULT 0,
            timestamp TEXT NOT NULL,
            activity_date TEXT NOT NULL,
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
            event_type TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            details TEXT,
            FOREIGN KEY (attempt_id) REFERENCES attempts(id)
        )
        """)

        # Weakness Profiles
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
            trend TEXT NOT NULL DEFAULT 'recurring',
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        """)

        # Interventions
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS interventions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            weakness_id TEXT,
            topic TEXT NOT NULL,
            mistake_type TEXT NOT NULL,
            step INTEGER NOT NULL DEFAULT 1,
            total_steps INTEGER NOT NULL DEFAULT 5,
            status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
            accuracy_before REAL NOT NULL,
            accuracy_after REAL,
            created_at TEXT NOT NULL,
            completed_at TEXT
        )
        """)

        # Chat messages
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_messages (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            context_data_json TEXT,
            created_at TEXT NOT NULL
        )
        """)

        # Indexes for analytics and lookups
        cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_qa_user_date
        ON question_attempts(user_id, activity_date)
        """)

        cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_qa_user_mistake
        ON question_attempts(user_id, mistake_type)
        """)

        cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_qa_topic
        ON question_attempts(user_id, topic)
        """)

        cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_attempts_user
        ON attempts(user_id, started_at)
        """)

        conn.commit()

    except Exception:
        conn.rollback()
        raise

    finally:
        conn.close()


if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
