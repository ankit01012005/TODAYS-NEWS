import { prisma } from "../db";
import { logger } from "./logger";

/// Nothing ever deleted a session row. Expired and revoked sessions stayed
/// in the table forever: on this database 7 of 9 rows were already dead
/// weight, and the ratio only moves one way — every sign-in adds a row and
/// nothing removes one. Left alone it is a slow leak in the table
/// sessionAuth reads on *every* authenticated request.
///
/// Retention rather than immediate deletion: a revoked session is evidence
/// ("was this account used after we locked it?"), so rows are kept for a
/// window and removed after it. Long-lived audit facts live in audit_logs,
/// which is append-only and untouched by this.
const RETENTION_DAYS = 30;
const INTERVAL_MS = 60 * 60 * 1000; // hourly

let timer: NodeJS.Timeout | null = null;

/// Deletes sessions that both ended (expired or revoked) and have been
/// finished for longer than the retention window. Returns the row count so
/// the scripted one-off run can report it.
export async function reapExpiredSessions(retentionDays = RETENTION_DAYS): Promise<number> {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const { count } = await prisma.session.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: cutoff } }, { revokedAt: { lt: cutoff } }],
    },
  });
  return count;
}

/// Started from main.ts once the server is listening. Failures are logged
/// and the schedule continues — a database hiccup must never take the API
/// down, and the next run an hour later does the same work.
export function startSessionReaper(): void {
  if (timer) return;

  const run = (): void => {
    reapExpiredSessions()
      .then((count) => {
        // Only worth a line when it actually did something.
        if (count > 0) logger.info("sessions.reaped", { count, retentionDays: RETENTION_DAYS });
      })
      .catch((error: unknown) => {
        logger.warn("sessions.reap_failed", { err: error });
      });
  };

  timer = setInterval(run, INTERVAL_MS);
  // Do not hold the event loop open: shutdown should not wait an hour.
  timer.unref();
  run();
}

export function stopSessionReaper(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
