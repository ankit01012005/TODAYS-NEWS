import { BadRequestError } from "../common/http-errors";

/// DM-07's V1 block types (docs/26 §3.2). Structural check only — enough to
/// reject something that clearly isn't a blocks document, and to derive
/// bodyPlain. Full validation (inline-content shape, the `href` allow-list
/// rejecting javascript:/data:, block count/depth limits — docs/26 §3.4) is
/// a substantial, security-relevant subsystem of its own and is a
/// disclosed gap in this phase, not a silent one: DM-08's "no
/// dangerouslySetInnerHTML" still holds regardless, since nothing here ever
/// treats body content as markup.
const KNOWN_BLOCK_TYPES = new Set(["paragraph", "heading", "image", "quote", "list", "divider"]);

interface InlineSpan {
  text?: unknown;
}

interface Block {
  type?: unknown;
  content?: unknown;
  items?: unknown;
}

export function assertValidBodyShape(body: unknown): asserts body is Block[] {
  if (!Array.isArray(body)) {
    throw new BadRequestError("body must be an array of blocks");
  }
  for (const block of body as Block[]) {
    if (typeof block !== "object" || block === null || typeof block.type !== "string") {
      throw new BadRequestError("Every body block needs a string \"type\"");
    }
    if (!KNOWN_BLOCK_TYPES.has(block.type)) {
      throw new BadRequestError(`Unknown body block type: "${block.type}"`);
    }
  }
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
