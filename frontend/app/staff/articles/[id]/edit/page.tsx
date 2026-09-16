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
  listUsers,
} from "@/lib/api/cms";

export const metadata: Metadata = { title: "Composer", robots: { index: false } };

/// 1j — one page for editable, waiting-for-review and read-only;
/// ArticleEditor decides from the article's own state.
export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireSession();
  // Everything the composer needs in ONE parallel round: the API is a
  // remote hop away and each call costs the same regardless of order.
  // The per-article reads are gated by the same ownership check as
  // getArticle (they 404 for a stranger), so nothing leaks by asking
  // early — the article check below still decides whether the page renders.
  const [article, categories, media, sources, attachedSources, history, users] = await Promise.all([
    getArticle(id),
    listCategoriesForStaff(),
    listMedia(),
    listSourcesForStaff(),
    getArticleSources(id).catch(() => null),
    getRevisionHistory(id).catch(() => null),
    user.role === "ADMIN" ? listUsers().catch(() => []) : Promise.resolve([]),
  ]);
  // getArticle returns null for both "doesn't exist" and "not yours" —
  // one notFound() call, no separate branch that could tell them apart.
  if (!article || attachedSources === null || history === null) notFound();

  const names = Object.fromEntries(users.map((u) => [u.id, u.displayName]));

  return (
    <CmsShell user={user} width="full">
      <ArticleEditor
        article={article}
        categories={categories}
        media={media}
        sources={sources}
        attachedSources={attachedSources}
        history={history}
        viewerRole={user.role}
        names={names}
      />
    </CmsShell>
  );
}
