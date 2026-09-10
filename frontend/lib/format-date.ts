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
