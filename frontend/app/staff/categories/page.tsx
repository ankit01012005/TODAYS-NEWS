import type { Metadata } from "next";
import { CmsShell } from "@/components/cms/CmsShell";
import { CategoriesManager } from "@/components/cms/CategoriesManager";
import { requireRole } from "@/lib/api/session";
import { listCategoriesForStaff } from "@/lib/api/cms";

export const metadata: Metadata = { title: "Categories — Today News", robots: { index: false } };

export default async function CategoriesPage() {
  const user = await requireRole("ADMIN");
  const categories = await listCategoriesForStaff();

  return (
    <CmsShell user={user}>
      <h1 className="text-heading-2 text-ink">Categories</h1>
      <div className="mt-space-5">
        <CategoriesManager categories={categories} />
      </div>
    </CmsShell>
  );
}
