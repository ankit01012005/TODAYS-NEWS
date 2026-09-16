import { BadRequestError } from "../common/http-errors";

/// DM-07's V1 block types (docs/26 §3.2), validated to docs/26 §3.4:
/// every block's shape, inline-content shape, an `href` allow-list that
/// rejects javascript:/data:/vbscript: and friends, and block/text/depth
/// limits. Closes the gap the earlier structural-only check disclosed.
/// DM-08 still holds independently (nothing ever renders body content as
/// markup); this is the second layer, at the write boundary.
///
/// Shape mirrors frontend/lib/api/body-blocks.ts (what the editor writes)
/// and frontend/components/public/ArticleBody.tsx (what the site reads).
/// An image block may be *empty* (mediaId "" and url "") so an editor can
/// save a draft with a placeholder; a non-empty one names a media asset by
/// id, and its `url` is REPLACED server-side from that asset's stored URL
/// (resolveImageUrls below) — the client's value is never persisted.
/// Completeness for submission is BR-09's job.

const KNOWN_BLOCK_TYPES = new Set(["paragraph", "heading", "image", "quote", "list", "divider"]);

const MAX_BLOCKS = 500;
const MAX_LIST_ITEMS = 200;
const MAX_SPANS_PER_CONTENT = 500;
const MAX_MARKS_PER_SPAN = 3;
const MAX_TEXT_CHARS = 200_000; // across the whole body
const MAX_STRING_FIELD = 2_000; // alt/credit/caption/attribution
const MAX_HREF = 2_048;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface InlineSpan {
  text?: unknown;
  marks?: unknown;
}

export interface Block {
  type?: unknown;
  content?: unknown;
  items?: unknown;
  level?: unknown;
  style?: unknown;
  attribution?: unknown;
  mediaId?: unknown;
  url?: unknown;
  alt?: unknown;
  credit?: unknown;
  caption?: unknown;
}

