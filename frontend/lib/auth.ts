import { User } from "@/types";

const AUTH_STORAGE_KEY = "why_auth_user";
const AUTH_TOKEN_KEY = "why_auth_token";

/** Returns the signed-in user, or null when nobody is signed in. */
export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!stored || !token) {
      if (!token) localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    return JSON.parse(stored) as User;
  } catch (error) {
    console.error("Could not read the saved user:", error);
    return null;
  }
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error("Could not read the saved authentication token:", error);
    return null;
  }
}

/** Save the server-issued token and user after successful signup/signin. */
export function setAuthenticatedSession(user: User, accessToken: string): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
}

/** Update user details without changing the existing token. */
export function setCurrentUser(user: User): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function logout(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
}
