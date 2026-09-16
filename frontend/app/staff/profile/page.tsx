import type { Metadata } from "next";
import { CmsShell } from "@/components/cms/CmsShell";
import { ProfileForm } from "@/components/cms/ProfileForm";
import { Reveal } from "@/components/motion/Reveal";
import { requireSession } from "@/lib/api/session";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };

/// 2n — self-service only: display name (the byline), and a password
/// change that signs every other session out.
export default async function ProfilePage() {
  const user = await requireSession();

  return (
    <CmsShell user={user}>
      <Reveal>
        <ProfileForm user={user} />
      </Reveal>
    </CmsShell>
  );
}
