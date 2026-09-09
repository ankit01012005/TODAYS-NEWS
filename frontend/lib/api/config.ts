/// Server-only. Never prefixed NEXT_PUBLIC_* — the browser must never talk
/// to the API directly (docs/23 §11.4); every call originates from a
/// server component, server action or route handler.
export function apiBaseUrl(): string {
  const url = process.env.API_BASE_URL;
  if (!url) {
    throw new Error("API_BASE_URL is not set — copy .env.example to .env.local");
  }
  return url;
}
