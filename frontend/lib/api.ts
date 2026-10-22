import {
  DashboardData,
  Question,
  QuestionDetail,
  TestItem,
  ActiveExamState,
  TestResult,
  WeaknessItem,
  InterventionData,
  InterventionResult,
  ExamType
} from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" ? "/api" : "http://localhost:8008");

export async function fetchDashboard(userId = "user_demo", exam: ExamType = "JEE"): Promise<DashboardData> {
  const res = await fetch(`${API_BASE_URL}/analytics/dashboard?user_id=${userId}&exam=${exam}`, {
    cache: "no-store"
  });
  if (!res.ok) throw new Error("Failed to load dashboard data");
  return res.json();
}

export async function fetchQuestions(params: {
  exam?: ExamType;
  subject?: string;
  chapter?: string;
  topic?: string;
  difficulty?: string;
  source_type?: string;
}): Promise<Question[]> {
  const query = new URLSearchParams();
  if (params.exam) query.set("exam", params.exam);
  if (params.subject) query.set("subject", params.subject);
  if (params.chapter) query.set("chapter", params.chapter);
  if (params.topic) query.set("topic", params.topic);
  if (params.difficulty) query.set("difficulty", params.difficulty);
  if (params.source_type) query.set("source_type", params.source_type);

  const res = await fetch(`${API_BASE_URL}/questions?${query.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load questions");
  return res.json();
}

export async function fetchQuestionDetail(questionId: string): Promise<QuestionDetail> {
  const res = await fetch(`${API_BASE_URL}/questions/${questionId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load question details");
  return res.json();
}

export async function submitPracticeAnswer(payload: {
  user_id: string;
  question_id: string;
  selected_answer: string;
  time_taken_seconds?: number;
}) {
  const res = await fetch(`${API_BASE_URL}/practice/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to submit practice answer");
  return res.json();
}

export async function fetchTests(exam: ExamType = "JEE", userId = "user_demo"): Promise<TestItem[]> {
  const res = await fetch(`${API_BASE_URL}/tests?exam=${exam}&user_id=${userId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load tests");
  return res.json();
}

export async function startTest(testId: string, userId = "user_demo"): Promise<ActiveExamState> {
  const res = await fetch(`${API_BASE_URL}/attempts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ test_id: testId, user_id: userId })
  });
  if (!res.ok) throw new Error("Failed to start test attempt");
  return res.json();
}

export async function getExamState(attemptId: string): Promise<ActiveExamState> {
  const res = await fetch(`${API_BASE_URL}/attempts/${attemptId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load active exam state");
  return res.json();
}

export async function reportIntegrityEvent(attemptId: string, eventType: string, details?: string) {
  const res = await fetch(`${API_BASE_URL}/attempts/${attemptId}/integrity`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event_type: eventType, details })
  });
  if (!res.ok) throw new Error("Failed to log integrity event");
  return res.json();
}

export async function submitExam(attemptId: string, answers: Record<string, string>, userId = "user_demo"): Promise<TestResult> {
  const res = await fetch(`${API_BASE_URL}/attempts/${attemptId}/submit?user_id=${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers })
  });
  if (!res.ok) throw new Error("Failed to submit test");
  return res.json();
}

export async function getExamResults(attemptId: string, userId = "user_demo"): Promise<TestResult> {
  const res = await fetch(`${API_BASE_URL}/results/${attemptId}?user_id=${userId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch exam results");
  return res.json();
}

export async function fetchWeaknesses(userId = "user_demo", exam: ExamType = "JEE"): Promise<WeaknessItem[]> {
  const res = await fetch(`${API_BASE_URL}/analytics/weaknesses?user_id=${userId}&exam=${exam}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load weaknesses");
  return res.json();
}

export async function startWeaknessIntervention(topic: string, userId = "user_demo", exam: ExamType = "JEE"): Promise<InterventionData> {
  const res = await fetch(`${API_BASE_URL}/weaknesses/${encodeURIComponent(topic)}/intervention?user_id=${userId}&exam=${exam}`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Failed to generate intervention");
  return res.json();
}

export async function submitWeaknessIntervention(
  interventionId: string,
  answers: Record<string, string>,
  userId = "user_demo"
): Promise<InterventionResult> {
  const res = await fetch(`${API_BASE_URL}/weaknesses/interventions/${interventionId}/complete?user_id=${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers })
  });
  if (!res.ok) throw new Error("Failed to complete intervention");
  return res.json();
}

export async function sendAIChatMessage(payload: {
  user_id: string;
  message: string;
  current_attempt_id?: string;
  context?: any;
}) {
  const res = await fetch(`${API_BASE_URL}/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to chat with AI Coach");
  return res.json();
}

export async function switchUserExam(userId: string, exam: ExamType) {
  const res = await fetch(`${API_BASE_URL}/users/${userId}/exam?exam=${exam}`, {
    method: "PATCH"
  });
  if (!res.ok) throw new Error("Failed to switch exam");
  return res.json();
}
