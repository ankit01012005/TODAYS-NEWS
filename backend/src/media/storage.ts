import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { config } from "../config";

/// Object storage for uploaded images (docs/23 §14.1, docs/27 B1) —
/// Cloudinary, which also serves as the CDN: the URL it returns is what
/// readers' browsers load directly, so the API never proxies image bytes.
/// Kept behind a small interface so the Media domain only ever sees
/// "store these bytes, give me a public URL".
export interface StoredObject {
  /// Provider identifier for the object — what `delete` takes back.
  key: string;
  /// Publicly reachable https URL for the stored bytes.
  url: string;
  width: number | null;
  height: number | null;
  /// Size of what was actually stored — smaller than the upload once the
  /// incoming transformation has run.
  bytes: number | null;
}

export interface StorageAdapter {
  upload(key: string, buffer: Buffer): Promise<StoredObject>;
  delete(key: string): Promise<void>;
  /// Which of these exact keys the provider still holds — what reconcile()
  /// in media.service.ts compares the database against after someone
  /// deletes straight from the provider's dashboard. Asked key by key, not
  /// by listing a folder: a row's key carries the folder it was uploaded
  /// under, and CLOUDINARY_FOLDER can change after the fact (the ANVAY TV
  /// rename did), which made every older image look deleted.
  existingKeys(keys: string[]): Promise<Set<string>>;
}

/// Cloudinary's Admin API cap on public_ids per resources_by_ids call.
const LOOKUP_BATCH = 100;

/// The longest edge any stored master needs. Nothing on the site renders
/// wider than ~1,300 CSS px (2× for retina ≈ 2,600), so a 6,000 px camera
/// original is only storage and transfer cost; Cloudinary scales it down
/// on the way in. Smaller images are left as they are.
const MAX_STORED_EDGE_PX = 2_400;

class CloudinaryStorageAdapter implements StorageAdapter {
  constructor() {
    // The SDK also reads CLOUDINARY_URL from process.env on its own, but
    // going through config keeps boot-time validation the single place
    // that decides whether the value is usable.
    const parsed = new URL(config.CLOUDINARY_URL);
    cloudinary.config({
      cloud_name: parsed.hostname,
      api_key: decodeURIComponent(parsed.username),
      api_secret: decodeURIComponent(parsed.password),
      secure: true,
    });
  }

  upload(key: string, buffer: Buffer): Promise<StoredObject> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: config.CLOUDINARY_FOLDER,
          // Our own generated key (media.service.ts) is the object's name —
          // never the uploader's filename, never a Cloudinary-chosen one.
          public_id: key,
          use_filename: false,
          unique_filename: false,
          overwrite: false,
          resource_type: "image",
          // Incoming transformation — applied BEFORE the master is stored,
          // so what sits in the bucket is already sane: bounded in size,
          // re-encoded at Cloudinary's automatic quality for the format,
          // and (as with any transformation) stripped of camera metadata,
          // which can carry a GPS position. Delivery-time sizing and format
          // negotiation (f_auto/q_auto, per-width variants) happen in the
          // frontend's image loader, on top of this master.
          transformation: [
            { width: MAX_STORED_EDGE_PX, height: MAX_STORED_EDGE_PX, crop: "limit" },
            { quality: "auto:good" },
          ],
        },
        (error, result?: UploadApiResponse) => {
          if (error || !result) {
            reject(error ?? new Error("Cloudinary returned no upload result"));
            return;
          }
          resolve({
            key: result.public_id,
            url: result.secure_url,
            width: Number.isInteger(result.width) ? result.width : null,
            height: Number.isInteger(result.height) ? result.height : null,
            bytes: Number.isInteger(result.bytes) ? result.bytes : null,
          });
        },
      );
      stream.end(buffer);
    });
  }

  async delete(key: string): Promise<void> {
    // invalidate: also purge the CDN's cached copies, so a deleted image
    // stops loading everywhere within minutes rather than at cache expiry.
    const result = (await cloudinary.uploader.destroy(key, { resource_type: "image", invalidate: true })) as {
      result?: string;
    };
    // "not found" is success for our purposes — the object is gone either
    // way (someone may have deleted it from the dashboard already).
    if (result.result !== "ok" && result.result !== "not found") {
      throw new Error(`Cloudinary refused to delete ${key}: ${String(result.result)}`);
    }
  }

  async existingKeys(keys: string[]): Promise<Set<string>> {
    const found = new Set<string>();
    for (let i = 0; i < keys.length; i += LOOKUP_BATCH) {
      const batch = keys.slice(i, i + LOOKUP_BATCH);
      // Only the objects that exist come back; an unknown id is simply
      // absent, and any API failure throws before anything is compared.
      const page = (await cloudinary.api.resources_by_ids(batch, {
        type: "upload",
        resource_type: "image",
        max_results: LOOKUP_BATCH,
      })) as { resources: Array<{ public_id: string }> };
      for (const resource of page.resources) found.add(resource.public_id);
    }
    return found;
  }
}

export const storage: StorageAdapter = new CloudinaryStorageAdapter();
