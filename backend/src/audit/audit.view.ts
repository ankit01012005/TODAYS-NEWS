import { AuditLog } from "@prisma/client";

/// PG-ADM-05 (Article history) needs "who did what, when" — not a bare
/// actorUserId. Explicit response shape, same discipline as
/// articles/article.view.ts: nothing here silently changes if a column is
/// added to the table later.
export interface AuditLogView {
  id: string;
  actorUserId: string | null;
  actorDisplayName: string | null;
  entityType: string;
  entityId: string;
  action: string;
  articleId: string | null;
  metadata: unknown;
  createdAt: Date;
}

export function toAuditLogView(entry: AuditLog & { actor: { displayName: string } | null }): AuditLogView {
  return {
    id: entry.id,
    actorUserId: entry.actorUserId,
    actorDisplayName: entry.actor?.displayName ?? null,
    entityType: entry.entityType,
    entityId: entry.entityId,
    action: entry.action,
    articleId: entry.articleId,
    metadata: entry.metadata,
    createdAt: entry.createdAt,
  };
}
