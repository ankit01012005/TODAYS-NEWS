import { getCategoryWithArticles } from "@/lib/api/public";
import { SectionHeading } from "./SectionHeading";
import { StoryCard } from "./StoryCard";

/// docs/19 §3.11 — algorithmic "related stories" is [FUTURE] (no tags,
/// no content analysis in V1); what V1 shows is other published stories
/// in the same section, newest first. Labelled "More in {section}", never
/// "Related stories", so the interface doesn't promise relevance it can't
/// deliver. Rendered as a three-up row of standard cards (brief §12).
export async function MoreInSection({
  categorySlug,
  excludeSlug,
}: {
  categorySlug: string;
  excludeSlug: string;
}) {
  const result = await getCategoryWithArticles(categorySlug);
  if (!result) return null;

  const items = result.articles.filter((a) => a.slug !== excludeSlug).slice(0, 3);
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="more-heading" className="mt-space-9">
      <SectionHeading
        id="more-heading"
        title={`More in ${result.category.name}`}
        href={`/${result.category.slug}`}
        hrefLabel={`All ${result.category.name}`}
      />
      <div className="reveal-stagger mt-space-5 grid grid-cols-1 gap-x-space-6 gap-y-space-6 sm:grid-cols-2 md:grid-cols-3">
        {items.map((article) => (
          <StoryCard key={article.slug} article={article} variant="standard" morph className="reveal" />
        ))}
      </div>
    </section>
  );
}
