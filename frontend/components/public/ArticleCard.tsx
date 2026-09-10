import Image from "next/image";
import Link from "next/link";
import { PublicArticleSummary } from "@/lib/api/public-types";

/// docs/19 §2.5. `variant` chooses which composition renders; the whole
/// card is one link target and the headline is the accessible name (§2.5
/// "Rules") — the outer element carries the href, everything inside is
/// decorative/inert to a screen reader except that one link.
export function ArticleCard({
  article,
  variant,
}: {
  article: PublicArticleSummary;
  variant: "lead" | "standard";
}) {
  const href = `/${article.category.slug}/${article.slug}`;
  const formattedDate = formatDate(article.publishedAt);

  return (
    <Link href={href} className="group block no-underline">
      {/* PRF-08 — every image slot reserves its space before load, via the
          fixed aspect-ratio wrapper, whether or not an image exists. */}
      <div
        className={`overflow-hidden bg-surface-sunken ${variant === "lead" ? "aspect-video" : "aspect-3/2"}`}
      >
        {article.featuredImage ? (
          <Image
            src={article.featuredImage.url}
            alt={article.featuredImage.alt}
            width={variant === "lead" ? 800 : 600}
            height={variant === "lead" ? 450 : 400}
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        ) : null}
      </div>
      <div className="pt-space-3">
        <p className="text-label text-ink-muted">{article.category.name}</p>
        <h3
          className={`mt-space-2 text-ink group-hover:underline ${
            variant === "lead" ? "text-heading-2" : "text-heading-3"
          }`}
        >
          {article.headline}
        </h3>
        {variant === "lead" ? (
          <p className="mt-space-2 text-standfirst text-ink-secondary">{article.summary}</p>
        ) : null}
        <p className="mt-space-3 text-meta text-ink-muted">
          By {article.byline} · {formattedDate}
        </p>
      </div>
    </Link>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
