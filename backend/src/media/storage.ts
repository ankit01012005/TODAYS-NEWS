/// Storage is behind an interface so a real S3-compatible backend
/// (docs/23 §14.1) can replace the local-disk implementation later without
/// touching the rest of the Media domain. Choosing the real object-storage
/// provider and credentials is a deployment decision not yet made — this
/// local-disk adapter is a disclosed placeholder for local development
/// only, not a production storage strategy.
export interface StorageAdapter {
  save(key: string, buffer: Buffer): Promise<void>;
  delete(key: string): Promise<void>;
}

import { mkdir, rm, writeFile } from "fs/promises";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

export class LocalDiskStorageAdapter implements StorageAdapter {
  async save(key: string, buffer: Buffer): Promise<void> {
    await mkdir(UPLOADS_DIR, { recursive: true });
    await writeFile(path.join(UPLOADS_DIR, key), buffer);
  }

  async delete(key: string): Promise<void> {
    await rm(path.join(UPLOADS_DIR, key), { force: true });
  }
}

export const storage: StorageAdapter = new LocalDiskStorageAdapter();
export { UPLOADS_DIR };
