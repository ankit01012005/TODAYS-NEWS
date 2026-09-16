import Image from "next/image";
import type { ReactNode } from "react";

/// Renders the six V1 block types — paragraph, heading, image, quote,
/// list, divider — exactly what body.util.ts validates (1d). Every block
/// is a typed React component; this file never uses
/// dangerouslySetInnerHTML anywhere. Malformed/unknown input from the API
/// is skipped rather than thrown on: the backend already validates shape
/// on write; this is a renderer, not a second validator, but it must not
/// crash the page on a shape it doesn't expect.

interface InlineSpan {
  text: string;
  marks?: ("strong" | "em" | { type: "link"; href: string })[];
}

interface ParagraphBlock {
  type: "paragraph";
  content: InlineSpan[];
}
interface HeadingBlock {
  type: "heading";
  level: 2 | 3;
  content: InlineSpan[];
}
interface ImageBlock {
  type: "image";
  mediaId: string;
  url: string;
  alt: string;
  credit?: string;
  caption?: string;
}
interface QuoteBlock {
  type: "quote";
  content: InlineSpan[];
  attribution?: string;
}
interface ListBlock {
  type: "list";
  style: "ordered" | "unordered";
  items: InlineSpan[][];
}
interface DividerBlock {
  type: "divider";
}

type Block = ParagraphBlock | HeadingBlock | ImageBlock | QuoteBlock | ListBlock | DividerBlock;

function isInlineSpanArray(value: unknown): value is InlineSpan[] {
  return Array.isArray(value) && value.every((v) => typeof v === "object" && v !== null && "text" in v);
}

function asBlock(raw: unknown): Block | null {
  if (typeof raw !== "object" || raw === null || !("type" in raw)) return null;
  const block = raw as Record<string, unknown>;
  switch (block.type) {
    case "paragraph":
      return isInlineSpanArray(block.content) ? { type: "paragraph", content: block.content } : null;
    case "heading":
      return isInlineSpanArray(block.content) && (block.level === 2 || block.level === 3)
        ? { type: "heading", level: block.level, content: block.content }
        : null;
    case "image":
      return typeof block.url === "string" && typeof block.alt === "string"
        ? {
            type: "image",
            mediaId: typeof block.mediaId === "string" ? block.mediaId : "",
            url: block.url,
            alt: block.alt,
            credit: typeof block.credit === "string" ? block.credit : undefined,
            caption: typeof block.caption === "string" ? block.caption : undefined,
          }
        : null;
    case "quote":
      return isInlineSpanArray(block.content)
        ? {
            type: "quote",
            content: block.content,
            attribution: typeof block.attribution === "string" ? block.attribution : undefined,
          }
        : null;
    case "list":
      return Array.isArray(block.items) && block.items.every(isInlineSpanArray)
        ? {
            type: "list",
            style: block.style === "ordered" ? "ordered" : "unordered",
            items: block.items as InlineSpan[][],
          }
        : null;
    case "divider":
      return { type: "divider" };
    default:
      return null;
  }
}

function Inline({ spans }: { spans: InlineSpan[] }) {
  return (
    <>
      {spans.map((span, i) => {
        let node: ReactNode = span.text;
        for (const mark of span.marks ?? []) {
          if (mark === "strong") node = <strong className="font-semibold">{node}</strong>;
          else if (mark === "em") node = <em>{node}</em>;
          else if (typeof mark === "object" && mark.type === "link") {
            node = (
              <a
                href={mark.href}
                className="text-ink underline decoration-brand/60 decoration-1 underline-offset-4 transition-colors hover:decoration-brand"
              >
                {node}
              </a>
            );
          }
        }
        return <span key={i}>{node}</span>;
      })}
    </>
  );
}

export function ArticleBody({ body, className = "" }: { body: unknown; className?: string }) {
  if (!Array.isArray(body)) return null;
  const blocks = body.map(asBlock).filter((b): b is Block => b !== null);

  return (
    <div className={`public-article-body text-body-lg text-ink ${className}`}>
      {blocks.map((block, i) => (
        <BlockView key={i} block={block} />
      ))}
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="mt-space-5 first:mt-0">
          <Inline spans={block.content} />
        </p>
      );
    case "heading": {
      const className = "mt-space-7 mb-space-3 text-ink";
      return block.level === 2 ? (
        <h2 className={`${className} text-heading-2`}>
          <Inline spans={block.content} />
        </h2>
      ) : (
        <h3 className={`${className} text-heading-3`}>
          <Inline spans={block.content} />
        </h3>
      );
    }
    case "image":
      return (
        <figure className="mt-space-7">
          <div className="relative aspect-3/2 overflow-hidden bg-surface-deep">
            <Image
              src={block.url}
              alt={block.alt}
              fill
              sizes="(min-width: 900px) 660px, 100vw"
              className="object-cover"
            />
          </div>
          {block.caption || block.credit ? (
            <figcaption className="mt-space-2 text-caption text-ink-muted">
              {block.caption}
              {block.caption && block.credit ? " · " : ""}
              {block.credit ? <span className="text-ink-faint">{block.credit}</span> : null}
            </figcaption>
          ) : null}
        </figure>
      );
    case "quote":
      return (
        <blockquote className="my-space-7 border-l-[3px] border-brand py-space-2 pl-space-5">
          <p className="text-heading-3 font-medium text-ink">
            <Inline spans={block.content} />
          </p>
          {block.attribution ? <footer className="mt-space-3 text-caption text-ink-muted">— {block.attribution}</footer> : null}
        </blockquote>
      );
    case "list": {
      const items = block.items.map((spans, i) => (
        <li key={i} className="pl-space-1">
          <Inline spans={spans} />
        </li>
      ));
      return block.style === "ordered" ? (
        <ol className="mt-space-5 list-decimal space-y-space-2 pl-space-6 marker:font-semibold marker:text-brand">{items}</ol>
      ) : (
        <ul className="mt-space-5 list-[square] space-y-space-2 pl-space-6 marker:text-ink">{items}</ul>
      );
    }
    case "divider":
      return (
        <div className="my-space-7 flex items-center gap-x-space-3" aria-hidden="true">
          <span className="h-px flex-1 bg-rule" />
          <span className="h-[6px] w-[6px] bg-brand" />
          <span className="h-px flex-1 bg-rule" />
        </div>
      );
  }
}
