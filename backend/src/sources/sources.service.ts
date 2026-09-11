import { ArticleRevision, Source } from "@prisma/client";
import { prisma } from "../db";
import { AuthenticatedUser } from "../common/authenticated-user";
import { ConflictError, ForbiddenError, NotFoundError } from "../common/http-errors";
import { assertOwnerOrAdmin } from "../articles/authorization";

const EDITABLE_STATES: ArticleRevision["state"][] = ["DRAFT", "CHANGES_REQUESTED"];

/// Editor creates a source; only admin may verify, edit or deactivate one
/// (docs/03 §2.3) — admin cannot author, so it does not create sources.
export function createSource(userId: string, name: string, description?: string): Promise<Source> {
  return prisma.source.create({ data: { name, description, createdByUserId: userId } });
}

export function listSources(): Promise<Source[]> {
  return prisma.source.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } });
}

export async function updateSource(id: string, input: { name?: string; description?: string }): Promise<Source> {
  try {
    return await prisma.source.update({ where: { id }, data: input });
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

async function loadEditableOpenRevision(user: AuthenticatedUser, articleId: string) {
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article || article.deletedAt) throw new NotFoundError("No such article");
  assertOwnerOrAdmin(user, article);

  const revision = await prisma.articleRevision.findFirst({ where: { articleId, openMarker: true } });
  if (!revision) throw new ConflictError("This article has no open revision");
  if (!EDITABLE_STATES.includes(revision.state)) {
    throw new ForbiddenError(`Cannot edit sources while the revision is in state ${revision.state}`);
  }
  return revision;
}

export async function attachSource(
  user: AuthenticatedUser,
  articleId: string,
  input: { sourceId: string; position: number; isPublic?: boolean; note?: string },
) {
  const revision = await loadEditableOpenRevision(user, articleId);
  const source = await prisma.source.findUnique({ where: { id: input.sourceId } });
  if (!source || source.deletedAt) throw new NotFoundError("No such source");

  // Same shape as listAttachedSources — the picker renders the source's
  // name straight from the response, so the relation must be included.
  return prisma.articleSource.create({
    data: {
      articleRevisionId: revision.id,
      sourceId: input.sourceId,
      position: input.position,
      isPublic: input.isPublic ?? true,
      note: input.note,
    },
    include: { source: true },
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

export async function detachSource(user: AuthenticatedUser, articleId: string, articleSourceId: string): Promise<void> {
  const revision = await loadEditableOpenRevision(user, articleId);
  const result = await prisma.articleSource.deleteMany({
    where: { id: articleSourceId, articleRevisionId: revision.id },
  });
  if (result.count === 0) throw new NotFoundError("No such source attachment");
}

function remapNotFound(error: unknown): unknown {
  if (error instanceof Error && "code" in error && (error as { code?: string }).code === "P2025") {
    return new NotFoundError("No such source");
  }
  return error;
}
