import type { Metadata } from "next";
import { CmsShell } from "@/components/cms/CmsShell";
import { NewArticleForm } from "@/components/cms/NewArticleForm";
import { requireSession } from "@/lib/api/session";
import { listCategoriesForStaff } from "@/lib/api/cms";

export const metadata: Metadata = { title: "New article — Today News", robots: { index: false } };

export default async function NewArticlePage() {
  const user = await requireSession();
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
