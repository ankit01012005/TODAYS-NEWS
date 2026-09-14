import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import { ArrowRight } from "lucide-react";
import { PublicArticleSummary, PublicSummaryImage } from "@/lib/api/public-types";
import { formatPublicDate, formatRelative } from "@/lib/format-date";
import { ImageReveal } from "@/components/motion/ImageReveal";
import { TextReveal } from "@/components/motion/TextReveal";

/// One card, five visual weights, so the front page (1a), the section
/// list (1e), search (2f) and "More in" (1d) can share one component:
///
///   lead      — 16:9 picture, red section pill, display headline, summary
///   standard  — 4:3 picture, headline, optional summary
///   row       — 150×100 thumbnail left, headline + summary right (1e)
///   compact   — small thumbnail right, headline only (1g mobile rows)
///   text      — typography only
///
/// The whole card is one link and the headline is its accessible name.
/// `morph` names the image for the shared-element route transition into
/// the article hero — pass it only where a story appears once on a page.
export type StoryCardVariant = "lead" | "standard" | "row" | "compact" | "text";

export function StoryCard({
  article,
  variant = "standard",
  morph = false,
  showSummary,
  preload = false,
  headingLevel = 3,
  className = "",
}: {
  article: PublicArticleSummary;
  variant?: StoryCardVariant;
  morph?: boolean;
  showSummary?: boolean;
  preload?: boolean;
  headingLevel?: 1 | 2 | 3;
  className?: string;
}) {
  const href = `/${article.category.slug}/${article.slug}`;
  const Heading = headingLevel === 1 ? "h1" : headingLevel === 2 ? "h2" : "h3";

  if (variant === "lead") {
    return (
      <Link href={href} className={`group block no-underline ${className}`}>
        <ImageReveal className="relative aspect-16/9 overflow-hidden bg-surface-deep">
          <div className="relative h-full w-full">
            <StoryImage
              image={article.featuredImage}
              slug={article.slug}
              morph={morph}
              preload={preload}
              parallax
              sizes="(min-width: 1080px) 720px, (min-width: 900px) 66vw, 100vw"
            />
            <span className="read-tag">
              Read <ArrowRight size={11} aria-hidden="true" />
            </span>
          </div>
        </ImageReveal>
        <div className="mt-space-4 flex flex-wrap items-center gap-x-space-3 gap-y-space-2">
          <Kicker name={article.category.name} tone="brand" />
          <Meta article={article} inline />
        </div>
        <Heading className="mt-space-3 text-display-1 text-ink">
          <TextReveal text={article.headline} as="span" className="link-underline link-underline-2" delay={0.15} />
        </Heading>
        {showSummary !== false ? (
          <p className="mt-space-3 max-w-[64ch] text-standfirst text-ink-secondary">{article.summary}</p>
        ) : null}
        <p className="mt-space-3 text-caption text-ink-muted">By {article.byline.trim() || "the newsroom"}</p>
      </Link>
    );
  }

  if (variant === "row") {
    return (
      <Link href={href} className={`group flex items-start gap-x-space-4 no-underline ${className}`}>
        <div className="rule-grow relative aspect-3/2 w-[112px] shrink-0 overflow-hidden bg-surface-deep sm:w-[150px]">
          <StoryImage
            image={article.featuredImage}
            slug={article.slug}
            morph={morph}
            sizes="(min-width: 600px) 150px, 112px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <Heading className="text-heading-3 text-ink">
            <span className="link-underline">{article.headline}</span>
          </Heading>
          {showSummary !== false ? (
            <p className="mt-space-2 hidden line-clamp-2 text-body-sm text-ink-secondary sm:block">{article.summary}</p>
          ) : null}
          <Meta article={article} className="mt-space-2" />
        </div>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link href={href} className={`group flex items-start gap-x-space-3 no-underline ${className}`}>
        <div className="relative aspect-4/3 w-[78px] shrink-0 overflow-hidden bg-surface-deep">
          <StoryImage image={article.featuredImage} slug={article.slug} morph={morph} sizes="78px" />
        </div>
        <div className="min-w-0 flex-1">
          <Heading className="text-headline-sm text-ink">
            <span className="link-underline">{article.headline}</span>
          </Heading>
          <Meta article={article} className="mt-space-1" compact />
        </div>
      </Link>
    );
  }

  if (variant === "text") {
    return (
      <Link href={href} className={`group block no-underline ${className}`}>
        <Kicker name={article.category.name} tone="muted" />
        <Heading className="mt-space-2 text-heading-3 text-ink">
          <span className="link-underline">{article.headline}</span>
        </Heading>
        {showSummary !== false ? (
          <p className="mt-space-2 line-clamp-3 text-body-sm text-ink-secondary">{article.summary}</p>
        ) : null}
        <Meta article={article} className="mt-space-2" />
      </Link>
    );
  }

  return (
    <Link href={href} className={`group block no-underline ${className}`}>
      <div className="rule-grow relative aspect-4/3 overflow-hidden bg-surface-deep">
        <StoryImage
          image={article.featuredImage}
          slug={article.slug}
          morph={morph}
          preload={preload}
          sizes="(min-width: 1080px) 330px, (min-width: 900px) 33vw, (min-width: 600px) 50vw, 100vw"
        />
        <span className="read-tag">
          Read <ArrowRight size={11} aria-hidden="true" />
        </span>
      </div>
      <div className="pt-space-3">
        <Heading className="text-heading-3 text-ink">
          <span className="link-underline">{article.headline}</span>
        </Heading>
        {showSummary ? <p className="mt-space-2 line-clamp-2 text-body-sm text-ink-secondary">{article.summary}</p> : null}
        <Meta article={article} className="mt-space-2" />
      </div>
    </Link>
  );
}

