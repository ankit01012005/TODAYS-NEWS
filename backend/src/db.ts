import { PrismaClient } from "@prisma/client";

/// A single shared client for the process. Prisma manages its own
/// connection pool internally and connects lazily on first query — there is
/// nothing to do at startup beyond constructing it once here. Call
/// disconnectDb() on graceful shutdown (see main.ts).
///
/// transactionOptions: every workflow transition is an interactive
/// transaction of 6–10 statements. Against a remote database (~250 ms per
/// round trip from here to Neon) that is 2–3 s of pure latency, and a
/// cold compute adds more — Prisma's default 5 s budget aborted a purge
/// mid-way with "Transaction not found". 30 s is a ceiling, not a target.
export const prisma = new PrismaClient({
  transactionOptions: { maxWait: 10_000, timeout: 30_000 },
});

export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect();
}
