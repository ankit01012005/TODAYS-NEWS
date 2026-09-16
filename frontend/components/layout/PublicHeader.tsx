import { getCategories, getPublishedArticlesOrEmpty } from "@/lib/api/public";
import { Masthead } from "./Masthead";
import { PrimaryNav } from "./PrimaryNav";
import { PulseBand } from "./PulseBand";

/// The reader site's header, stacked as 1a draws it: masthead with the
/// 3px red rule → sticky section nav → the dark Pulse band. The nav sits
/// OUTSIDE the <header> element on purpose: position: sticky is bounded
/// by its parent, so inside the header it would unstick as soon as the
/// header scrolled away. `showPulse` is off on the article page so the
/// ticker doesn't compete with the headline.
export async function PublicHeader({
  activeCategorySlug,
  activeHome = false,
  activePath,
  showPulse = true,
}: {
  activeCategorySlug?: string;
  activeHome?: boolean;
  activePath?: string;
  showPulse?: boolean;
} = {}) {
  const [categories, latest] = await Promise.all([
    getCategories(),
    showPulse ? getPublishedArticlesOrEmpty() : Promise.resolve(null),
  ]);

  return (
    <>
      <header>
        <Masthead categories={categories} />
      </header>
      <PrimaryNav
        categories={categories}
        activeCategorySlug={activeCategorySlug}
        activeHome={activeHome}
        activePath={activePath}
      />
      {latest ? <PulseBand articles={latest.articles} /> : null}
    </>
  );
}
