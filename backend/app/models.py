from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class ExamType(str, Enum):
    JEE = "JEE"
    NEET = "NEET"

class MistakeType(str, Enum):
    CONCEPTUAL_MISUNDERSTANDING = "CONCEPTUAL_MISUNDERSTANDING"
    FORMULA_RECALL = "FORMULA_RECALL"
    CALCULATION_ERROR = "CALCULATION_ERROR"
    WRONG_APPROACH = "WRONG_APPROACH"
    MISREAD_QUESTION = "MISREAD_QUESTION"
    DIAGRAM_INTERPRETATION = "DIAGRAM_INTERPRETATION"
    CARELESS_MISTAKE = "CARELESS_MISTAKE"
    TIME_PRESSURE = "TIME_PRESSURE"
    MEMORY_ERROR = "MEMORY_ERROR"

class UserLoginRequest(BaseModel):
    email: str
    target_exam: Optional[str] = "JEE"
    name: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    target_exam: str
    avatar: Optional[str] = None
    created_at: str

class QuestionOut(BaseModel):
    id: str
    exam: str
    subject: str
    chapter: str
    topic: str
    difficulty: str
    question_text: str
    options: List[str]
    source_type: str
    year: int

class QuestionDetail(QuestionOut):
    correct_answer: str
    explanation: str
    concept: str
    common_mistake: str
    mistake_categories: List[str]

class TestListItem(BaseModel):
    id: str
    title: str
    exam: str
    test_type: str
    subject: Optional[str] = None
    chapter: Optional[str] = None
    questions_count: int
    duration_minutes: int
    total_marks: int
    marking_correct: int
    marking_incorrect: int
    marking_unattempted: int
    difficulty: str
    attempt_status: Optional[str] = "NOT_STARTED" # NOT_STARTED, IN_PROGRESS, COMPLETED
    last_score: Optional[int] = None

class StartTestRequest(BaseModel):
    test_id: str
    user_id: str

class TestAttemptOut(BaseModel):
    id: str
    test_id: str
    test_title: str
    exam: str
    status: str
    started_at: str
    deadline_at: str
    duration_seconds: int
    time_remaining_seconds: int
    total_questions: int
    questions: List[QuestionOut]
    answers: Dict[str, str] = {} # question_id -> selected_option
    review_status: Dict[str, bool] = {} # question_id -> marked_for_review

class SaveAnswerRequest(BaseModel):
    question_id: str
    selected_answer: Optional[str] = None # 'A', 'B', 'C', 'D' or null to clear
    is_marked_for_review: Optional[bool] = False
    time_taken_seconds: Optional[int] = 0

class IntegrityEventRequest(BaseModel):
    event_type: str # TAB_SWITCH, FULLSCREEN_EXIT, WINDOW_BLUR, PAGE_LEAVE
    details: Optional[str] = None

class SubmitTestRequest(BaseModel):
    answers: Optional[Dict[str, str]] = None
    time_spent_seconds: Optional[int] = None

class QuestionResultItem(BaseModel):
    question_id: str
    question_text: str
    options: List[str]
    selected_answer: Optional[str]
    correct_answer: str
    is_correct: bool
    is_unattempted: bool
    time_taken_seconds: int
    marks_awarded: int
    concept: str
    explanation: str
    common_mistake: str
    mistake_type: Optional[str]
    ai_diagnosis: Optional[Dict[str, Any]] = None

class SubjectScoreSummary(BaseModel):
    subject: str
    total_questions: int
    attempted: int
    correct: int
    incorrect: int
    accuracy_percent: float
    score: int
    avg_time_seconds: int

class TestResultOut(BaseModel):
    attempt_id: str
    test_id: Optional[str]
    test_title: str
    exam: str
    status: str
    started_at: str
    submitted_at: str
    score: int
    max_score: int
    accuracy_percent: float
    total_questions: int
    correct_count: int
    incorrect_count: int
    unanswered_count: int
    time_used_seconds: int
    integrity_flags_count: int
    subject_breakdown: List[SubjectScoreSummary]
    question_results: List[QuestionResultItem]

class PracticeAnswerRequest(BaseModel):
    user_id: str
    question_id: str
    selected_answer: str
    time_taken_seconds: int = 45

class PracticeAnswerResponse(BaseModel):
    is_correct: bool
    correct_answer: str
    selected_answer: str
    explanation: str
    concept: str
    common_mistake: str
    mistake_type: Optional[str]
    ai_diagnosis: Optional[Dict[str, Any]] = None
    streak_updated: int
    questions_solved_today: int

class MistakeDiagnosisOut(BaseModel):
    mistakeType: str
    confidence: float
    diagnosis: str
    conceptGap: str
    recommendation: str

class RecurringMistakeItem(BaseModel):
    mistake_type: str
    display_title: str
    occurrences: int
    subject: str
    chapter: str
    topic: str
    accuracy_percent: float
    last_seen: str
    trend: str

class WeaknessItem(BaseModel):
    id: str
    topic: str
    subject: str
    chapter: str
    mistake_type: str
    occurrences: int
    accuracy_percent: float
    last_seen: str
    trend: str # recurring, improving, critical

class FixWeaknessInterventionOut(BaseModel):
    intervention_id: str
    topic: str
    subject: str
    mistake_type: str
    step: int
    total_steps: int
    accuracy_before: float
    concept_refresher: Dict[str, Any]
    worked_example: Dict[str, Any]
    similar_question: QuestionOut
    practice_set: List[QuestionOut]
    challenge_question: QuestionOut

class CompleteInterventionRequest(BaseModel):
    answers: Dict[str, str] # question_id -> selected_option

class InterventionResultOut(BaseModel):
    intervention_id: str
    topic: str
    mistake_type: str
    accuracy_before: float
    accuracy_after: float
    improvement_delta: float
    questions_completed: int
    correct_count: int
    message: str

class DayActivity(BaseModel):
    date: str # YYYY-MM-DD
    questions_solved: int # completed attempts
    correct_count: int
    incorrect_count: int
    accuracy_percent: float
    practice_time_minutes: int
    mistakes_detected: int
    level: int # 0 to 5 for GitHub contribution grid color

class ContributionGridData(BaseModel):
    start_date: str
    end_date: str
    total_active_days: int
    total_questions_solved: int
    current_streak: int
    longest_streak: int
    days: List[DayActivity]

class DashboardSummaryOut(BaseModel):
    user: UserResponse
    questions_solved: int
    accuracy_percent: float
    current_streak: int
    longest_streak: int
    tests_completed: int
    monthly_growth_percent: float
    weakest_area: Optional[WeaknessItem] = None
    recurring_mistake: Optional[RecurringMistakeItem] = None
    daily_goals: Dict[str, Any]
    contribution_grid: ContributionGridData
    recent_activity: List[Dict[str, Any]]

class AIChatRequest(BaseModel):
    user_id: str
    message: str
    current_attempt_id: Optional[str] = None # If test is running, must block!
    context: Optional[Dict[str, Any]] = None # question, mistake, topic

class AIChatResponse(BaseModel):
    reply: str
    mode: str # "EXAM_BLOCKED" or "HELPFUL"
    suggestions: Optional[List[str]] = None
