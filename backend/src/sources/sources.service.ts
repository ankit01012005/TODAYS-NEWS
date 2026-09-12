import { ArticleRevision, Prisma, Source } from "@prisma/client";
import { prisma } from "../db";
import { AuthenticatedUser } from "../common/authenticated-user";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../common/http-errors";
import { assertOwnerOrAdmin } from "../articles/authorization";
import { isSafeHref } from "../articles/body.util";

const EDITABLE_STATES: ArticleRevision["state"][] = ["DRAFT", "CHANGES_REQUESTED"];

/// Editor creates a source; only admin may verify, edit or deactivate one
/// (docs/03 §2.3) — admin cannot author, so it does not create sources.
export function createSource(
  userId: string,
  name: string,
  description?: string,
  url?: string,
): Promise<Source> {
  return prisma.source.create({
    data: { name, description, url: normaliseSourceUrl(url), createdByUserId: userId },
  });
}

/// An absolute http(s) address or nothing. The same allow-list body links
/// use (no javascript:/data:, no whitespace); a relative path makes no
/// sense for a source, so those are refused too.
function normaliseSourceUrl(url: string | undefined): string | null | undefined {
  if (url === undefined) return undefined;
  const trimmed = url.trim();
  if (trimmed === "") return null;
  if (!/^https?:\/\//i.test(trimmed) || !isSafeHref(trimmed)) {
    throw new BadRequestError("url must be a full http(s) address");
  }
  return trimmed;
}

export function listSources(): Promise<Source[]> {
  return prisma.source.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } });
}

export async function updateSource(
  id: string,
  input: { name?: string; description?: string; url?: string },
): Promise<Source> {
  try {
    return await prisma.source.update({
      where: { id },
      data: { name: input.name, description: input.description, url: normaliseSourceUrl(input.url) },
    });
  } catch (error) {
    throw remapNotFound(error);
  }
}

export async function verifySource(id: string, verifiedByUserId: string): Promise<Source> {
  try {
    return await prisma.source.update({
      where: { id },
      data: { verified: true, verifiedByUserId, verifiedAt: new Date() },
    });
  } catch (error) {
    throw remapNotFound(error);
  }
}

/// Never hard-deleted while cited (docs/26 §4.1) — soft delete only. Old
/// citations on already-published revisions keep working; the source just
/// stops being offered for new attachments.
export async function deactivateSource(id: string): Promise<Source> {
  try {
    return await prisma.source.update({ where: { id }, data: { deletedAt: new Date() } });
  } catch (error) {
    throw remapNotFound(error);
  }
}

type TxClient = Prisma.TransactionClient;

async function loadEditableOpenRevision(tx: TxClient, user: AuthenticatedUser, articleId: string) {
  const article = await tx.article.findUnique({ where: { id: articleId } });
  if (!article || article.deletedAt) throw new NotFoundError("No such article");
  assertOwnerOrAdmin(user, article);

  const revision = await tx.articleRevision.findFirst({ where: { articleId, openMarker: true } });
  if (!revision) throw new ConflictError("This article has no open revision");
  if (!EDITABLE_STATES.includes(revision.state)) {
    throw new ForbiddenError(`Cannot edit sources while the revision is in state ${revision.state}`);
  }
  return revision;
}

/// docs/27 A3 — a citation change is a change to the revision. The same
/// guarded write saving uses (WHERE version = what the caller saw) makes a
/// request that lands after the story entered review fail cleanly, and
/// bumps the revision's version (database trigger) so the admin never
/// reviews a citation list that changed underneath them. The write itself
/// is a no-op column touch — the trigger does the actual bump.
async function bumpRevisionGuarded(tx: TxClient, revision: ArticleRevision, expectedVersion: number): Promise<number> {
  const result = await tx.articleRevision.updateMany({
    where: { id: revision.id, version: expectedVersion },
    data: { createdByUserId: revision.createdByUserId },
  });
  if (result.count === 0) {
    throw new ConflictError("This article has changed since you last loaded it. Please refresh and try again.");
  }
  const bumped = await tx.articleRevision.findUniqueOrThrow({ where: { id: revision.id }, select: { version: true } });
  return bumped.version;
}

export async function attachSource(
  user: AuthenticatedUser,
  articleId: string,
  input: { version: number; sourceId: string; position: number; isPublic?: boolean; note?: string },
) {
  return prisma.$transaction(async (tx) => {
    const revision = await loadEditableOpenRevision(tx, user, articleId);
    const source = await tx.source.findUnique({ where: { id: input.sourceId } });
    if (!source || source.deletedAt) throw new NotFoundError("No such source");

    const revisionVersion = await bumpRevisionGuarded(tx, revision, input.version);

    // Same shape as listAttachedSources — the picker renders the source's
    // name straight from the response, so the relation must be included.
    const attached = await tx.articleSource.create({
      data: {
        articleRevisionId: revision.id,
        sourceId: input.sourceId,
        position: input.position,
        isPublic: input.isPublic ?? true,
        note: input.note,
      },
      include: { source: true },
    });
    return { ...attached, revisionVersion };
  });
}

export async function listAttachedSources(user: AuthenticatedUser, articleId: string) {
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article || article.deletedAt) throw new NotFoundError("No such article");
  assertOwnerOrAdmin(user, article);

  const revision = await prisma.articleRevision.findFirst({ where: { articleId, openMarker: true } });
  if (!revision) return [];
  return prisma.articleSource.findMany({
    where: { articleRevisionId: revision.id },
    orderBy: { position: "asc" },
    include: { source: true },
  });
}

export async function detachSource(
  user: AuthenticatedUser,
  articleId: string,
  articleSourceId: string,
  version: number,
): Promise<{ revisionVersion: number }> {
  return prisma.$transaction(async (tx) => {
    const revision = await loadEditableOpenRevision(tx, user, articleId);
    const revisionVersion = await bumpRevisionGuarded(tx, revision, version);
    const result = await tx.articleSource.deleteMany({
      where: { id: articleSourceId, articleRevisionId: revision.id },
    });
    if (result.count === 0) throw new NotFoundError("No such source attachment");
    return { revisionVersion };
  });
}

function remapNotFound(error: unknown): unknown {
  if (error instanceof Error && "code" in error && (error as { code?: string }).code === "P2025") {
    return new NotFoundError("No such source");
  }
  return error;
}
