/// Mirrors backend/src/articles/body.util.ts's known block types (docs/26
/// §3.2) and components/public/ArticleBody.tsx's parsing shape — the
/// editor writes exactly what the public renderer already knows how to
/// read, so nothing here invents a shape those two don't already agree on.

export interface InlineSpan {
  text: string;
}

export interface ParagraphBlock {
  type: "paragraph";
  content: InlineSpan[];
}
export interface HeadingBlock {
  type: "heading";
  level: 2 | 3;
  content: InlineSpan[];
}
export interface ImageBlock {
  type: "image";
  mediaId: string;
  url: string;
  alt: string;
  credit?: string;
  caption?: string;
}
export interface QuoteBlock {
  type: "quote";
  content: InlineSpan[];
  attribution?: string;
}
export interface ListBlock {
  type: "list";
  style: "ordered" | "unordered";
  items: InlineSpan[][];
}
export interface DividerBlock {
  type: "divider";
}

export type BodyBlock = ParagraphBlock | HeadingBlock | ImageBlock | QuoteBlock | ListBlock | DividerBlock;

export const BLOCK_TYPE_LABELS: Record<BodyBlock["type"], string> = {
  paragraph: "Paragraph",
  heading: "Heading",
  image: "Image",
  quote: "Quote",
  list: "List",
  divider: "Divider",
};

/// Inline marks (bold/italic/link) aren't editable here — a disclosed V1
/// gap, same category as body.util.ts's own "structural check only" note.
/// A block written this way carries single-span, mark-free content; the
/// public renderer still supports marks for content written another way.
export function textOf(spans: InlineSpan[]): string {
  return spans.map((s) => s.text).join("");
}

export function spansOf(text: string): InlineSpan[] {
  return text.length > 0 ? [{ text }] : [];
}

export function emptyBlock(type: BodyBlock["type"]): BodyBlock {
  switch (type) {
    case "paragraph":
      return { type: "paragraph", content: [] };
    case "heading":
      return { type: "heading", level: 2, content: [] };
    case "image":
      return { type: "image", mediaId: "", url: "", alt: "" };
    case "quote":
      return { type: "quote", content: [] };
    case "list":
      return { type: "list", style: "unordered", items: [[]] };
    case "divider":
      return { type: "divider" };
  }
}

function isInlineSpanArray(value: unknown): value is InlineSpan[] {
  return (
    Array.isArray(value) &&
    value.every((v) => typeof v === "object" && v !== null && typeof (v as { text?: unknown }).text === "string")
  );
}

function asBlock(raw: unknown): BodyBlock | null {
  if (typeof raw !== "object" || raw === null || !("type" in raw)) return null;
  const block = raw as Record<string, unknown>;
  switch (block.type) {
    case "paragraph":
      return { type: "paragraph", content: isInlineSpanArray(block.content) ? block.content : [] };
    case "heading":
      return {
        type: "heading",
        level: block.level === 3 ? 3 : 2,
        content: isInlineSpanArray(block.content) ? block.content : [],
      };
    case "image":
      return {
        type: "image",
        mediaId: typeof block.mediaId === "string" ? block.mediaId : "",
        url: typeof block.url === "string" ? block.url : "",
        alt: typeof block.alt === "string" ? block.alt : "",
        credit: typeof block.credit === "string" ? block.credit : undefined,
        caption: typeof block.caption === "string" ? block.caption : undefined,
      };
    case "quote":
      return {
        type: "quote",
        content: isInlineSpanArray(block.content) ? block.content : [],
        attribution: typeof block.attribution === "string" ? block.attribution : undefined,
      };
    case "list":
      return {
        type: "list",
        style: block.style === "ordered" ? "ordered" : "unordered",
        items: Array.isArray(block.items)
          ? (block.items as unknown[]).map((i) => (isInlineSpanArray(i) ? i : []))
          : [[]],
      };
    case "divider":
      return { type: "divider" };
    default:
      return null;
  }
}

/// Best-effort parse of whatever the API returned for `body` — unknown or
/// malformed entries are dropped rather than crashing the editor, same
/// discipline as ArticleBody's public renderer.
export function parseBody(raw: unknown): BodyBlock[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(asBlock).filter((b): b is BodyBlock => b !== null);
}
