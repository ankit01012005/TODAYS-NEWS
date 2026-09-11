import Link from "next/link";
import { PublicArticleSummary } from "@/lib/api/public-types";
import { TiltCard } from "@/components/motion/TiltCard";
import { Kicker, Meta, StoryCard, StoryImage } from "./StoryCard";

/// Brief §4 — the lead story dominates without taking the page hostage:
/// an oversized image (with a few degrees of cursor tilt) and a display
/// headline across eight columns, then two or three secondary stories of
/// decreasing weight down the right: one with a picture, the rest as
/// typography, separated by rules. On xs everything stacks.
export function HeroStory({
  lead,
  secondary,
}: {
  lead: PublicArticleSummary;
  secondary: PublicArticleSummary[];
}) {
  const [first, ...rest] = secondary;

  return (
    <section
      aria-labelledby="hero-heading"
      className="grid grid-cols-1 gap-y-space-6 md:grid-cols-12 md:gap-x-space-6"
    >
      <div className="md:col-span-8">
        <Link href={`/${lead.category.slug}/${lead.slug}`} className="group block no-underline">
          <TiltCard>
            <div className="relative aspect-16/10 overflow-hidden bg-surface-sunken shadow-depth-2">
              <StoryImage
                image={lead.featuredImage}
                slug={lead.slug}
                morph
                preload
                sizes="(min-width: 1280px) 840px, (min-width: 900px) 66vw, 100vw"
                className="tilt-layer"
              />
            </div>
          </TiltCard>
          <div className="pt-space-4 md:pt-space-5">
            <Kicker name={lead.category.name} tone="brand" />
            <h1 id="hero-heading" className="mt-space-2 text-display-0 text-ink">
              <span className="link-underline-2 link-underline">{lead.headline}</span>
            </h1>
            <p className="mt-space-4 max-w-[62ch] text-standfirst text-ink-secondary">{lead.summary}</p>
            <Meta article={lead} />
          </div>
        </Link>
      </div>

      {secondary.length > 0 ? (
        <aside
          aria-label="More top stories"
          className="md:col-span-4 md:border-l md:border-rule md:pl-space-6"
        >
          <div className="divide-y divide-rule">
            {first ? <StoryCard article={first} variant="standard" morph className="pb-space-5" /> : null}
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
    </section>
  );
}
