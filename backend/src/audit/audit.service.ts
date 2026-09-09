import { AuditLog } from "@prisma/client";
import { prisma } from "../db";
import { AuthenticatedUser } from "../common/authenticated-user";
import { NotFoundError } from "../common/http-errors";
import { assertOwnerOrAdmin } from "../articles/authorization";

/// CAP-15, SEC-11 — read-only. INSERT/SELECT-only at the database
/// privilege level is DM-10; there is no update/delete path at any layer.
export function listAudit(options: { limit: number; offset: number }): Promise<AuditLog[]> {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: options.limit,
    skip: options.offset,
  });
}

/// docs/11 §6 — an editor may view their OWN article's history; an admin
/// may view any (unlike the global feed above, which is admin-only).
export async function listAuditForArticle(user: AuthenticatedUser, articleId: string): Promise<AuditLog[]> {
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article || article.deletedAt) throw new NotFoundError("No such article");
  assertOwnerOrAdmin(user, article);

  return prisma.auditLog.findMany({ where: { articleId }, orderBy: { createdAt: "asc" } });
}
