import { randomUUID } from "crypto";
import { MediaAsset } from "@prisma/client";
import { prisma } from "../db";
import { storage } from "./storage";
import { sniffImageType } from "./image-sniff";
import { BadRequestError, ForbiddenError, NotFoundError } from "../common/http-errors";
import { AuthenticatedUser } from "../common/authenticated-user";

/// SEC-10 — validated by content, stored under a generated key (never a
/// user-supplied filename, which prevents path traversal and overwriting).
export async function uploadMedia(
  user: AuthenticatedUser,
  file: { buffer: Buffer; originalname: string; size: number },
): Promise<MediaAsset> {
  const sniffed = sniffImageType(file.buffer);
  if (!sniffed) {
    throw new BadRequestError("Only JPEG, PNG, GIF and WebP images are accepted");
  }

  const key = `${randomUUID()}.${sniffed.extension}`;
  await storage.save(key, file.buffer);

  return prisma.mediaAsset.create({
    data: {
      storageKey: key,
      originalFilename: file.originalname,
      mimeType: sniffed.mimeType,
      sizeBytes: file.size,
      uploadedByUserId: user.id,
    },
  });
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
