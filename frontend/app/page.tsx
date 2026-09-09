import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { ArticleCard } from "@/components/public/ArticleCard";
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
          <EmptyHomepage />
        )}
      </main>
      <PublicFooter />
    </>
  );
}

/// docs/12 §0 — "no stories published yet... must look deliberate, not
/// broken." The site's actual day-one state (docs/12 PG-PUB-01).
function EmptyHomepage() {
  return (
    <div className="py-space-10 text-center">
      <h1 className="text-heading-3 text-ink">No stories published yet</h1>
      <p className="mx-auto mt-space-3 max-w-(--width-measure) text-body text-ink-secondary">
        Today News is just getting started. Check back soon for the latest coverage.
      </p>
    </div>
  );
}
