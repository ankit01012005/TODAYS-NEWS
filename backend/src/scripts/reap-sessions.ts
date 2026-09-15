/// One-off session cleanup, for a deployment that does not keep a
/// long-running process (a scheduled job, a container that runs and exits)
/// or for an operator who wants it done now rather than on the hour.
/// The API does the same thing hourly while it is running — see
/// common/session-reaper.ts for why the rows are kept for a window first.
///
///   npm run db:reap-sessions            30-day retention (the default)
///   npm run db:reap-sessions -- --days=7
import { prisma } from "../db";
import { reapExpiredSessions } from "../common/session-reaper";
import { logger } from "../common/logger";

async function main(): Promise<void> {
  const raw = process.argv.find((a) => a.startsWith("--days="))?.split("=")[1];
  const days = raw === undefined ? undefined : Number(raw);
  if (days !== undefined && (!Number.isFinite(days) || days < 0)) {
    process.stderr.write(`Invalid --days=${raw}\n`);
    process.exit(2);
  }

  const count = await reapExpiredSessions(days);
  logger.info("sessions.reaped", { count, retentionDays: days ?? 30 });
  await prisma.$disconnect();
}

void main().catch(async (error: unknown) => {
  logger.error("sessions.reap_failed", { err: error });
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});
