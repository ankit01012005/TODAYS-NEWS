import { SetMetadata } from "@nestjs/common";
import { Capability } from "../capabilities";

export const CAPABILITY_KEY = "requiredCapability";

/// Applied to a route handler; CapabilityGuard reads this metadata and
/// checks it against the signed-in user's role. Ask "may this user do X?" —
/// never spell out a role name at the call site (docs/03 §4.5).
export const RequireCapability = (capability: Capability) =>
  SetMetadata(CAPABILITY_KEY, capability);
