import Link from "next/link";
import type { PublicArticleSummary, PublicCategoryRef } from "@/lib/api/public-types";
import { Meta } from "./StoryCard";
import { AtlasGlobe } from "./AtlasGlobe";

export function WorldStage({
  category,
  articles,
}: {
  category: PublicCategoryRef;
  articles: PublicArticleSummary[];
}) {
  const [lead, ...secondary] = articles;
  if (!lead) return null;

  return (
    <section className="world-stage" aria-labelledby="world-heading">
      <div className="world-stage-copy">
        <p className="text-label text-gold">International desk</p>
        <h2 id="world-heading" className="mt-space-2 text-display-1 text-paper">
          Around the world
        </h2>
        <p className="mt-space-3 max-w-[48ch] text-body text-paper/72">
          Reporting on the decisions, events and forces shaping life across borders.
        </p>

        <div className="mt-space-6 border-t border-paper/20 pt-space-5">
          <Link href={`/${lead.category.slug}/${lead.slug}`} className="group block no-underline">
            <h3 className="text-headline-lg text-paper">
              <span className="link-underline">{lead.headline}</span>
            </h3>
            <p className="mt-space-2 line-clamp-2 text-body text-paper/70">{lead.summary}</p>
            <div className="world-meta"><Meta article={lead} tone="light" /></div>
          </Link>

          {secondary.length > 0 ? (
            <div className="mt-space-5 grid gap-space-4 border-t border-paper/15 pt-space-4 sm:grid-cols-2">
              {secondary.slice(0, 2).map((article) => (
                <Link key={article.slug} href={`/${article.category.slug}/${article.slug}`} className="group no-underline">
                  <h3 className="text-headline-sm text-paper">
                    <span className="link-underline">{article.headline}</span>
                  </h3>
                  <div className="world-meta"><Meta article={article} tone="light" compact /></div>
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <Link href={`/${category.slug}`} className="world-stage-link mt-space-5 inline-flex items-center gap-x-space-2 text-meta text-paper no-underline">
          All {category.name} coverage <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="world-stage-visual">
        <AtlasGlobe />
      </div>
    </section>
  );
}
