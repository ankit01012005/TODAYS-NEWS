import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { ArticleCard } from "@/components/public/ArticleCard";
import { EmptyState } from "@/components/public/EmptyState";
import { getCategoryWithArticles } from "@/lib/api/public";

/// PG-PUB-02 — docs/08 R-04: behaves as the homepage, filtered to one
/// section. E-03: a section with nothing published is a normal state, not
/// a failure — never a blank page.
export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: categorySlug } = await params;
  const result = await getCategoryWithArticles(categorySlug);
  if (!result) {
    notFound();
  }

  return (
    <>
      <PublicHeader activeCategorySlug={result.category.slug} />
      <main className="mx-auto max-w-(--width-page-max) px-space-4 py-space-6 md:px-space-5">
        <h1 className="text-heading-1 text-ink">{result.category.name}</h1>
        {result.articles.length > 0 ? (
          <div className="mt-space-6 grid grid-cols-1 gap-x-space-5 gap-y-space-6 md:grid-cols-2 lg:grid-cols-3">
            {result.articles.map((article) => (
              <ArticleCard key={article.slug} article={article} variant="standard" />
            ))}
          </div>
        ) : (
          <div className="mt-space-6">
            <EmptyState
              heading="Nothing published here yet"
              body={`There's no coverage in ${result.category.name} yet. Check back soon.`}
            />
          </div>
        )}
      </main>
      <PublicFooter />
    </>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const result = await getCategoryWithArticles(categorySlug);
  if (!result) return {};
  return { title: `${result.category.name} — Today News` };
}
