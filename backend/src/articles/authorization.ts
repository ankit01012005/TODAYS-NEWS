import { Article, ArticleRevision } from "@prisma/client";
import { AuthenticatedUser } from "../common/authenticated-user";
import { ForbiddenError, NotFoundError } from "../common/http-errors";

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

/// BR-13 — an admin may not approve or publish an article they own or last
/// revised. This is a pre-check for a clean, specific error message; the
/// BR-14-style database trigger from Phase 4B is the defense-in-depth
/// backstop if this is ever bypassed or has a bug.
export function assertNotSelfApproval(
  user: AuthenticatedUser,
  article: Pick<Article, "ownerId">,
  revision: Pick<ArticleRevision, "createdByUserId">,
): void {
  if (user.id === article.ownerId || user.id === revision.createdByUserId) {
    throw new ForbiddenError(
      "You cannot approve or publish an article you own or last revised (BR-13). A different admin must review it.",
    );
  }
}
