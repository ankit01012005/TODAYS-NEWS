import { PublicArticleSummary, PublicCategoryRef } from "@/lib/api/public-types";
import { StoryCard } from "./StoryCard";
import { SectionHeading } from "./SectionHeading";

/// The desk sections beneath the front page's fold (1c "WORLD": an
/// uppercase label over a 2px ink rule, four 4:3 cards). Two
/// compositions alternate down the page so the rhythm changes without
/// the content having to: a four-up grid, and a picture lead beside a
/// column of typography rows.
export function DeskSection({
  category,
  articles,
  composition = "grid",
}: {
  category: PublicCategoryRef;
  articles: PublicArticleSummary[];
  composition?: "grid" | "lead";
}) {
  if (articles.length === 0) return null;
  const href = `/${category.slug}`;

  // The picture-lead composition needs a column of rows beside it; with
  // fewer than three stories the grid reads better.
  if (composition === "lead" && articles.length >= 3) {
    const [lead, ...rest] = articles;
    if (!lead) return null;
    return (
      <section aria-labelledby={`desk-${category.slug}`} className="reveal">
        <SectionHeading id={`desk-${category.slug}`} title={category.name} href={href} hrefLabel={`All ${category.name}`} />
        <div className="mt-space-4 grid grid-cols-1 gap-y-space-5 md:grid-cols-12 md:gap-x-space-6">
          <StoryCard article={lead} variant="standard" showSummary className="md:col-span-7" />
          <div className="divide-y divide-rule md:col-span-5 md:border-l md:border-rule md:pl-space-5">
            {rest.slice(0, 4).map((article) => (
              <StoryCard
                key={article.slug}
                article={article}
                variant="text"
                showSummary={false}
                className="py-space-3 first:pt-0 last:pb-0"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby={`desk-${category.slug}`} className="reveal">
      <SectionHeading id={`desk-${category.slug}`} title={category.name} href={href} hrefLabel={`All ${category.name}`} />
      <div className="reveal-stagger mt-space-4 grid grid-cols-2 gap-x-space-4 gap-y-space-5 md:grid-cols-4 md:gap-x-space-5">
        {articles.slice(0, 4).map((article) => (
          <StoryCard key={article.slug} article={article} variant="standard" className="reveal" />
        ))}
      </div>
    </section>
  );
}
