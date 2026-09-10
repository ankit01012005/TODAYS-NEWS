import { Category } from "@prisma/client";
import { prisma } from "../db";
import { ConflictError, NotFoundError } from "../common/http-errors";

/// The exact text the P2-21 trigger (Phase 4B migration.sql) raises. Caught
/// here so the raw Postgres exception never reaches a client (SEC-06).
const LIVE_ARTICLES_MARKER = "published article references it";

export async function createCategory(name: string, slug: string): Promise<Category> {
  try {
    return await prisma.category.create({ data: { name, slug } });
  } catch (error) {
    throw remapUniqueViolation(error);
  }
}

export function listCategories(): Promise<Category[]> {
  return prisma.category.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } });
}

export async function updateCategory(
  id: string,
  input: { name?: string; slug?: string },
): Promise<Category> {
  try {
    return await prisma.category.update({ where: { id }, data: input });
  } catch (error) {
    throw remapNotFound(remapUniqueViolation(error));
  }
}

/// P2-21 — a category cannot be deactivated while a LIVE article
/// references it. The Phase 4B database trigger enforces this; here it's
/// remapped to a clean 409.
export async function deactivateCategory(id: string): Promise<Category> {
  try {
    return await prisma.category.update({ where: { id }, data: { deletedAt: new Date() } });
  } catch (error) {
    if (error instanceof Error && error.message.includes(LIVE_ARTICLES_MARKER)) {
      throw new ConflictError(
        "This category cannot be deactivated while a published article still references it (P2-21).",
      );
    }
    throw remapNotFound(error);
  }
}

function remapNotFound(error: unknown): unknown {
  if (error instanceof Error && "code" in error && (error as { code?: string }).code === "P2025") {
    return new NotFoundError("No such category");
  }
  return error;
}

function remapUniqueViolation(error: unknown): unknown {
  if (error instanceof Error && "code" in error && (error as { code?: string }).code === "P2002") {
    return new ConflictError("A category with this address already exists");
  }
  return error;
}
