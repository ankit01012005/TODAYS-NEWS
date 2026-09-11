import { getCategories } from "@/lib/api/public";
import { Masthead } from "./Masthead";
import { PrimaryNav } from "./PrimaryNav";
import { LatestStrip } from "./LatestStrip";

/// docs/19 §2.4, restructured per brief §3 into a publication masthead:
/// publication strip → wordmark → masthead rule → sticky section nav →
/// "Just in" strip. The nav sits OUTSIDE the <header> element on purpose:
/// position: sticky is bounded by its parent, so inside the header it
/// would unstick as soon as the header scrolled away. `showLatest` is off
/// on the article page so the strip doesn't compete with the headline
/// (brief §12: the story dominates).
///
/// docs/19 §2.4 / SEO-09 — no public-facing element ever links into the
/// back-office.
export async function PublicHeader({
  activeCategorySlug,
  showLatest = true,
}: { activeCategorySlug?: string; showLatest?: boolean } = {}) {
  const categories = await getCategories();

  return (
    <>
      <header>
        <Masthead />
      </header>
      <PrimaryNav categories={categories} activeCategorySlug={activeCategorySlug} />
      {showLatest ? <LatestStrip /> : null}
    </>
  );
}
