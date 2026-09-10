import type { Metadata } from "next";
import { CmsShell } from "@/components/cms/CmsShell";
import { UsersManager } from "@/components/cms/UsersManager";
import { requireRole } from "@/lib/api/session";
import { listUsers } from "@/lib/api/cms";

export const metadata: Metadata = { title: "Users — Today News", robots: { index: false } };

export default async function UsersPage() {
  const user = await requireRole("ADMIN");
  const users = await listUsers();

  return (
    <CmsShell user={user}>
      <h1 className="text-heading-2 text-ink">Users</h1>
      <div className="mt-space-5">
        <UsersManager users={users} currentUserId={user.id} />
      </div>
    </CmsShell>
  );
}
