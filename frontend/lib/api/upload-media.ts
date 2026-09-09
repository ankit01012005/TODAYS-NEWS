import { clientFetch, readErrorMessage } from "./client-fetch";
import { MediaAssetView } from "./cms-types";

/// Shared by FeaturedImagePicker and BodyEditor's image block — both need
/// the same "pick a file, POST it as multipart, get a MediaAssetView back"
/// flow. Goes through the generic proxy like every other CMS write; the
/// proxy forwards the multipart Content-Type (with its boundary) through
/// unmodified, so this never needs to set it itself.
export async function uploadMediaFile(file: File): Promise<MediaAssetView> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await clientFetch("/media", { method: "POST", body: formData });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return (await res.json()) as MediaAssetView;
}
