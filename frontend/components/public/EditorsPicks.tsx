import { PublicArticleSummary } from "@/lib/api/public-types";
import { StoryCard } from "./StoryCard";
import { SectionHeading } from "./SectionHeading";

/// The newest story from each desk not already shown above. The honest
/// automatic label avoids implying manual editor selection.
export function EditorsPicks({ stories }: { stories: PublicArticleSummary[] }) {
  const [featured, ...rest] = stories;
  if (!featured || rest.length === 0) return null;

  return (
    <section aria-labelledby="picks-heading" className="desk-roundup border-y border-rule">
      <div className="mx-auto max-w-(--width-page-max) px-space-4 py-space-7 md:px-space-5 md:py-space-8">
        <SectionHeading id="picks-heading" title="Across the desks" eyebrow="Newest from each section" />
        <div className="mt-space-6 grid grid-cols-1 gap-y-space-6 md:grid-cols-12 md:gap-x-space-7">
          <StoryCard article={featured} variant="feature" morph className="md:col-span-7" />
          <div className="divide-y divide-rule md:col-span-5">
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
