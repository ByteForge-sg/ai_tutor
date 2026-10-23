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
  ExamType,
  User,
} from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "/api";

const ACCESS_TOKEN_KEY = "why_auth_token";
const AUTH_USER_KEY = "why_auth_user";

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function saveAuthSession(session: AuthResponse): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, session.access_token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(session.user));
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: init.cache ?? "no-store",
  });
}

const pendingAnswerSaves = new Map<string, Promise<void>>();

async function ensureOk(res: Response, fallback: string): Promise<void> {
  if (res.ok) return;
  if (res.status === 401) {
    clearAuthSession();
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.assign("/login");
    }
  }
  let message = fallback;
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") message = body.detail;
  } catch {
    // Keep the fallback message when the response isn't JSON.
  }
  throw new Error(message);
}

export async function signup(payload: {
  name: string;
  email: string;
  password: string;
  target_exam: ExamType;
}): Promise<AuthResponse> {
  const res = await apiFetch("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  await ensureOk(res, "Signup failed");
  const session = (await res.json()) as AuthResponse;
  saveAuthSession(session);
  return session;
}

export async function signin(payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  await ensureOk(res, "Signin failed");
  const session = (await res.json()) as AuthResponse;
  saveAuthSession(session);
  return session;
}

export async function fetchCurrentUser(): Promise<User> {
  const res = await apiFetch("/users/me");
  await ensureOk(res, "Failed to load your profile. Please sign in again.");
  return res.json();
}

// The user ID arguments remain optional for compatibility with existing screens.
// The backend identifies the user from the JWT, not from a client-supplied ID.
export async function fetchDashboard(_userId?: string, exam: ExamType = "JEE"): Promise<DashboardData> {
  const res = await apiFetch(`/analytics/dashboard?exam=${encodeURIComponent(exam)}`);
  await ensureOk(res, "Failed to load dashboard data");
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

  const suffix = query.toString();
  const res = await apiFetch(`/questions${suffix ? `?${suffix}` : ""}`);
  await ensureOk(res, "Failed to load questions");
  return res.json();
}

export async function fetchQuestionDetail(questionId: string): Promise<QuestionDetail> {
  const res = await apiFetch(`/questions/${encodeURIComponent(questionId)}`);
  await ensureOk(res, "Failed to load question details");
  return res.json();
}

export async function submitPracticeAnswer(payload: {
  user_id?: string;
  question_id: string;
  selected_answer: string;
  time_taken_seconds?: number;
}) {
  const res = await apiFetch("/practice/answer", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  await ensureOk(res, "Failed to submit practice answer");
  return res.json();
}

export async function fetchTests(exam: ExamType = "JEE", _userId?: string, category?: "PYP" | "TEST_SERIES"): Promise<TestItem[]> {
  const query = new URLSearchParams({ exam });
  if (category) query.set("category", category);
  const res = await apiFetch(`/tests?${query.toString()}`);
  await ensureOk(res, "Failed to load tests");
  return res.json();
}

export async function startTest(testId: string, _userId?: string): Promise<ActiveExamState> {
  const res = await apiFetch("/attempts", {
    method: "POST",
    body: JSON.stringify({ test_id: testId }),
  });
  await ensureOk(res, "Failed to start test attempt");
  return res.json();
}

export async function getExamState(attemptId: string): Promise<ActiveExamState> {
  const res = await apiFetch(`/attempts/${encodeURIComponent(attemptId)}`);
  await ensureOk(res, "Failed to load active exam state");
  return res.json();
}

export async function saveExamAnswer(attemptId: string, questionId: string, selectedAnswer: string | null): Promise<void> {
  const previous = pendingAnswerSaves.get(attemptId) ?? Promise.resolve();
  const save = previous.catch(() => undefined).then(async () => {
    const res = await apiFetch(`/attempts/${encodeURIComponent(attemptId)}/answers`, {
      method: "PUT",
      body: JSON.stringify({ question_id: questionId, selected_answer: selectedAnswer }),
    });
    await ensureOk(res, "Failed to save answer");
  });
  pendingAnswerSaves.set(attemptId, save);
  try {
    await save;
  } finally {
    if (pendingAnswerSaves.get(attemptId) === save) pendingAnswerSaves.delete(attemptId);
  }
}

export async function reportIntegrityEvent(attemptId: string, eventType: string, details?: string) {
  const res = await apiFetch(`/attempts/${encodeURIComponent(attemptId)}/integrity`, {
    method: "POST",
    body: JSON.stringify({ event_type: eventType, details }),
  });
  await ensureOk(res, "Failed to log integrity event");
  return res.json();
}

export async function submitExam(attemptId: string, answers: Record<string, string>, _userId?: string): Promise<TestResult> {
  await pendingAnswerSaves.get(attemptId)?.catch(() => undefined);
  const res = await apiFetch(`/attempts/${encodeURIComponent(attemptId)}/submit`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
  await ensureOk(res, "Failed to submit test");
  return res.json();
}

export async function processExamAnalytics(attemptId: string): Promise<void> {
  const res = await apiFetch(`/attempts/${encodeURIComponent(attemptId)}/analytics`, { method: "POST" });
  await ensureOk(res, "Failed to update your analytics");
}

export async function getExamResults(attemptId: string, _userId?: string): Promise<TestResult> {
  const res = await apiFetch(`/results/${encodeURIComponent(attemptId)}`);
  await ensureOk(res, "Failed to fetch exam results");
  return res.json();
}

export async function fetchWeaknesses(_userId?: string, exam: ExamType = "JEE"): Promise<WeaknessItem[]> {
  const res = await apiFetch(`/analytics/weaknesses?exam=${encodeURIComponent(exam)}`);
  await ensureOk(res, "Failed to load weaknesses");
  return res.json();
}

export async function startWeaknessIntervention(topic: string, _userId?: string, exam: ExamType = "JEE"): Promise<InterventionData> {
  const res = await apiFetch(`/weaknesses/${encodeURIComponent(topic)}/intervention?exam=${encodeURIComponent(exam)}`, {
    method: "POST",
  });
  await ensureOk(res, "Failed to generate intervention");
  return res.json();
}

export async function submitWeaknessIntervention(
  interventionId: string,
  answers: Record<string, string>,
  _userId?: string,
): Promise<InterventionResult> {
  const res = await apiFetch(`/weaknesses/interventions/${encodeURIComponent(interventionId)}/complete`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
  await ensureOk(res, "Failed to complete intervention");
  return res.json();
}

export async function sendAIChatMessage(payload: {
  user_id?: string;
  message: string;
  current_attempt_id?: string;
  context?: Record<string, unknown>;
}): Promise<{ reply: string; mode: "HELPFUL" | "EXAM_BLOCKED"; suggestions?: string[] }> {
  const res = await apiFetch("/ai/chat", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  await ensureOk(res, "Failed to chat with AI Coach");
  const response = (await res.json()) as { reply?: unknown; mode?: unknown; suggestions?: unknown };
  if (
    typeof response.reply !== "string" ||
    (response.mode !== "HELPFUL" && response.mode !== "EXAM_BLOCKED")
  ) {
    throw new Error("WHY AI Coach returned an invalid response. Please try again.");
  }
  return {
    reply: response.reply,
    mode: response.mode,
    suggestions: Array.isArray(response.suggestions)
      ? response.suggestions.filter((item): item is string => typeof item === "string")
      : undefined,
  };
}

export async function switchUserExam(_userId: string | undefined, exam: ExamType) {
  const res = await apiFetch("/users/me/exam", {
    method: "PATCH",
    body: JSON.stringify({ target_exam: exam }),
  });
  await ensureOk(res, "Failed to switch exam");
  return res.json();
}
