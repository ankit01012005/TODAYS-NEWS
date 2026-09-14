import { getCategoryWithArticles } from "@/lib/api/public";
import { SectionHeading } from "./SectionHeading";
import { StoryCard } from "./StoryCard";

/// 1d "MORE IN INDIA" — other published stories in the same section,
/// newest first, as two 16:9 cards under a 2px ink rule. Labelled "More
/// in {section}", never "Related", so the interface doesn't promise a
/// relevance it can't deliver.
export async function MoreInSection({
  categorySlug,
  excludeSlug,
}: {
  categorySlug: string;
  excludeSlug: string;
}) {
  const result = await getCategoryWithArticles(categorySlug);
  if (!result) return null;

  const items = result.articles.filter((a) => a.slug !== excludeSlug).slice(0, 2);
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="more-heading" className="mt-space-8">
      <SectionHeading
        id="more-heading"
        title={`More in ${result.category.name}`}
        href={`/${result.category.slug}`}
        hrefLabel={`All ${result.category.name}`}
      />
      <div className="reveal-stagger mt-space-4 grid grid-cols-1 gap-x-space-5 gap-y-space-5 sm:grid-cols-2">
        {items.map((article) => (
          <StoryCard key={article.slug} article={article} variant="standard" morph className="reveal" />
        ))}
      </div>
    </section>
  );
}
