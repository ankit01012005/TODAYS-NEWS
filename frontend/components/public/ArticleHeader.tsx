import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import { PublicArticleView } from "@/lib/api/public-types";
import { formatPublicDateTime } from "@/lib/format-date";
import { ShareButton } from "./ShareButton";

/// Brief §12 — the order docs/08 §4 fixes (headline → picture → story →
/// everything else), composed like a magazine opener: a centred kicker,
/// display headline and dek in the wide measure, the byline row with
/// reading time and share, then the cinematic hero image wider than the
/// text with a slow scroll parallax (CSS scroll timeline; nothing on
/// mobile beyond the image itself).
export function ArticleHeader({
  article,
  readingMinutes,
}: {
  article: PublicArticleView;
  readingMinutes: number;
}) {
  const path = `/${article.category.slug}/${article.slug}`;

  return (
    <header>
      <div className="mx-auto max-w-(--width-measure-wide) px-space-4 pt-space-7 text-center md:px-space-5 md:pt-space-8">
        <Link
          href={`/${article.category.slug}`}
          className="link-underline inline-block text-label text-brand"
        >
          {article.category.name}
        </Link>
        <h1 className="mt-space-4 text-display-1 text-ink md:text-[60px] md:leading-[1.04]">{article.headline}</h1>
        <p className="mx-auto mt-space-5 max-w-[58ch] text-standfirst text-ink-secondary">{article.summary}</p>

        <div className="mt-space-6 flex flex-col items-center justify-center gap-y-space-3 border-y border-rule py-space-3 text-meta text-ink-muted sm:flex-row sm:gap-x-space-4">
          <span className="text-ink">By {article.byline}</span>
          <span className="hidden sm:inline" aria-hidden="true">
            ·
          </span>
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
            <div className="relative aspect-16/9 overflow-hidden bg-surface-sunken shadow-depth-2">
              <Image
                src={article.featuredImage.url}
                alt={article.featuredImage.alt}
                fill
                preload
                sizes="(min-width: 1200px) 1120px, 100vw"
                className="parallax-hero object-cover"
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
