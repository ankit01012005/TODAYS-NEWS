import Link from "next/link";
import { PublicArticleSummary } from "@/lib/api/public-types";
import { TiltCard } from "@/components/motion/TiltCard";
import { Kicker, Meta, StoryCard, StoryImage } from "./StoryCard";
import { JustIn } from "./JustIn";

/// Brief §4 — the lead story dominates without taking the page hostage:
/// an oversized image (with a few degrees of cursor tilt) and a display
/// headline across eight columns, then two or three secondary stories of
/// decreasing weight down the right: one with a picture, the rest as
/// typography, separated by rules. On xs everything stacks.
export function HeroStory({
  lead,
  secondary,
  latest,
}: {
  lead: PublicArticleSummary;
  secondary: PublicArticleSummary[];
  latest: PublicArticleSummary[];
}) {
  const [first, ...rest] = secondary;

  return (
    <section aria-labelledby="hero-heading">
      <div className="mb-space-4 flex items-center gap-x-space-3 border-b border-rule pb-space-2">
        <span className="h-2 w-2 bg-brand" aria-hidden="true" />
        <p className="text-label text-ink-muted">Front page</p>
      </div>
      <div className="grid grid-cols-1 gap-y-space-7 md:grid-cols-12 md:gap-x-space-6">
      <div className="md:col-span-6">
        <Link href={`/${lead.category.slug}/${lead.slug}`} className="group block no-underline">
          <div>
            <Kicker name={lead.category.name} tone="brand" />
            <h1 id="hero-heading" className="mt-space-2 text-display-0 text-ink">
              <span className="link-underline-2 link-underline">{lead.headline}</span>
            </h1>
            <p className="mt-space-3 max-w-[58ch] text-standfirst text-ink-secondary">{lead.summary}</p>
            <Meta article={lead} />
          </div>
          <TiltCard className="mt-space-5" maxDegrees={1.5} shift={4}>
            <div className="lead-media-shell relative aspect-16/10 bg-surface-sunken">
              <StoryImage
                image={lead.featuredImage}
                slug={lead.slug}
                morph
                preload
                sizes="(min-width: 1280px) 840px, (min-width: 900px) 66vw, 100vw"
                className="tilt-layer object-cover"
              />
            </div>
          </TiltCard>
        </Link>
      </div>

      {secondary.length > 0 ? (
        <aside
          aria-label="More front-page stories"
          className="md:col-span-3 md:border-l md:border-rule md:pl-space-5"
        >
          <div className="divide-y divide-rule">
            {first ? <StoryCard article={first} variant="standard" className="pb-space-5" /> : null}
            {rest.map((article) => (
              <StoryCard
                key={article.slug}
                article={article}
                variant="text"
                showSummary={false}
                className="py-space-5"
              />
            ))}
          </div>
        </aside>
      ) : null}
      {latest.length > 0 ? (
        <aside className="md:col-span-3 md:border-l md:border-rule md:pl-space-5">
          <JustIn articles={latest} />
        </aside>
      ) : null}
      </div>
    </section>
  );
}
