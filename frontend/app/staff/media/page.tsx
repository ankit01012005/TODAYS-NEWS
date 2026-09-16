import type { Metadata } from "next";
import { CmsShell } from "@/components/cms/CmsShell";
import { MediaLibrary } from "@/components/cms/MediaLibrary";
import { Reveal } from "@/components/motion/Reveal";
import { requireSession } from "@/lib/api/session";
import { listMedia } from "@/lib/api/cms";

export const metadata: Metadata = { title: "Media", robots: { index: false } };

/// 2m — both roles: editors upload and delete their own images, the
/// admin deletes any and can sync the library against Cloudinary. The
/// backend decides what each caller may actually do; this page only
/// chooses what to offer.
export default async function MediaPage() {
  const user = await requireSession();
  const media = await listMedia();

  return (
    <CmsShell user={user} width="wide">
      <Reveal>
        <MediaLibrary media={media} viewer={user} />
      </Reveal>
    </CmsShell>
  );
}