// A function declaration (not a const arrow) so TypeScript treats each
// `if (...) fail(...)` as terminating and narrows the type afterwards.
function fail(message: string): never {
  throw new BadRequestError(message);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/// Only http(s) absolute links and same-site paths. Everything else —
/// javascript:, data:, vbscript:, file:, protocol-relative // — is refused.
export function isSafeHref(href: string): boolean {
  if (href.length === 0 || href.length > MAX_HREF) return false;
  // Whitespace and control characters have no place in an address and are
  // the classic way to smuggle "java<newline>script:" past a prefix check.
  // eslint-disable-next-line no-control-regex
  if (/[\s\u0000-\u001f\u007f]/.test(href)) return false;
  if (href.startsWith("/") && !href.startsWith("//")) return true;
  if (href.startsWith("#")) return true;
  try {
    const url = new URL(href);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function assertOptionalString(value: unknown, field: string, where: string): void {
  if (value === undefined) return;
  if (typeof value !== "string") fail(`${where}: "${field}" must be a string`);
  if ((value as string).length > MAX_STRING_FIELD) fail(`${where}: "${field}" is too long`);
}

function validateInlineContent(content: unknown, where: string, counter: { chars: number }): void {
  if (!Array.isArray(content)) fail(`${where}: "content" must be an array of text spans`);
  const spans = content as unknown[];
  if (spans.length > MAX_SPANS_PER_CONTENT) fail(`${where}: too many text spans`);

  for (const raw of spans) {
    if (!isPlainObject(raw)) fail(`${where}: every span must be an object`);
    const span = raw as InlineSpan;
    if (typeof span.text !== "string") fail(`${where}: every span needs string "text"`);
    counter.chars += span.text.length;
    if (counter.chars > MAX_TEXT_CHARS) fail("body is too long");

    if (span.marks === undefined) continue;
    if (!Array.isArray(span.marks)) fail(`${where}: "marks" must be an array`);
    if (span.marks.length > MAX_MARKS_PER_SPAN) fail(`${where}: too many marks on one span`);
    for (const mark of span.marks) {
      if (mark === "strong" || mark === "em") continue;
      if (!isPlainObject(mark) || mark.type !== "link" || typeof mark.href !== "string") {
        fail(`${where}: marks must be "strong", "em" or a link`);
      }
      if (!isSafeHref(mark.href as string)) {
        fail(`${where}: link addresses must be http(s) or a path on this site`);
      }
    }
  }
}

export function assertValidBodyShape(body: unknown): asserts body is Block[] {
  if (!Array.isArray(body)) fail("body must be an array of blocks");
  if (body.length > MAX_BLOCKS) fail(`body may contain at most ${MAX_BLOCKS} blocks`);

  const counter = { chars: 0 };

  body.forEach((raw, index) => {
    const where = `body block ${index + 1}`;
    if (!isPlainObject(raw) || typeof raw.type !== "string") {
      fail(`${where}: every block needs a string "type"`);
    }
    const block = raw as Block;
    const type = block.type as string;
    if (!KNOWN_BLOCK_TYPES.has(type)) fail(`${where}: unknown block type "${type}"`);

    switch (type) {
      case "paragraph":
        validateInlineContent(block.content, where, counter);
        break;
      case "heading":
        if (block.level !== 2 && block.level !== 3) fail(`${where}: heading "level" must be 2 or 3`);
        validateInlineContent(block.content, where, counter);
        break;
      case "quote":
        validateInlineContent(block.content, where, counter);
        assertOptionalString(block.attribution, "attribution", where);
        break;
      case "list": {
        if (block.style !== "ordered" && block.style !== "unordered") {
          fail(`${where}: list "style" must be "ordered" or "unordered"`);
        }
        if (!Array.isArray(block.items)) fail(`${where}: list "items" must be an array`);
        const items = block.items as unknown[];
        if (items.length > MAX_LIST_ITEMS) fail(`${where}: too many list items`);
        items.forEach((item, i) => validateInlineContent(item, `${where}, item ${i + 1}`, counter));
        break;
      }
      case "image": {
        if (typeof block.mediaId !== "string" || typeof block.url !== "string" || typeof block.alt !== "string") {
          fail(`${where}: image needs string "mediaId", "url" and "alt"`);
        }
        const mediaId = block.mediaId as string;
        const url = block.url as string;
        const isEmptyPlaceholder = mediaId === "" && url === "";
        if (!isEmptyPlaceholder) {
          if (!UUID_RE.test(mediaId)) fail(`${where}: image "mediaId" must be a media asset id`);
          // Only a sanity bound here — the real address comes from the
          // media asset row (resolveImageUrls), so a forged url can't
          // reach the page even if it passed.
          if (url.length > MAX_HREF) fail(`${where}: image "url" is too long`);
        }
        if ((block.alt as string).length > MAX_STRING_FIELD) fail(`${where}: "alt" is too long`);
        assertOptionalString(block.credit, "credit", where);
        assertOptionalString(block.caption, "caption", where);
        break;
      }
      case "divider":
        break;
    }
  });
}

/// The media asset ids every non-empty image block names, de-duplicated —
/// what the caller must look up before resolveImageUrls can run.
export function collectImageMediaIds(body: Block[]): string[] {
  const ids = new Set<string>();
  for (const block of body) {
    if (block.type === "image" && typeof block.mediaId === "string" && block.mediaId !== "") {
      ids.add(block.mediaId);
    }
  }
  return [...ids];
}

/// Rewrites every non-empty image block's `url` from the stored asset it
/// names. Refuses (400) when a block names an asset that doesn't exist or
/// has been soft-deleted — the editor's picker only offers live assets, so
/// that only happens with a stale form or a hand-crafted request. Returns
/// a new array; never mutates the caller's blocks.
export function resolveImageUrls(body: Block[], urlByMediaId: ReadonlyMap<string, string>): Block[] {
  return body.map((block, index) => {
    if (block.type !== "image" || block.mediaId === "") return block;
    const url = urlByMediaId.get(block.mediaId as string);
    if (!url) fail(`body block ${index + 1}: image "mediaId" does not name an available media asset`);
    return { ...block, url };
  });
}

/// docs/26 §3.7 — a plain-text projection maintained on write, never
/// hand-edited. Walks paragraph/heading/quote inline content and list items.
export function deriveBodyPlain(body: unknown): string {
  if (!Array.isArray(body)) return "";
  const parts: string[] = [];

  const walkInline = (content: unknown): void => {
    if (!Array.isArray(content)) return;
    for (const span of content as InlineSpan[]) {
      if (span && typeof span.text === "string") parts.push(span.text);
    }
  };

  for (const raw of body) {
    const block = raw as Block;
    if (block.type === "paragraph" || block.type === "heading" || block.type === "quote") {
      walkInline(block.content);
    } else if (block.type === "list" && Array.isArray(block.items)) {
      for (const item of block.items as unknown[]) walkInline(item);
    }
  }

  return parts.join(" ").trim();
}
