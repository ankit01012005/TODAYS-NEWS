import Link from "next/link";
import { PublicArticleSummary } from "@/lib/api/public-types";
import { Kicker, Meta, StoryImage } from "./StoryCard";
import { SectionHeading } from "./SectionHeading";

/// Brief §9 — a numbered hierarchy where the numerals carry the identity:
/// large serif figures in the masthead red. 01 gets a picture; the rest
/// are typography. Ordered by publication (there is no traffic data to
/// rank by, so the section is honestly "Top stories", not "Trending").
export function TopStories({ stories }: { stories: PublicArticleSummary[] }) {
  if (stories.length < 2) return null;

  return (
    <section aria-labelledby="top-heading">
      <SectionHeading id="top-heading" title="Top stories" />
      <ol className="reveal-stagger grid grid-cols-1 divide-y divide-rule md:grid-cols-4 md:divide-x md:divide-y-0">
        {stories.map((article, index) => (
          <li
            key={article.slug}
            className="reveal py-space-5 md:px-space-5 md:py-space-2 md:first:pl-0 md:last:pr-0"
          >
            <Link
              href={`/${article.category.slug}/${article.slug}`}
              className="group flex gap-x-space-4 no-underline md:block"
            >
              <span className="text-numeral shrink-0 text-brand" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="sr-only">{`Number ${index + 1}: `}</span>
              <div className="min-w-0 md:mt-space-4">
                {index === 0 && article.featuredImage ? (
                  <div className="relative mb-space-3 hidden aspect-3/2 overflow-hidden bg-surface-sunken md:block">
                    <StoryImage
                      image={article.featuredImage}
                      slug={article.slug}
                      morph
                      sizes="(min-width: 1200px) 300px, 25vw"
                    />
                  </div>
                ) : null}
                <Kicker name={article.category.name} />
                <h3 className="mt-space-1 text-heading-3 text-ink">
                  <span className="link-underline">{article.headline}</span>
                </h3>
                <Meta article={article} />
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
