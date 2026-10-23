export type ExamType = "JEE" | "NEET";

export type MistakeType =
  | "CONCEPTUAL_MISUNDERSTANDING"
  | "FORMULA_RECALL"
  | "CALCULATION_ERROR"
  | "WRONG_APPROACH"
  | "MISREAD_QUESTION"
  | "DIAGRAM_INTERPRETATION"
  | "CARELESS_MISTAKE"
  | "TIME_PRESSURE"
  | "MEMORY_ERROR";

export interface User {
  id: string;
  email: string;
  name: string;
  target_exam: ExamType;
  avatar?: string;
  created_at: string;
}

export interface Question {
  id: string;
  exam: ExamType;
  subject: string;
  chapter: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  question_text: string;
  options: string[];
  source_type: string;
  year: number;
}

export interface QuestionDetail extends Question {
  correct_answer: string;
  explanation: string;
  concept: string;
  common_mistake: string;
  mistake_categories: string[];
}

export interface DayActivity {
  date: string;
  questions_solved: number;
  correct_count: number;
  incorrect_count: number;
  accuracy_percent: number;
  practice_time_minutes: number;
  mistakes_detected: number;
  level: number; // 0 to 5
}

export interface ContributionGrid {
  start_date: string;
  end_date: string;
  total_active_days: number;
  total_questions_solved: number;
  current_streak: number;
  longest_streak: number;
  days: DayActivity[];
}

export interface WeaknessItem {
  id: string;
  topic: string;
  subject: string;
  chapter: string;
  mistake_type: MistakeType | string;
  occurrences: number;
  accuracy_percent: number;
  last_seen: string;
  trend: "recurring" | "improving" | "critical";
}

export interface RecurringMistake {
  mistake_type: string;
  display_title: string;
  occurrences: number;
  subject: string;
  chapter: string;
  topic: string;
  accuracy_percent: number;
  last_seen: string;
  trend: string;
}

export interface DailyGoals {
  target_questions: number;
  completed_questions: number;
  target_tests: number;
  completed_tests: number;
  target_minutes: number;
  completed_minutes: number;
  overall_percentage: number;
}

export interface DashboardData {
  user: User;
  questions_solved: number;
  accuracy_percent: number;
  current_streak: number;
  longest_streak: number;
  tests_completed: number;
  weaknesses_count: number;
  monthly_growth_percent: number | null;
  monthly_trends: { month: string; questions: number; accuracy: number | null }[];
  subject_performance: { subject: string; solved: number; accuracy: number | null }[];
  weakest_area?: WeaknessItem;
  recurring_mistake?: RecurringMistake;
  daily_goals: DailyGoals;
  contribution_grid: ContributionGrid;
  recent_activity: {
    id: string;
    question_id: string;
    question_text: string;
    selected_answer: string | null;
    correct_answer: string;
    is_correct: number;
    time_taken_seconds: number;
    timestamp: string;
    topic: string;
    mistake_type: string | null;
  }[];
}

export interface TestItem {
  id: string;
  title: string;
  exam: ExamType;
  test_type: string;
  subject?: string;
  chapter?: string;
  questions_count: number;
  duration_minutes: number;
  total_marks: number;
  marking_correct: number;
  marking_incorrect: number;
  marking_unattempted: number;
  difficulty: string;
  attempt_status?: "NOT_STARTED" | "RUNNING" | "SUBMITTED" | "AUTO_SUBMITTED";
  last_score?: number;
  attempts: { id: string; status: string; score: number; max_score: number; submitted_at?: string | null }[];
}

export interface ActiveExamState {
  id: string;
  test_id: string;
  test_title: string;
  exam: ExamType;
  status: string;
  started_at: string;
  deadline_at: string;
  duration_seconds: number;
  time_remaining_seconds: number;
  total_questions: number;
  questions: Question[];
  answers: Record<string, string>;
  review_status: Record<string, boolean>;
}

export interface AIDiagnosis {
  mistakeType: MistakeType | string;
  confidence: number;
  diagnosis: string;
  conceptGap: string;
  recommendation: string;
}

export interface QuestionResultItem {
  question_id: string;
  question_text: string;
  options: string[];
  selected_answer: string | null;
  correct_answer: string;
  is_correct: boolean;
  is_unattempted: boolean;
  time_taken_seconds: number;
  marks_awarded: number;
  concept: string;
  explanation: string;
  common_mistake: string;
  mistake_type?: string;
  ai_diagnosis?: AIDiagnosis;
}

export interface SubjectScoreSummary {
  subject: string;
  total_questions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  accuracy_percent: number;
  score: number;
  avg_time_seconds: number;
}

export interface TestResult {
  attempt_id: string;
  test_id?: string;
  test_title: string;
  exam: ExamType;
  status: string;
  started_at: string;
  submitted_at: string;
  score: number;
  max_score: number;
  accuracy_percent: number;
  total_questions: number;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  time_used_seconds: number;
  integrity_flags_count: number;
  subject_breakdown: SubjectScoreSummary[];
  question_results: QuestionResultItem[];
}

export interface InterventionData {
  intervention_id: string;
  topic: string;
  subject: string;
  mistake_type: string;
  step: number;
  total_steps: number;
  accuracy_before: number;
  concept_refresher: {
    title: string;
    key_principles: string[];
    common_trap: string;
    formula_sheet: string;
  };
  worked_example: {
    problem: string;
    step_1: string;
    step_2: string;
    step_3: string;
    step_4: string;
    takeaway: string;
  };
  similar_question: Question;
  practice_set: Question[];
  challenge_question: Question;
}

export interface InterventionResult {
  intervention_id: string;
  topic: string;
  mistake_type: string;
  accuracy_before: number;
  accuracy_after: number;
  improvement_delta: number;
  questions_completed: number;
  correct_count: number;
  message: string;
}
