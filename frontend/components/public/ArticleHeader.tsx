import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import { PublicArticleView } from "@/lib/api/public-types";
import { formatPublicDateTime } from "@/lib/format-date";
import { ShareButton } from "./ShareButton";

/// Brief §12 — the order docs/08 §4 fixes (headline → picture → story →
/// everything else), composed like a magazine opener: a centred kicker,
/// display headline and dek in the wide measure, the byline row with
/// reading time and share, then the evidence-bearing hero image without
/// scroll effects that could distract from the story.
export function ArticleHeader({
  article,
  readingMinutes,
}: {
  article: PublicArticleView;
  readingMinutes: number;
}) {
  const path = `/${article.category.slug}/${article.slug}`;
  const byline = article.byline.trim();

  return (
    <header>
      <div className="mx-auto max-w-(--width-measure-wide) px-space-4 pt-space-7 md:px-space-5 md:pt-space-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-space-2 text-label text-ink-muted">
          <Link href="/" className="link-underline hover:text-ink">Front page</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/${article.category.slug}`} className="link-underline text-brand">
            {article.category.name}
          </Link>
        </nav>
        <h1 className="article-title mt-space-4 text-ink">{article.headline}</h1>
        <p className="mt-space-5 max-w-[62ch] text-standfirst text-ink-secondary">{article.summary}</p>

        <div className="mt-space-6 flex flex-col items-start gap-y-space-3 border-y border-rule py-space-3 text-meta text-ink-muted sm:flex-row sm:items-center sm:gap-x-space-4">
          {byline ? <span className="text-ink">By {byline}</span> : null}
          {byline ? <span className="hidden sm:inline" aria-hidden="true">·</span> : null}
          <time dateTime={article.publishedAt}>{formatPublicDateTime(article.publishedAt)}</time>
          <span className="hidden sm:inline" aria-hidden="true">
            ·
          </span>
          <span>{readingMinutes} min read</span>
          <span className="sm:ml-space-2">
            <ShareButton title={article.headline} path={path} />
          </span>
        </div>
      </div>

      {article.featuredImage ? (
        <figure className="mx-auto mt-space-6 max-w-[1120px] px-space-4 md:mt-space-7 md:px-space-5">
          <ViewTransition name={`story-${article.slug}`} share="morph" default="none">
            <div className="relative aspect-16/9 overflow-hidden bg-surface-sunken">
              <Image
                src={article.featuredImage.url}
                alt={article.featuredImage.alt}
                fill
                preload
                sizes="(min-width: 1200px) 1120px, 100vw"
                className="object-cover"
              />
            </div>
          </ViewTransition>
          {article.featuredImage.caption || article.featuredImage.credit ? (
            <figcaption className="mt-space-2 text-right text-caption text-ink-muted">
              {article.featuredImage.caption}
              {article.featuredImage.caption && article.featuredImage.credit ? " — " : ""}
              {article.featuredImage.credit}
            </figcaption>
          ) : null}
        </figure>
      ) : null}
    </header>
  );
}
