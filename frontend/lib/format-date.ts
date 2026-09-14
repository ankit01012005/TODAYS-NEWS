import { SITE_LOCALE, SITE_TIMEZONE } from "./site";

/// "how long has this been waiting" — the single most useful number on
/// more than one admin page. Short units so it fits a table cell.
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
  return formatPublicDate(iso);
}

/// Whole hours waiting — the review queue's loudest number ("27h").
export function hoursSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000));
}

/// "27h" / "3d" — compact waiting time for a badge.
export function formatWaiting(iso: string): string {
  const hours = hoursSince(iso);
  if (hours < 1) return `${Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60_000))}m`;
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

/// "14 September 2026, 09:40" — CMS timestamps, in the publication's zone.
export function formatDateTime(iso: string): string {
  return formatPublicDateTime(iso);
}

/// "14 Sept 09:40:12" — the audit log's mono column.
export function formatAuditTime(iso: string): string {
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat(SITE_LOCALE, { day: "numeric", month: "short", timeZone: SITE_TIMEZONE }).format(date);
  const time = new Intl.DateTimeFormat(SITE_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: SITE_TIMEZONE,
  }).format(date);
  return `${day} ${time}`;
}

/* ---- Public-site formatting: fixed publication timezone, en-GB order. ---- */

/// "14 September 2026"
export function formatPublicDate(iso: string): string {
  return new Intl.DateTimeFormat(SITE_LOCALE, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: SITE_TIMEZONE,
  }).format(new Date(iso));
}

/// "14 Sept" — short date for list rows and the search results.
export function formatPublicDateShort(iso: string): string {
  return new Intl.DateTimeFormat(SITE_LOCALE, {
    day: "numeric",
    month: "short",
    timeZone: SITE_TIMEZONE,
  }).format(new Date(iso));
}

/// "14 September 2026, 09:40"
export function formatPublicDateTime(iso: string): string {
  return `${formatPublicDate(iso)}, ${formatPublicTime(iso)}`;
}

/// "14 Sept, 09:40 IST" — the article byline rule.
export function formatBylineTime(iso: string): string {
  return `${formatPublicDateShort(iso)}, ${formatPublicTime(iso)} IST`;
}

/// "09:40" — 24-hour, for the Just In rail's timestamps.
export function formatPublicTime(iso: string): string {
  return new Intl.DateTimeFormat(SITE_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: SITE_TIMEZONE,
  }).format(new Date(iso));
}

/// "Sunday, 14 September" — the masthead's edition line.
export function formatMastheadDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat(SITE_LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: SITE_TIMEZONE,
  }).format(date);
}

/// "Thursday 11 September 2026" — long form, for the print-style footer.
export function formatEditionDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat(SITE_LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: SITE_TIMEZONE,
  }).format(date);
}

/// The hour in the publication's zone, for the dashboard greeting.
export function hourInSiteZone(date: Date = new Date()): number {
  const hour = new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: SITE_TIMEZONE }).format(date);
  return Number(hour) % 24;
}
