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
  /// Every key currently held under this deployment's folder — what
  /// reconcile() in media.service.ts compares the database against after
  /// someone deletes straight from the provider's dashboard.
  listKeys(): Promise<Set<string>>;
}

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

  async listKeys(): Promise<Set<string>> {
    const keys = new Set<string>();
    let cursor: string | undefined;
    do {
      const page = (await cloudinary.api.resources({
        type: "upload",
        resource_type: "image",
        prefix: `${config.CLOUDINARY_FOLDER}/`,
        max_results: 500,
        next_cursor: cursor,
      })) as { resources: Array<{ public_id: string }>; next_cursor?: string };
      for (const resource of page.resources) keys.add(resource.public_id);
      cursor = page.next_cursor;
    } while (cursor);
    return keys;
  }
}

export const storage: StorageAdapter = new CloudinaryStorageAdapter();
