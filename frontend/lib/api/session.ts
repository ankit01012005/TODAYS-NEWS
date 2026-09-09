import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiBaseUrl } from "./config";
import { AuthenticatedUser } from "./auth-types";

/// Must match the backend's default (backend/src/config/env.validation.ts)
/// — there is no shared package between the two apps to import this from,
/// same hand-maintained-mirror convention as the API response types.
export const SESSION_COOKIE_NAME = "today_news_session";

/// Server Components call the backend directly, forwarding the browser's
/// session cookie (docs/23 §4.4 "CMS reads" row: server components call
/// the API per request with the session cookie forwarded — always fresh,
/// no stale editorial data). `cache: "no-store"` for the same reason: a
/// cached CMS response is a data-leak vector across sessions (docs/19
/// §2.14, docs/23 §16.2).
export async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);
  const headers = new Headers(init?.headers);
  if (session) {
    headers.set("Cookie", `${SESSION_COOKIE_NAME}=${session.value}`);
  }
  return fetch(`${apiBaseUrl()}${path}`, { ...init, headers, cache: "no-store" });
}

/// GET /auth/me — returns null on 401 rather than throwing, so callers can
/// choose to redirect (requireSession) or render differently (nothing else
/// in this phase needs the distinction, but a "signed in as" header would).
export async function getSessionUser(): Promise<AuthenticatedUser | null> {
  const res = await authFetch("/auth/me");
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`GET /auth/me failed: ${res.status}`);
  const body = (await res.json()) as { user: AuthenticatedUser };
  return body.user;
}

/// Used at the top of every protected Server Component page. Next's
/// redirect() throws internally — this function's return type reflects
/// that callers never see it return without a user.
export async function requireSession(): Promise<AuthenticatedUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/staff/sign-in");
  }
  return user;
}

/// docs/09 §8 / docs/10 — capability checks belong on the server that
/// enforces them (SEC-01/SEC-02); this is a UI-routing convenience only
/// ("send an editor away from an admin-only page"), never the security
/// boundary itself — the backend refuses the underlying request either way.
export async function requireRole(role: "EDITOR" | "ADMIN"): Promise<AuthenticatedUser> {
  const user = await requireSession();
  if (role === "ADMIN" && user.role !== "ADMIN") {
    redirect("/staff/access-denied");
  }
  return user;
}
