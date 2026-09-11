import { WORDS_PER_MINUTE } from "./site";

/// Brief §12 — a reading-time estimate for the article header, from the
/// body's block content plus the summary. Tolerant of any shape: the
/// renderer (ArticleBody) validates blocks; this only counts words it can
/// find and never throws on input it doesn't recognise.
export function estimateReadingMinutes(body: unknown, summary = ""): number {
  const words = countWords(summary) + (Array.isArray(body) ? body.reduce((n, block) => n + blockWords(block), 0) : 0);
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

function blockWords(block: unknown): number {
  if (typeof block !== "object" || block === null) return 0;
  const b = block as Record<string, unknown>;
  if (Array.isArray(b.content)) return spansWords(b.content);
  if (Array.isArray(b.items)) return b.items.reduce<number>((n, item) => n + (Array.isArray(item) ? spansWords(item) : 0), 0);
  return 0;
}

function spansWords(spans: unknown[]): number {
  return spans.reduce<number>((n, span) => {
    if (typeof span === "object" && span !== null && typeof (span as { text?: unknown }).text === "string") {
      return n + countWords((span as { text: string }).text);
    }
    return n;
  }, 0);
}

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}
