import Link from "next/link";
import { PublicArticleSummary, PublicCategoryRef } from "@/lib/api/public-types";
import { StoryCard } from "./StoryCard";
import { SectionHeading } from "./SectionHeading";

/// Brief §8 — each desk is its own editorial destination, and the desks
/// alternate between lead, image-row and typography compositions so the
/// front page changes rhythm without changing the underlying content.
export function CategorySection({
  category,
  articles,
  composition,
  tone = "paper",
}: {
  category: PublicCategoryRef;
  articles: PublicArticleSummary[];
  composition: "lead" | "row" | "text";
  tone?: "paper" | "sage";
}) {
  if (articles.length === 0) return null;
  const href = `/${category.slug}`;
  const shell = tone === "sage" ? "desk-section-sage" : "";

  if (composition === "row") {
    return (
      <section aria-labelledby={`section-${category.slug}`} className={shell}>
        <SectionHeading id={`section-${category.slug}`} title={category.name} href={href} />
        <div className="editorial-auto-grid reveal-stagger mt-space-5">
          {articles.slice(0, 3).map((article) => (
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

  if (composition === "text") {
    return (
      <section aria-labelledby={`section-${category.slug}`} className={shell}>
        <SectionHeading id={`section-${category.slug}`} title={category.name} href={href} />
        <div className="typography-desk reveal-stagger mt-space-5">
          {articles.slice(0, 4).map((article) => (
            <StoryCard key={article.slug} article={article} variant="text" className="reveal" />
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
    <section aria-labelledby={`section-${category.slug}`} className={shell}>
      <SectionHeading id={`section-${category.slug}`} title={category.name} href={href} />
      <div className="mt-space-5 grid grid-cols-1 gap-y-space-6 md:grid-cols-12 md:gap-x-space-6">
        <StoryCard article={lead} variant="feature" className={`reveal ${rest.length > 0 ? "md:col-span-7" : "md:col-span-8"}`} />
        {rest.length > 0 ? (
          <div className="divide-y divide-rule md:col-span-5 md:border-l md:border-rule md:pl-space-6">
            {texts.map((article) => (
              <StoryCard key={article.slug} article={article} variant="compact" className="reveal py-space-4 first:pt-0" />
            ))}
            {list.length > 0 ? (
              <div className="pt-space-4">
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
        ) : null}
      </div>
    </section>
  );
}
