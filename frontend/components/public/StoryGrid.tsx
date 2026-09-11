import { PublicArticleSummary } from "@/lib/api/public-types";
import { TiltCard } from "@/components/motion/TiltCard";
import { StoryCard } from "./StoryCard";
import { JustIn } from "./JustIn";

/// Brief §5 — the art-directed editorial grid. Eight columns of stories
/// beside the four-column Just In rail: one image-overlay feature at
/// depth-2 (with cursor tilt) over two standard cards, then a row of
/// three. Asymmetric on purpose; nothing here is a repeated rectangle.
export function StoryGrid({
  stories,
  latest,
}: {
  stories: PublicArticleSummary[];
  latest: PublicArticleSummary[];
}) {
  const [feature, second, third, ...row] = stories;
  if (!feature) return null;

  return (
    <div className="space-y-space-7">
      <div className="grid grid-cols-1 gap-y-space-7 md:grid-cols-12 md:gap-x-space-6">
        <div className="grid grid-cols-1 gap-x-space-6 gap-y-space-6 sm:grid-cols-2 md:col-span-8">
          <TiltCard className="sm:col-span-2" maxDegrees={1.5} shift={4}>
            <StoryCard article={feature} variant="overlay" morph />
          </TiltCard>
          {second ? <StoryCard article={second} variant="standard" morph /> : null}
          {third ? <StoryCard article={third} variant="standard" morph /> : null}
        </div>
        <aside className="md:col-span-4">
          <JustIn articles={latest} />
        </aside>
      </div>

      {row.length > 0 ? (
        <div className="reveal-stagger grid grid-cols-1 gap-x-space-6 gap-y-space-6 border-t border-rule pt-space-6 sm:grid-cols-2 md:grid-cols-3">
          {row.map((article) => (
            <StoryCard key={article.slug} article={article} variant="standard" morph className="reveal" />
          ))}
        </div>
      ) : null}
    </div>
  );
}
