import { PrismaClient } from "@prisma/client";

/// A single shared client for the process. Prisma manages its own
/// connection pool internally and connects lazily on first query — there is
/// nothing to do at startup beyond constructing it once here. Call
/// disconnectDb() on graceful shutdown (see main.ts).
export const prisma = new PrismaClient();

export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect();
}
