import { ViewTransition } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicSite } from "@/components/layout/PublicSite";
import { HandlesBar } from "@/components/layout/HandlesBar";
import { StoryCard } from "@/components/public/StoryCard";
import { JustIn } from "@/components/public/JustIn";
import { SocialPicks } from "@/components/public/SocialPicks";
import { DeskSection } from "@/components/public/DeskSection";
import { EmptyState } from "@/components/public/EmptyState";
import { getCategories, getCategoryWithArticles, getPublishedArticles, getSocialPicks } from "@/lib/api/public";
import { PublicArticleSummary, PublicCategoryRef } from "@/lib/api/public-types";

/// 1a "Pulse Front". One list of published stories, newest first: the
/// lead (articles[0]) at 16:9 with three secondaries beneath, a right
/// rail of Just In (mono timestamps) and Top on social, then the handles
/// bar and every desk in turn. Grid: 1fr 300px, 30px gap, 1080px max.
/// A story may legitimately reappear inside its own desk's section.
export default async function HomePage() {
  const [{ articles }, categories, socialPicks] = await Promise.all([
    getPublishedArticles(),
    getCategories(),
    getSocialPicks(),
  ]);
  const lead = articles[0];

  if (!lead) {
    return (
      <PublicSite>
        <PublicHeader activeHome />
        <main id="content" className="mx-auto max-w-(--width-page-max) px-space-4 py-space-7 md:px-space-6">
          <EmptyState
            heading="The first story is on its way."
            body="ANVAY TV is just getting started. A freshly set-up newsroom has no published stories yet — check back soon, or follow the handles for the pulse."
          />
        </main>
        <PublicFooter />
      </PublicSite>
    );
  }

  const secondaries = articles.slice(1, 4);
  const justIn = articles.length > 7 ? articles.slice(4, 10) : articles.slice(0, 6);

  const sections = (
    await Promise.all(
      categories.map(async (category) => {
        const result = await getCategoryWithArticles(category.slug);
        return result && result.articles.length > 0 ? { category, articles: result.articles } : null;
      }),
    )
  ).filter((s): s is { category: PublicCategoryRef; articles: PublicArticleSummary[] } => s !== null);

  return (
    <PublicSite>
      <PublicHeader activeHome />
      <ViewTransition default="page-fade">
        <main id="content">
          <div className="mx-auto max-w-(--width-page-max) px-space-4 pt-space-5 md:px-space-6 md:pt-space-6">
            <div className="grid grid-cols-1 gap-y-space-7 md:grid-cols-[minmax(0,1fr)_300px] md:gap-x-[30px]">
              <div>
                <StoryCard article={lead} variant="lead" preload headingLevel={1} />

                {secondaries.length > 0 ? (
                  <>
                    <div className="reveal-stagger mt-space-6 hidden grid-cols-3 gap-x-space-4 border-t border-rule pt-space-5 sm:grid">
                      {secondaries.map((article) => (
                        <StoryCard key={article.slug} article={article} variant="standard" morph className="reveal" />
                      ))}
                    </div>
                    <div className="mt-space-4 divide-y divide-rule border-t border-rule sm:hidden">
                      {secondaries.map((article) => (
                        <StoryCard key={article.slug} article={article} variant="compact" className="py-space-3" />
                      ))}
                    </div>
                  </>
                ) : null}
              </div>

              <aside aria-label="Just in and top on social" className="md:border-l md:border-rule md:pl-[22px]">
                <JustIn articles={justIn} />
                <SocialPicks picks={socialPicks} className="mt-space-6" />
              </aside>
            </div>
          </div>

          <div className="mt-space-8">
            <HandlesBar />
          </div>

          {sections.length > 0 ? (
            <div className="mx-auto max-w-(--width-page-max) space-y-space-8 px-space-4 pt-space-8 md:px-space-6">
              {sections.map((section, index) => (
                <DeskSection
                  key={section.category.slug}
                  category={section.category}
                  articles={section.articles}
                  composition={index % 2 === 0 ? "grid" : "lead"}
                />
              ))}
            </div>
          ) : null}
        </main>
      </ViewTransition>
      <PublicFooter />
    </PublicSite>
  );
}
