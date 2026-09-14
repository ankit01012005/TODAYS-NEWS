import type { Metadata } from "next";
import { CmsShell } from "@/components/cms/CmsShell";
import { UsersManager } from "@/components/cms/UsersManager";
import { Reveal } from "@/components/motion/Reveal";
import { requireRole } from "@/lib/api/session";
import { listUsers } from "@/lib/api/cms";

export const metadata: Metadata = { title: "Staff", robots: { index: false } };

/// 2r — staff & roles, admin only (user:manage).
export default async function UsersPage() {
  const user = await requireRole("ADMIN");
  const users = await listUsers();

  return (
    <CmsShell user={user}>
      <Reveal>
        <UsersManager users={users} currentUserId={user.id} />
      </Reveal>
    </CmsShell>
  );
}
