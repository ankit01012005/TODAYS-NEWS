import type { Metadata } from "next";
import { CmsShell } from "@/components/cms/CmsShell";
import { NewArticleForm } from "@/components/cms/NewArticleForm";
import { requireRole } from "@/lib/api/session";
import { listCategoriesForStaff } from "@/lib/api/cms";

export const metadata: Metadata = { title: "New article — Today News", robots: { index: false } };

/// Admin can no longer author (backend/src/common/capabilities.ts) — this
/// page is editor-only, same UI-routing-convenience pattern as the
/// existing admin-only pages (session.ts's requireRole).
export default async function NewArticlePage() {
  const user = await requireRole("EDITOR");
  const categories = await listCategoriesForStaff();

  return (
    <CmsShell user={user}>
      <h1 className="text-heading-2 text-ink">Write a new article</h1>
      <div className="mt-space-5">
        <NewArticleForm categories={categories} />
      </div>
    </CmsShell>
  );
}
