import type { Metadata } from "next";
import { CmsShell } from "@/components/cms/CmsShell";
import { MediaLibrary } from "@/components/cms/MediaLibrary";
import { requireSession } from "@/lib/api/session";
import { listMedia } from "@/lib/api/cms";

export const metadata: Metadata = { title: "Media — Today News", robots: { index: false } };

/// The media library. Both roles: editors upload and delete their own
/// images, the admin deletes any and can sync the library against
/// Cloudinary. The backend decides what each caller may actually do
/// (media.service.ts) — this page only chooses what to offer.
export default async function MediaPage() {
  const user = await requireSession();
  const media = await listMedia();

  return (
    <CmsShell user={user}>
      <h1 className="text-heading-2 text-ink">Media</h1>
      <div className="mt-space-5">
        <MediaLibrary media={media} viewer={user} />
      </div>
    </CmsShell>
  );
}