/// The image slot always reserves its space — a story with no featured
/// image still holds the aspect box on the sunken surface, marked with
/// the section's initial so it never reads as broken.
export function StoryImage({
  image,
  slug,
  morph,
  preload = false,
  parallax = false,
  sizes,
  className = "",
}: {
  image: PublicSummaryImage | null;
  slug: string;
  morph: boolean;
  preload?: boolean;
  /// Scroll-driven drift inside the frame (the lead picture) instead of
  /// the hover zoom — the two both write `transform`, so it is one or
  /// the other.
  parallax?: boolean;
  sizes: string;
  className?: string;
}) {
  if (!image) {
    return (
      <div className="absolute inset-0 grid place-items-center" aria-hidden="true">
        <span className="text-wordmark text-[22px] text-ink/15">ANVAY</span>
      </div>
    );
  }
  const img = (
    <Image
      src={image.url}
      alt={image.alt}
      fill
      sizes={sizes}
      preload={preload}
      className={`${parallax ? "parallax-img" : "img-zoom"} object-cover ${className}`}
    />
  );
  if (!morph) return img;
  return (
    <ViewTransition name={`story-${slug}`} share="morph" default="none">
      <div className="absolute inset-0">{img}</div>
    </ViewTransition>
  );
}

/// The section pill — red outline for the lead (1a), muted otherwise.
export function Kicker({
  name,
  tone = "muted",
}: {
  name: string;
  tone?: "muted" | "brand" | "gold" | "bone";
}) {
  const color =
    tone === "brand"
      ? "border-brand text-brand"
      : tone === "gold"
        ? "border-gold-deep text-gold-deep"
        : tone === "bone"
          ? "border-bone/40 text-bone"
          : "border-rule-strong text-ink-secondary";
  return (
    <span className={`inline-flex h-6 items-center rounded-pill border px-space-2 text-label ${color}`}>{name}</span>
  );
}

export function Meta({
  article,
  compact = false,
  inline = false,
  className = "",
}: {
  article: Pick<PublicArticleSummary, "byline" | "publishedAt">;
  compact?: boolean;
  inline?: boolean;
  className?: string;
}) {
  const byline = article.byline.trim();
  return (
    <p className={`text-caption text-ink-muted ${className}`}>
      {!compact && !inline && byline ? <>{byline} · </> : null}
      <time dateTime={article.publishedAt}>{formatCardTime(article.publishedAt)}</time>
    </p>
  );
}

/// Within the last day, "3h ago" reads as news; older than that, the date.
export function formatCardTime(iso: string): string {
  const ageMs = Date.now() - new Date(iso).getTime();
  return ageMs < 24 * 60 * 60 * 1000 ? formatRelative(iso) : formatPublicDate(iso);
}
