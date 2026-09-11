import { Article } from "@prisma/client";
import { AuthenticatedUser } from "../common/authenticated-user";
import { NotFoundError } from "../common/http-errors";

/// docs/23 §12.1 — three checks, all must pass: capability (the route's
/// requireCapability middleware), ownership (this function), and state
/// legality (the transition functions themselves). Most authorisation bugs
/// come from checking one and forgetting the others.

/// OQ-05's narrow, consistently-assumed answer throughout the docs: an
/// editor may act only on their own articles. SEC-03: a story that exists
/// but isn't theirs must be indistinguishable from one that doesn't exist —
/// 404, never 403, so a guessed id can't be used to probe what other
/// editors are working on.
export function assertOwnerOrAdmin(user: AuthenticatedUser, article: Pick<Article, "ownerId">): void {
  if (user.role === "ADMIN") return;
  if (article.ownerId === user.id) return;
  throw new NotFoundError("No such article");
}
