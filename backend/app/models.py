
from pydantic import BaseModel, Field, EmailStr, ConfigDict
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


# Authentication
class UserSignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=100)
    target_exam: ExamType = ExamType.JEE


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    name: str
    target_exam: str
    avatar: Optional[str] = None
    created_at: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ExamUpdateRequest(BaseModel):
    target_exam: ExamType


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
    attempt_status: Optional[str] = "NOT_STARTED"
    last_score: Optional[int] = None
    attempts: List[Dict[str, Any]] = Field(default_factory=list)


class StartTestRequest(BaseModel):
    test_id: str
    user_id: Optional[str] = None


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
    answers: Dict[str, str] = Field(default_factory=dict)
    review_status: Dict[str, bool] = Field(default_factory=dict)


class SaveAnswerRequest(BaseModel):
    question_id: str
    selected_answer: Optional[str] = None
    is_marked_for_review: Optional[bool] = False
    time_taken_seconds: Optional[int] = 0


class IntegrityEventRequest(BaseModel):
    event_type: str
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
    user_id: Optional[str] = None
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
    trend: str


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
    answers: Dict[str, str]


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
    date: str
    questions_solved: int
    correct_count: int
    incorrect_count: int
    accuracy_percent: float
    practice_time_minutes: int
    mistakes_detected: int
    level: int


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
    weaknesses_count: int = 0
    monthly_growth_percent: Optional[float] = None
    monthly_trends: List[Dict[str, Any]] = Field(default_factory=list)
    subject_performance: List[Dict[str, Any]] = Field(default_factory=list)
    weakest_area: Optional[WeaknessItem] = None
    recurring_mistake: Optional[RecurringMistakeItem] = None
    daily_goals: Dict[str, Any]
    contribution_grid: ContributionGridData
    recent_activity: List[Dict[str, Any]]


class AIChatRequest(BaseModel):
    user_id: Optional[str] = None
    message: str
    current_attempt_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class AIChatResponse(BaseModel):
    reply: str
    mode: str
    suggestions: Optional[List[str]] = None
