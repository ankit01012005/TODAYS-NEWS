import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

/// Marks a route as reachable without a session — sign-in itself, and
/// (Phase 4C-3) the public read endpoints. SessionAuthGuard checks this
/// first and skips authentication entirely when present.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
