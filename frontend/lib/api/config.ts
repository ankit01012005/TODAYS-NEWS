/// Server-only. Never prefixed NEXT_PUBLIC_* — the browser must never talk
/// to the API directly (docs/23 §11.4); every call originates from a
/// server component, server action or route handler.
///
/// The value is validated in lib/env.ts; this file stays as the import
/// path the API layer already uses.
export { apiBaseUrl } from "../env";
