import Link from "next/link";
import { getCategoryWithArticles } from "@/lib/api/public";

/// docs/19 §3.11 — algorithmic "related stories" is [FUTURE] (no tags,
/// no content analysis in V1); what V1 shows is other published stories
/// in the same section, newest first. Labelled "More in {section}", never
/// "Related stories", so the interface doesn't promise relevance it can't
/// deliver.
export async function MoreInSection({
  categorySlug,
  excludeSlug,
}: {
  categorySlug: string;
  excludeSlug: string;
}) {
  const result = await getCategoryWithArticles(categorySlug);
  if (!result) return null;

  const items = result.articles.filter((a) => a.slug !== excludeSlug).slice(0, 4);
  if (items.length === 0) return null;

  return (
    <section className="mt-space-8 border-t border-rule pt-space-6">
      <h2 className="text-label text-ink-muted">More in {result.category.name}</h2>
      <ul className="mt-space-4 space-y-space-4">
        {items.map((article) => (
          <li key={article.slug}>
            <Link href={`/${article.category.slug}/${article.slug}`} className="block no-underline">
              <h3 className="text-heading-4 text-ink hover:underline">{article.headline}</h3>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
