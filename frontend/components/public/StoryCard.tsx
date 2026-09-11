import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import { PublicArticleSummary, PublicSummaryImage } from "@/lib/api/public-types";
import { formatPublicDate, formatRelative } from "@/lib/format-date";

/// docs/19 §2.5 extended per brief §5/§6 — one card, five visual weights,
/// so an editorial grid can mix image-led, typography-led and overlay
/// stories without five components. The whole card is one link and the
/// headline is its accessible name (§2.5 "Rules").
///
/// `morph` names the image for a shared-element route transition into
/// the article hero (brief §19). Only pass it where a story can appear
/// once on the page — a view-transition name must be unique.
export type StoryCardVariant = "feature" | "standard" | "compact" | "text" | "overlay";

export function StoryCard({
  article,
  variant = "standard",
  morph = false,
  showSummary,
  preload = false,
  className = "",
}: {
  article: PublicArticleSummary;
  variant?: StoryCardVariant;
  morph?: boolean;
  showSummary?: boolean;
  preload?: boolean;
  className?: string;
}) {
  const href = `/${article.category.slug}/${article.slug}`;

  if (variant === "overlay") {
    return (
      <Link
        href={href}
        className={`group relative block aspect-4/5 overflow-hidden bg-ink no-underline shadow-depth-2 focus-visible:outline-paper sm:aspect-16/10 md:aspect-auto md:min-h-[480px] ${className}`}
      >
        <div className="absolute inset-0">
          <StoryImage
            image={article.featuredImage}
            slug={article.slug}
            morph={morph}
            preload={preload}
            sizes="(min-width: 1200px) 840px, (min-width: 900px) 66vw, 100vw"
            className="tilt-layer"
          />
          <div className="surface-scrim-strong absolute inset-0" aria-hidden="true" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-space-5 md:p-space-6">
          <Kicker name={article.category.name} tone="light" />
          <h3 className="mt-space-2 text-headline-lg text-paper">
            <span className="link-underline-2 link-underline">{article.headline}</span>
          </h3>
          <p className="mt-space-2 hidden max-w-[60ch] text-body text-paper/85 md:line-clamp-2">
            {article.summary}
          </p>
          <Meta article={article} tone="light" />
        </div>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link href={href} className={`group flex items-start gap-x-space-4 no-underline ${className}`}>
        <div className="min-w-0 flex-1">
          <Kicker name={article.category.name} />
          <h3 className="mt-space-1 text-headline-sm text-ink">
            <span className="link-underline">{article.headline}</span>
          </h3>
          <Meta article={article} compact />
        </div>
        {article.featuredImage ? (
          <div className="relative aspect-square w-20 shrink-0 overflow-hidden bg-surface-sunken sm:w-24">
            <StoryImage
              image={article.featuredImage}
              slug={article.slug}
              morph={morph}
              sizes="96px"
            />
          </div>
        ) : null}
      </Link>
    );
  }

  if (variant === "text") {
    return (
      <Link href={href} className={`group block no-underline ${className}`}>
        <Kicker name={article.category.name} />
        <h3 className="mt-space-2 text-heading-3 text-ink">
          <span className="link-underline">{article.headline}</span>
        </h3>
        {showSummary !== false ? (
          <p className="mt-space-2 line-clamp-3 text-body text-ink-secondary">{article.summary}</p>
        ) : null}
        <Meta article={article} />
      </Link>
    );
  }

  const isFeature = variant === "feature";
  return (
    <Link href={href} className={`group block no-underline ${className}`}>
      <div
        className={`relative overflow-hidden bg-surface-sunken ${isFeature ? "aspect-16/10" : "aspect-3/2"}`}
      >
        <StoryImage
          image={article.featuredImage}
          slug={article.slug}
          morph={morph}
          preload={preload}
          sizes={
            isFeature
              ? "(min-width: 1200px) 840px, (min-width: 900px) 66vw, 100vw"
              : "(min-width: 1200px) 400px, (min-width: 900px) 33vw, (min-width: 600px) 50vw, 100vw"
          }
        />
      </div>
      <div className="pt-space-3">
        <Kicker name={article.category.name} tone={isFeature ? "brand" : "muted"} />
        <h3 className={`mt-space-2 text-ink ${isFeature ? "text-headline-lg" : "text-heading-3"}`}>
          <span className="link-underline">{article.headline}</span>
        </h3>
        {showSummary ?? isFeature ? (
          <p
            className={`mt-space-2 text-ink-secondary ${isFeature ? "text-standfirst line-clamp-3" : "line-clamp-2 text-body"}`}
          >
            {article.summary}
          </p>
        ) : null}
        <Meta article={article} />
      </div>
    </Link>
  );
}

/// The image slot always reserves its space (PRF-08) — an article with no
/// featured image still holds the aspect box, in the sunken surface.
export function StoryImage({
  image,
  slug,
  morph,
  preload = false,
  sizes,
  className = "",
}: {
  image: PublicSummaryImage | null;
  slug: string;
  morph: boolean;
  preload?: boolean;
  sizes: string;
  className?: string;
}) {
  if (!image) return null;
  const img = (
    <Image
      src={image.url}
      alt={image.alt}
      fill
      sizes={sizes}
      preload={preload}
      className={`img-zoom object-cover ${className}`}
    />
  );
  if (!morph) return img;
  return (
    <ViewTransition name={`story-${slug}`} share="morph" default="none">
      <div className="absolute inset-0">{img}</div>
    </ViewTransition>
  );
}

export function Kicker({
  name,
  tone = "muted",
}: {
  name: string;
  tone?: "muted" | "brand" | "light" | "gold";
}) {
  const color =
    tone === "brand"
      ? "text-brand"
      : tone === "light"
        ? "text-paper/80"
        : tone === "gold"
          ? "text-gold-deep"
          : "text-ink-muted";
  return <span className={`text-label ${color}`}>{name}</span>;
}

export function Meta({
  article,
  tone = "dark",
  compact = false,
}: {
  article: Pick<PublicArticleSummary, "byline" | "publishedAt">;
  tone?: "dark" | "light";
  compact?: boolean;
}) {
  const color = tone === "light" ? "text-paper/70" : "text-ink-muted";
  return (
    <p className={`${compact ? "mt-space-1" : "mt-space-3"} text-meta ${color}`}>
      {compact ? null : <>By {article.byline} · </>}
      <time dateTime={article.publishedAt}>{formatCardTime(article.publishedAt)}</time>
    </p>
  );
}

/// Within the last day, "3h ago" reads as news; older than that, the date.
export function formatCardTime(iso: string): string {
  const ageMs = Date.now() - new Date(iso).getTime();
  return ageMs < 24 * 60 * 60 * 1000 ? formatRelative(iso) : formatPublicDate(iso);
}
