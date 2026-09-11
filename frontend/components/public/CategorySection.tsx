import Link from "next/link";
import { PublicArticleSummary, PublicCategoryRef } from "@/lib/api/public-types";
import { StoryCard } from "./StoryCard";
import { SectionHeading } from "./SectionHeading";

/// Brief §8 — each desk is its own editorial destination, and the desks
/// alternate between two compositions so the page doesn't repeat itself:
/// "lead" (a feature, two typography stories, a headline list) and "row"
/// (four standard cards). Same components, different arrangement.
export function CategorySection({
  category,
  articles,
  composition,
}: {
  category: PublicCategoryRef;
  articles: PublicArticleSummary[];
  composition: "lead" | "row";
}) {
  if (articles.length === 0) return null;
  const href = `/${category.slug}`;

  if (composition === "row") {
    return (
      <section aria-labelledby={`section-${category.slug}`}>
        <SectionHeading id={`section-${category.slug}`} title={category.name} href={href} />
        <div className="reveal-stagger mt-space-5 grid grid-cols-1 gap-x-space-6 gap-y-space-6 sm:grid-cols-2 md:grid-cols-4">
          {articles.slice(0, 4).map((article) => (
            <StoryCard
              key={article.slug}
              article={article}
              variant="standard"
              showSummary={false}
              className="reveal"
            />
          ))}
        </div>
      </section>
    );
  }

  const [lead, ...rest] = articles;
  if (!lead) return null;
  const texts = rest.slice(0, 2);
  const list = rest.slice(2, 6);

  return (
    <section aria-labelledby={`section-${category.slug}`}>
      <SectionHeading id={`section-${category.slug}`} title={category.name} href={href} />
      <div className="mt-space-5 grid grid-cols-1 gap-y-space-6 md:grid-cols-12 md:gap-x-space-6">
        <StoryCard article={lead} variant="feature" className="reveal md:col-span-6" />
        {texts.length > 0 ? (
          <div className="divide-y divide-rule md:col-span-3">
            {texts.map((article) => (
              <StoryCard
                key={article.slug}
                article={article}
                variant="text"
                className="reveal py-space-4 first:pt-0"
              />
            ))}
          </div>
        ) : null}
        {list.length > 0 ? (
          <div className="md:col-span-3 md:border-l md:border-rule md:pl-space-5">
            <p className="text-label text-ink-muted">Also in {category.name}</p>
            <ul className="mt-space-3 divide-y divide-rule">
              {list.map((article) => (
                <li key={article.slug} className="py-space-3 first:pt-0">
                  <Link
                    href={`/${article.category.slug}/${article.slug}`}
                    className="group block no-underline"
                  >
                    <h3 className="text-headline-sm text-ink">
                      <span className="link-underline">{article.headline}</span>
                    </h3>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
