"use client";

/// Client Components' entry point for every write. Same-origin
/// (`/api/backend/...`, not the backend's own origin) — the browser
/// attaches its own httpOnly cookie automatically; nothing here ever
/// touches or reads the cookie value itself.
export function clientFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`/api/backend${path}`, { ...init, credentials: "include" });
}

/// Parses the proxy's JSON error shape (common/http-errors.ts's
/// AllExceptionsFilter body: { statusCode, correlationId, message,
/// details? }) into a plain message, falling back safely if the body
/// isn't JSON (e.g. a network failure never reached the backend at all).
export async function readErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string };
    return body.message ?? `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}
