import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CmsShell } from "@/components/cms/CmsShell";
import { ArticleEditor } from "@/components/cms/ArticleEditor";
import { requireSession } from "@/lib/api/session";
import {
  getArticle,
  getArticleSources,
  getRevisionHistory,
  listCategoriesForStaff,
  listMedia,
  listSourcesForStaff,
} from "@/lib/api/cms";

export const metadata: Metadata = { title: "Edit article — Today News", robots: { index: false } };

/// PG-EDT-07/08/09 combined into one page — ArticleEditor itself decides
/// editable vs. read-only vs. waiting-for-review from the article's own
/// state, per docs/26 §1.3.
export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireSession();
  const article = await getArticle(id);
  // SEC-03-adjacent: getArticle returns null for both "doesn't exist" and
  // "not yours" (assertOwnerOrAdmin throws NotFoundError either way) — one
  // notFound() call, no separate branch that could tell them apart.
  if (!article) notFound();

  const [categories, media, sources, attachedSources, history] = await Promise.all([
    listCategoriesForStaff(),
    listMedia(),
    listSourcesForStaff(),
    getArticleSources(id),
    getRevisionHistory(id),
  ]);

  return (
    <CmsShell user={user}>
      <ArticleEditor
        article={article}
        categories={categories}
        media={media}
        sources={sources}
        attachedSources={attachedSources}
        history={history}
        viewerRole={user.role}
      />
    </CmsShell>
  );
}
