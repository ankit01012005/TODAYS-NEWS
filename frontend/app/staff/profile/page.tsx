import type { Metadata } from "next";
import { CmsShell } from "@/components/cms/CmsShell";
import { ProfileForm } from "@/components/cms/ProfileForm";
import { requireSession } from "@/lib/api/session";

export const metadata: Metadata = { title: "Profile — Today News", robots: { index: false } };

export default async function ProfilePage() {
  const user = await requireSession();

  return (
    <CmsShell user={user}>
      <h1 className="text-heading-2 text-ink">Your profile</h1>
      <div className="mt-space-5">
        <ProfileForm user={user} />
      </div>
    </CmsShell>
  );
}
