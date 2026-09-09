import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { ArticleCard } from "@/components/public/ArticleCard";
import { EmptyState } from "@/components/public/EmptyState";
import { getPublishedArticles } from "@/lib/api/public";

export default async function HomePage() {
  const { articles } = await getPublishedArticles();
  const [lead, ...rest] = articles;

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-(--width-page-max) px-space-4 py-space-6 md:px-space-5">
        {lead ? (
          <>
            <ArticleCard article={lead} variant="lead" />
            {rest.length > 0 ? (
              <div className="mt-space-8 grid grid-cols-1 gap-x-space-5 gap-y-space-6 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((article) => (
                  <ArticleCard key={article.slug} article={article} variant="standard" />
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <EmptyState
            heading="No stories published yet"
            body="Today News is just getting started. Check back soon for the latest coverage."
          />
        )}
      </main>
      <PublicFooter />
    </>
  );
}
