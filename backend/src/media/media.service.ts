import { randomUUID } from "crypto";
import { MediaAsset, RevisionState } from "@prisma/client";
import { prisma } from "../db";
import { storage } from "./storage";
import { sniffImageType } from "./image-sniff";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../common/http-errors";
import { AuthenticatedUser } from "../common/authenticated-user";
import { writeAudit } from "../common/audit";

/// SEC-10 — validated by content, stored under a generated key (never a
/// user-supplied filename, which prevents path traversal and overwriting).
/// The stored object's public URL is recorded on the row at upload time
/// and is the only image address the rest of the system ever uses. Only
/// metadata lives in the database — the bytes are Cloudinary's.
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
        // What is actually held, after the ingest transformation — not
        // the size of the upload that arrived.
        sizeBytes: stored.bytes ?? file.size,
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

/// Revisions readers can see or staff are still working on. A frozen
/// ARCHIVED/REJECTED revision may lose its image (the FK nulls it) — it is
/// history, not a page anyone is served.
const PROTECTED_STATES: RevisionState[] = ["PUBLISHED", "DRAFT", "IN_REVIEW", "CHANGES_REQUESTED", "APPROVED"];

export interface MediaUse {
  articleId: string;
  slug: string;
  state: string;
}

/// Where an asset is still in use: as a featured image, or inside the
/// body as an image block (JSONB containment on the block's mediaId).
async function findProtectedUses(mediaId: string): Promise<MediaUse[]> {
  const revisions = await prisma.articleRevision.findMany({
    where: {
      state: { in: PROTECTED_STATES },
      OR: [{ featuredImageId: mediaId }, { body: { array_contains: [{ type: "image", mediaId }] } }],
    },
    select: { articleId: true, state: true, article: { select: { slug: true } } },
  });
  return revisions.map((r) => ({ articleId: r.articleId, slug: r.article.slug, state: r.state }));
}

/// Removes the image for good — from Cloudinary (CDN copies purged) and
/// from the database. Refused while a live or in-progress story still
/// shows it, so a published page can never lose its picture to a media-
/// library click (docs/23 §14.3): take it out of the story first.
export async function deleteMedia(user: AuthenticatedUser, id: string): Promise<void> {
  const media = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!media || media.deletedAt) throw new NotFoundError("No such media asset");
  if (user.role !== "ADMIN" && media.uploadedByUserId !== user.id) {
    throw new ForbiddenError("You can only delete media you uploaded");
  }

  const uses = await findProtectedUses(id);
  if (uses.length > 0) {
    const slugs = Array.from(new Set(uses.map((u) => u.slug)));
    const who = slugs.length === 1 ? "a story" : `${slugs.length} stories`;
    throw new ConflictError(`This image is still used by ${who} (${slugs.join(", ")}). Remove it from the story first.`);
  }

  // Provider first: if this fails, nothing has changed and the row still
  // describes a real object. The reverse order would leave a dangling
  // object nobody can reach from the CMS.
  await storage.delete(media.storageKey);
  await prisma.$transaction(async (tx) => {
    await tx.mediaAsset.delete({ where: { id } });
    await writeAudit(tx, {
      actorUserId: user.id,
      entityType: "MediaAsset",
      entityId: id,
      action: "DELETE",
      metadata: { storageKey: media.storageKey, originalFilename: media.originalFilename, sizeBytes: media.sizeBytes },
    });
  });
}

export interface ReconcileResult {
  /// Rows removed because the provider no longer holds the object.
  removed: Array<{ id: string; storageKey: string; originalFilename: string | null }>;
  /// Stories that were showing one of those images — the featured-image
  /// pointer has been cleared by the database; body image blocks still
  /// carry the dead URL until someone edits the story.
  affectedStories: MediaUse[];
  checked: number;
}

/// Admin-only. Someone deleted images from the Cloudinary dashboard: the
/// database still lists them, so the picker offers them and pages render
/// a broken image. Compare and drop the rows whose object is gone.
export async function reconcileWithStorage(user: AuthenticatedUser): Promise<ReconcileResult> {
  const [keysAtProvider, rows] = await Promise.all([storage.listKeys(), listMedia()]);
  const missing = rows.filter((row) => !keysAtProvider.has(row.storageKey));

  const affected = new Map<string, MediaUse>();
  for (const row of missing) {
    for (const use of await findProtectedUses(row.id)) affected.set(`${use.articleId}:${use.state}`, use);
  }

  if (missing.length > 0) {
    await prisma.$transaction(async (tx) => {
      await tx.mediaAsset.deleteMany({ where: { id: { in: missing.map((m) => m.id) } } });
      for (const row of missing) {
        await writeAudit(tx, {
          actorUserId: user.id,
          entityType: "MediaAsset",
          entityId: row.id,
          action: "RECONCILE_REMOVED",
          metadata: { storageKey: row.storageKey, originalFilename: row.originalFilename },
        });
      }
    });
  }

  return {
    removed: missing.map((m) => ({ id: m.id, storageKey: m.storageKey, originalFilename: m.originalFilename })),
    affectedStories: Array.from(affected.values()),
    checked: rows.length,
  };
}
