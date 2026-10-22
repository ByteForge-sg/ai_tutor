import { User, ExamType } from "@/types";

const AUTH_STORAGE_KEY = "why_auth_user";

export const DEFAULT_USER: User = {
  id: "user_demo",
  email: "aditya.sharma@jee2026.in",
  name: "Aditya Sharma",
  target_exam: "JEE",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
  created_at: "2026-05-01T08:00:00Z"
};

export function getCurrentUser(): User {
  if (typeof window === "undefined") return DEFAULT_USER;
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_USER;
}

export function setCurrentUser(user: User): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch (e) {
    console.error(e);
  }
}

export function loginWithGoogle(email: string, name?: string, exam: ExamType = "JEE"): User {
  const user: User = {
    id: `user-${email.split("@")[0]}`,
    email: email,
    name: name || email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    target_exam: exam,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
    created_at: new Date().toISOString()
  };
  setCurrentUser(user);
  return user;
}

export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
