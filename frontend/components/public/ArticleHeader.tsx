import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import { ChevronRight } from "lucide-react";
import { PublicArticleView } from "@/lib/api/public-types";
import { formatBylineTime } from "@/lib/format-date";
import { ShareButton } from "./ShareButton";
import { absoluteUrl } from "@/lib/site-url";
import { Avatar } from "./Avatar";
import { TextReveal } from "@/components/motion/TextReveal";

/// 1d — breadcrumb (`India › story`), headline, standfirst, the byline
/// rule with an avatar disc, then the featured image with caption and
/// credit. Priority order is fixed: headline → picture → story →
/// everything else. A short red rule at the top marks the article page
/// the way the wireframe does.
export function ArticleHeader({
  article,
  readingMinutes,
}: {
  article: PublicArticleView;
  readingMinutes: number;
}) {
  const url = absoluteUrl(`/${article.category.slug}/${article.slug}`);
  const byline = article.byline.trim();

  return (
    <header>
      <div className="mx-auto max-w-(--width-measure-wide) px-space-4 md:px-space-6">
        <div className="h-[2px] w-[38%] bg-brand" aria-hidden="true" />
        <nav aria-label="Breadcrumb" className="mt-space-5 flex flex-wrap items-center gap-x-space-1 text-caption text-ink-muted">
          <Link href="/" className="link-underline hover:text-ink">
            Home
          </Link>
          <ChevronRight size={12} className="text-brand" aria-hidden="true" />
          <Link href={`/${article.category.slug}`} className="link-underline text-ink hover:text-brand">
            {article.category.name}
          </Link>
          <ChevronRight size={12} className="text-brand" aria-hidden="true" />
          <span className="truncate text-ink-muted">story</span>
        </nav>
        <TextReveal as="h1" text={article.headline} className="article-title mt-space-4 text-ink" stagger={0.035} />
        <p className="mt-space-4 max-w-[64ch] text-standfirst text-ink-secondary">{article.summary}</p>

        <div className="mt-space-5 flex flex-wrap items-center gap-x-space-3 gap-y-space-3 border-y border-rule py-space-3 text-caption text-ink-muted">
          <Avatar name={byline || "A"} />
          <span className="min-w-0">
            {byline ? <span className="font-medium text-ink">By {byline}</span> : null}
            {byline ? <span aria-hidden="true"> · </span> : null}
            <time dateTime={article.publishedAt}>{formatBylineTime(article.publishedAt)}</time>
            <span aria-hidden="true"> · </span>
            <span>{readingMinutes} min read</span>
          </span>
          <span className="ml-auto">
            <ShareButton title={article.headline} url={url} />
          </span>
        </div>
      </div>

      {article.featuredImage ? (
        <figure className="mx-auto mt-space-5 max-w-(--width-measure-wide) px-space-4 md:mt-space-6 md:px-space-6">
          <ViewTransition name={`story-${article.slug}`} share="morph" default="none">
            <div className="relative aspect-3/2 overflow-hidden bg-surface-deep">
              <Image
                src={article.featuredImage.url}
                alt={article.featuredImage.alt}
                fill
                preload
                sizes="(min-width: 900px) 820px, 100vw"
                className="object-cover"
              />
            </div>
          </ViewTransition>
          {article.featuredImage.caption || article.featuredImage.credit ? (
            <figcaption className="mt-space-2 text-caption text-ink-muted">
              {article.featuredImage.caption}
              {article.featuredImage.caption && article.featuredImage.credit ? " · " : ""}
              {article.featuredImage.credit ? <span className="text-ink-faint">{article.featuredImage.credit}</span> : null}
            </figcaption>
          ) : null}
        </figure>
      ) : null}
    </header>
  );
}
