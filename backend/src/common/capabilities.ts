import { UserRole } from "@prisma/client";

/// docs/03 §4.5: authorisation asks "may this user do X?", never "is this
/// user an admin?". This is the one place role -> capability is decided;
/// everywhere else (guards, services) only ever asks about a capability.
///
/// Capability names mirror the transition table (docs/04 §4, docs/11 §4) 1:1
/// so the Reviews domain (Phase 4C-2) can map each transition directly onto
/// one of these. Ownership ("is this THEIR article") is a separate check,
/// made by the service layer — never conflate the two (docs/23 §12.1).
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

/// docs/03 §2.3: admins can do everything an editor can, plus the
/// privileged actions. BR-05 — editors have no route to any review:*
/// capability, by construction, not by omission.
const ADMIN_CAPABILITIES: ReadonlySet<Capability> = new Set<Capability>([
  ...EDITOR_CAPABILITIES,
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
