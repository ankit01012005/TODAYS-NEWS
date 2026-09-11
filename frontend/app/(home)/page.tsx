import { ViewTransition } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicSite } from "@/components/layout/PublicSite";
import { HeroStory } from "@/components/public/HeroStory";
import { StoryGrid } from "@/components/public/StoryGrid";
import { JustIn } from "@/components/public/JustIn";
import { TopStories } from "@/components/public/TopStories";
import { SocialPicks } from "@/components/public/SocialPicks";
import { EditorsPicks } from "@/components/public/EditorsPicks";
import { CategorySection } from "@/components/public/CategorySection";
import { WorldStage } from "@/components/public/WorldStage";
import { EmptyState } from "@/components/public/EmptyState";
import { getCategories, getCategoryWithArticles, getPublishedArticles, getSocialPicks } from "@/lib/api/public";
import { PublicArticleSummary } from "@/lib/api/public-types";

/// PG-PUB-01. One list of published stories, newest first, allocated to
/// compositions of decreasing weight (brief §4–§10): hero (1 + 3), the
/// editorial grid (6) beside Just in (7 newest), Top stories (4),
/// Editor's picks (one per desk not shown above), then every desk in
/// turn. A story may legitimately reappear inside its own desk's section.
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
        <main id="content" className="mx-auto max-w-(--width-page-max) px-space-4 py-space-6 md:px-space-5">
          <EmptyState
            heading="No stories published yet"
            body="Today News is just getting started. Check back soon for the latest coverage."
          />
        </main>
        <PublicFooter />
      </PublicSite>
    );
  }

  const heroSecondary = articles.slice(1, 4);
  const gridStories = articles.slice(4, 8);
  const latest = articles.slice(0, 5);
  const top = articles.slice(8, 12);
  const shownAbove = new Set(articles.slice(0, 12).map((a) => a.slug));
  const picks = pickOnePerDesk(articles, shownAbove, 4);

  const sections = (
    await Promise.all(
      categories.map(async (category) => {
        const result = await getCategoryWithArticles(category.slug);
        return result && result.articles.length > 0 ? { category, articles: result.articles } : null;
      }),
    )
  ).filter((s): s is { category: (typeof categories)[number]; articles: PublicArticleSummary[] } => s !== null);
  const worldSection = sections.find(
    ({ category }) => category.slug.toLowerCase() === "world" || category.name.toLowerCase() === "world",
  );
  const deskSections = sections.filter((section) => section !== worldSection);

  return (
    <PublicSite>
      <PublicHeader activeHome />
      <ViewTransition default="page-fade">
        <main id="content">
          <div className="mx-auto max-w-(--width-page-max) px-space-4 pt-space-6 md:px-space-5 md:pt-space-7">
            <HeroStory lead={lead} secondary={heroSecondary} latest={latest} />
          </div>

          {gridStories.length > 0 ? (
            <div className="mx-auto max-w-(--width-page-max) px-space-4 pt-space-8 md:px-space-5 md:pt-space-9">
              <StoryGrid stories={gridStories} />
            </div>
          ) : (
            <div className="mx-auto max-w-(--width-page-max) px-space-4 pt-space-8 md:px-space-5">
              <div className="md:max-w-(--width-measure)">
                <JustIn articles={latest.slice(1)} />
              </div>
            </div>
          )}

          {worldSection ? (
            <div className="mx-auto max-w-(--width-page-max) px-space-4 pt-space-8 md:px-space-5 md:pt-space-9">
              <WorldStage category={worldSection.category} articles={worldSection.articles.slice(0, 3)} />
            </div>
          ) : null}

          {top.length >= 2 ? (
            <div className="mx-auto max-w-(--width-page-max) px-space-4 pt-space-8 md:px-space-5 md:pt-space-9">
              <TopStories stories={top} />
            </div>
          ) : null}

          {socialPicks.length > 0 ? (
            <div className="mx-auto max-w-(--width-page-max) px-space-4 pt-space-8 md:px-space-5 md:pt-space-9">
              <SocialPicks picks={socialPicks} />
            </div>
          ) : null}

          {picks.length >= 2 ? (
            <div className="pt-space-8 md:pt-space-9">
              <EditorsPicks stories={picks} />
            </div>
          ) : null}

          {deskSections.length > 0 ? (
            <div className="mx-auto max-w-(--width-page-max) space-y-space-8 px-space-4 pt-space-8 md:space-y-space-9 md:px-space-5 md:pt-space-9">
              {deskSections.map((section, index) => (
                <CategorySection
                  key={section.category.slug}
                  category={section.category}
                  articles={section.articles}
                  composition={(index % 3 === 0 ? "lead" : index % 3 === 1 ? "row" : "text")}
                  tone={index % 4 === 2 ? "sage" : "paper"}
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

/// Newest story from each desk that isn't already on the page above; if
/// the site is still small enough that that yields fewer than two, fall
/// back to one-per-desk regardless.
function pickOnePerDesk(
  all: PublicArticleSummary[],
  exclude: Set<string>,
  max: number,
): PublicArticleSummary[] {
  const select = (skipShown: boolean) => {
    const seen = new Set<string>();
    const picks: PublicArticleSummary[] = [];
    for (const article of all) {
      if ((skipShown && exclude.has(article.slug)) || seen.has(article.category.slug)) continue;
      seen.add(article.category.slug);
      picks.push(article);
      if (picks.length === max) break;
    }
    return picks;
  };
  const strict = select(true);
  return strict.length >= 2 ? strict : select(false);
}

