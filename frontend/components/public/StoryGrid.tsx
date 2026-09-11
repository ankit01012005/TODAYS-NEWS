import { PublicArticleSummary } from "@/lib/api/public-types";
import { StoryCard } from "./StoryCard";
import { SectionHeading } from "./SectionHeading";

/// A compact briefing with mixed image, text and thumbnail treatments.
/// It follows publication order and avoids a ranking claim.
export function StoryGrid({
  stories,
}: {
  stories: PublicArticleSummary[];
}) {
  const [feature, second, third, fourth] = stories;
  if (!feature) return null;

  return (
    <section aria-labelledby="briefing-heading">
      <SectionHeading id="briefing-heading" title="The daily briefing" eyebrow="Four stories to know" />
      <div className="daily-briefing mt-space-5">
        <StoryCard article={feature} variant="standard" morph className="daily-briefing-feature reveal" />
        {second ? <StoryCard article={second} variant="text" className="daily-briefing-text reveal" /> : null}
        {third ? <StoryCard article={third} variant="compact" className="daily-briefing-compact reveal" /> : null}
        {fourth ? <StoryCard article={fourth} variant="standard" className="daily-briefing-last reveal" /> : null}
      </div>
    </section>
  );
}
