import { SITE_LOCALE, SITE_TIMEZONE } from "./site";

/// Shared by ArticleListRow (5C) and the review queue / article history
/// pages (5D) — "how long has this been waiting" is the single most
/// useful number on more than one admin page (docs/10 A-02, A-03).
export function formatRelative(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60_000);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}, ${date.toLocaleTimeString(
    "en-US",
    { hour: "2-digit", minute: "2-digit" },
  )}`;
}

/* ---- Public-site formatting: fixed publication timezone, en-GB order. ---- */

/// "11 September 2026"
export function formatPublicDate(iso: string): string {
  return new Intl.DateTimeFormat(SITE_LOCALE, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: SITE_TIMEZONE,
  }).format(new Date(iso));
}

/// "11 September 2026, 09:20"
export function formatPublicDateTime(iso: string): string {
  const date = new Date(iso);
  return `${formatPublicDate(iso)}, ${formatPublicTime(date.toISOString())}`;
}

/// "09:20" — 24-hour, for the Just In rail's timestamps.
export function formatPublicTime(iso: string): string {
  return new Intl.DateTimeFormat(SITE_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: SITE_TIMEZONE,
  }).format(new Date(iso));
}

/// "Thursday 11 September 2026" — the publication strip.
export function formatEditionDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat(SITE_LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: SITE_TIMEZONE,
  }).format(date);
}
