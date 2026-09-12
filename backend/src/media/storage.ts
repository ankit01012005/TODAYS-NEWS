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
}

export interface StorageAdapter {
  upload(key: string, buffer: Buffer): Promise<StoredObject>;
  delete(key: string): Promise<void>;
}

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
          });
        },
      );
      stream.end(buffer);
    });
  }

  async delete(key: string): Promise<void> {
    await cloudinary.uploader.destroy(key, { resource_type: "image", invalidate: true });
  }
}

export const storage: StorageAdapter = new CloudinaryStorageAdapter();
