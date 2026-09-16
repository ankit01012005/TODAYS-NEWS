import type { Metadata } from "next";
import { CmsShell } from "@/components/cms/CmsShell";
import { CategoriesManager } from "@/components/cms/CategoriesManager";
import { Reveal } from "@/components/motion/Reveal";
import { requireRole } from "@/lib/api/session";
import { listCategoriesForStaff, listMyArticles } from "@/lib/api/cms";

export const metadata: Metadata = { title: "Sections", robots: { index: false } };

/// 2o — the URL space. Live-story counts per section come from the
/// admin's full article list, so the retire button is honest about what
/// stands in its way.
export default async function CategoriesPage() {
  const user = await requireRole("ADMIN");
  const [categories, articles] = await Promise.all([listCategoriesForStaff(), listMyArticles()]);
  const liveCounts: Record<string, number> = {};
  for (const article of articles) {
    if (article.publicationStatus === "LIVE") liveCounts[article.category.slug] = (liveCounts[article.category.slug] ?? 0) + 1;
  }

  return (
    <CmsShell user={user}>
      <Reveal>
        <CategoriesManager categories={categories} liveCounts={liveCounts} />
      </Reveal>
    </CmsShell>
  );
}
