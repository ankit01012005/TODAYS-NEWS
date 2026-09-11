import { PublicArticleSummary } from "@/lib/api/public-types";
import { StoryCard } from "./StoryCard";
import { SectionHeading } from "./SectionHeading";

/// Brief §10 — the one section that uses the champagne accent, so
/// curation reads differently from the news flow: a warm band, a gold
/// rule, one large story and three compact ones. Selection is the newest
/// story from each desk not already shown above — a deterministic
/// editorial rule, since V1 has no hand-picked "featured" flag.
export function EditorsPicks({ stories }: { stories: PublicArticleSummary[] }) {
  const [featured, ...rest] = stories;
  if (!featured || rest.length === 0) return null;

  return (
    <section aria-labelledby="picks-heading" className="border-y border-gold/40 bg-gold-wash">
      <div className="mx-auto max-w-(--width-page-max) px-space-4 py-space-7 md:px-space-5 md:py-space-8">
        <SectionHeading id="picks-heading" title="Editor’s picks" tone="gold" eyebrow="From every desk" />
        <div className="mt-space-6 grid grid-cols-1 gap-y-space-6 md:grid-cols-12 md:gap-x-space-7">
          <StoryCard article={featured} variant="feature" morph className="md:col-span-7" />
          <div className="divide-y divide-gold/40 md:col-span-5">
            {rest.map((article) => (
              <StoryCard
                key={article.slug}
                article={article}
                variant="compact"
                morph
                className="py-space-4 first:pt-0 last:pb-0"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
