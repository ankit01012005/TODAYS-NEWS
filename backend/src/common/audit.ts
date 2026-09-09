import { Prisma } from "@prisma/client";

type TxClient = Prisma.TransactionClient;

/// CAP-15, SEC-11 — every transition writes its audit row inside the same
/// transaction as the state change (docs/23 §5.3 step 8): publication must
/// never succeed while its record fails.
export function writeAudit(
  tx: TxClient,
  entry: {
    actorUserId: string;
    entityType: string;
    entityId: string;
    action: string;
    articleId?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<unknown> {
  return tx.auditLog.create({
    data: {
      actorUserId: entry.actorUserId,
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      articleId: entry.articleId,
      metadata: entry.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}
