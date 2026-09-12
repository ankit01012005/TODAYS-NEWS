import { randomUUID } from "crypto";
import { MediaAsset } from "@prisma/client";
import { prisma } from "../db";
import { storage } from "./storage";
import { sniffImageType } from "./image-sniff";
import { BadRequestError, ForbiddenError, NotFoundError } from "../common/http-errors";
import { AuthenticatedUser } from "../common/authenticated-user";

/// SEC-10 — validated by content, stored under a generated key (never a
/// user-supplied filename, which prevents path traversal and overwriting).
/// The stored object's public URL is recorded on the row at upload time
/// and is the only image address the rest of the system ever uses.
export async function uploadMedia(
  user: AuthenticatedUser,
  file: { buffer: Buffer; originalname: string; size: number },
): Promise<MediaAsset> {
  const sniffed = sniffImageType(file.buffer);
  if (!sniffed) {
    throw new BadRequestError("Only JPEG, PNG, GIF and WebP images are accepted");
  }

  const stored = await storage.upload(randomUUID(), file.buffer);

  try {
    return await prisma.mediaAsset.create({
      data: {
        storageKey: stored.key,
        url: stored.url,
        width: stored.width,
        height: stored.height,
        originalFilename: file.originalname,
        mimeType: sniffed.mimeType,
        sizeBytes: file.size,
        uploadedByUserId: user.id,
      },
    });
  } catch (error) {
    // Don't leave an orphan in the bucket nobody can reference or clean
    // up (docs/27 step 2). A failure here is logged, not surfaced — the
    // caller's error is the database one.
    await storage.delete(stored.key).catch((cleanupError: unknown) => {
      // eslint-disable-next-line no-console
      console.error(
        JSON.stringify({
          time: new Date().toISOString(),
          level: "error",
          event: "media.orphan_cleanup_failed",
          key: stored.key,
          message: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
        }),
      );
    });
    throw error;
  }
}

export function listMedia(): Promise<MediaAsset[]> {
  return prisma.mediaAsset.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" } });
}

export async function deleteMedia(user: AuthenticatedUser, id: string): Promise<void> {
  const media = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!media || media.deletedAt) throw new NotFoundError("No such media asset");
  if (user.role !== "ADMIN" && media.uploadedByUserId !== user.id) {
    throw new ForbiddenError("You can only delete media you uploaded");
  }
  // Soft delete (BR-12) — never breaks a published article still
  // referencing this asset (docs/23 §14.3).
  await prisma.mediaAsset.update({ where: { id }, data: { deletedAt: new Date() } });
}
