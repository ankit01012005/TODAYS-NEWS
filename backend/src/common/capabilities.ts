import { UserRole } from "@prisma/client";

/// docs/03 §4.5: authorisation asks "may this user do X?", never "is this
/// user an admin?". This is the one place role -> capability is decided;
/// everywhere else (guards, services) only ever asks about a capability.
///
/// Capability names mirror the transition table (docs/04 §4, docs/11 §4) 1:1
/// so the Reviews domain (Phase 4C-2) can map each transition directly onto
/// one of these. Ownership ("is this THEIR article") is a separate check,
/// made by the service layer — never conflate the two (docs/23 §12.1).
///
/// Roles are a strict split, not a hierarchy: editors author, admin reviews
/// and manages — admin has no route to any authoring capability, by
/// construction, the same way editors have no route to any review:*
/// capability. This also means an admin can never own or author an article,
/// so BR-13 (self-approval) is structurally impossible and was removed
/// rather than kept as unreachable code (see migration
/// 20260911020000_admin_review_only_and_single_admin).
export type Capability =
  | "article:create"
  | "article:save"
  | "article:submit"
  | "article:withdraw"
  | "article:correct"
  | "article:view-any"
  | "review:request-changes"
  | "review:approve"
  | "review:reject"
  | "review:publish"
  | "review:unpublish"
  | "review:reopen"
  | "review:archive"
  | "review:restore"
  | "source:create"
  | "source:manage"
  | "category:manage"
  | "media:upload"
  | "user:manage"
  | "audit:view";

const EDITOR_CAPABILITIES: ReadonlySet<Capability> = new Set<Capability>([
  "article:create",
  "article:save",
  "article:submit",
  "article:withdraw",
  "article:correct",
  "source:create",
  "media:upload",
]);

/// docs/03 §2.3 (superseded) — admin is review-and-manage only, never an
/// author. BR-05 — editors have no route to any review:* capability, by
/// construction, not by omission; the converse now holds for admin too.
const ADMIN_CAPABILITIES: ReadonlySet<Capability> = new Set<Capability>([
  "article:view-any",
  "review:request-changes",
  "review:approve",
  "review:reject",
  "review:publish",
  "review:unpublish",
  "review:reopen",
  "review:archive",
  "review:restore",
  "source:manage",
  "category:manage",
  "user:manage",
  "audit:view",
]);

const CAPABILITIES_BY_ROLE: Readonly<Record<UserRole, ReadonlySet<Capability>>> = {
  EDITOR: EDITOR_CAPABILITIES,
  ADMIN: ADMIN_CAPABILITIES,
};

export function roleHasCapability(role: UserRole, capability: Capability): boolean {
  return CAPABILITIES_BY_ROLE[role].has(capability);
}
