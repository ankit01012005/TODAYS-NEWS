"use client";

/// Client Components' entry point for every write. Same-origin
/// (`/api/backend/...`, not the backend's own origin) — the browser
/// attaches its own httpOnly cookie automatically; nothing here ever
/// touches or reads the cookie value itself.
export function clientFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`/api/backend${path}`, { ...init, credentials: "include" });
}

/// Parses the proxy's JSON error shape ({ statusCode, correlationId,
/// message, details? }) into a plain message, falling back safely if the
/// body isn't JSON (e.g. a network failure never reached the backend).
export async function readErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string };
    return body.message ?? `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

/// The two failures every write surface must treat specially (2t):
///   stale      — 409: someone else changed the record since it was
///                loaded; nothing was saved, and the page must say so
///                rather than fail silently.
///   signed-out — 401: the session expired mid-edit; the draft text is
///                still on screen and must be kept until they sign in.
/// Everything else is an ordinary inline error.
export type WriteFailure =
  | { kind: "stale"; message: string }
  | { kind: "signed-out"; message: string }
  | { kind: "error"; message: string };

export async function readWriteFailure(res: Response): Promise<WriteFailure> {
  const message = await readErrorMessage(res);
  if (res.status === 409) return { kind: "stale", message };
  if (res.status === 401) return { kind: "signed-out", message };
  return { kind: "error", message };
}
