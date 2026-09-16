import { AuthenticatedUser } from "./authenticated-user";

/// A small in-process cache in front of the session lookup sessionAuth
/// makes on EVERY authenticated request. The database is remote (Neon,
/// another continent from the newsroom): each round trip costs ~250 ms,
/// and a single CMS page fans out into half a dozen API calls — so without
/// this, the session check alone adds more than a second per screen.
///
/// SEC-05's "revocation takes effect immediately" is kept two ways: the
/// entry is short-lived (SESSION_CACHE_TTL_MS), AND every code path that
/// ends or changes a session — sign-out, deactivation, role change,
/// password change — evicts it explicitly (see the callers of
/// evictSessionsForUser / evictSession). The TTL only bounds what a
/// path that forgot to evict could leak, and expiry (expiresAt) is still
/// checked on every hit, never trusted to the cache.
///
/// One process, one Map: the API runs as a single instance (docs/27 §
/// architecture). A second instance would need this replaced with a
/// shared store — the interface here is small enough that swapping it is
/// a one-file change.
export const SESSION_CACHE_TTL_MS = 30_000;
const MAX_ENTRIES = 5_000;

interface CachedSession {
  user: AuthenticatedUser;
  expiresAt: Date;
  cachedAt: number;
}

const byTokenHash = new Map<string, CachedSession>();

export function getCachedSession(tokenHash: string, now: number = Date.now()): CachedSession | null {
  const entry = byTokenHash.get(tokenHash);
  if (!entry) return null;
  if (now - entry.cachedAt > SESSION_CACHE_TTL_MS || entry.expiresAt.getTime() <= now) {
    byTokenHash.delete(tokenHash);
    return null;
  }
  return entry;
}

export function cacheSession(tokenHash: string, user: AuthenticatedUser, expiresAt: Date): void {
  if (byTokenHash.size >= MAX_ENTRIES) {
    // Bounded: drop the oldest insertion rather than grow without limit.
    const oldest = byTokenHash.keys().next().value;
    if (oldest !== undefined) byTokenHash.delete(oldest);
  }
  byTokenHash.set(tokenHash, { user, expiresAt, cachedAt: Date.now() });
}

/// Sign-out: the one token being revoked.
export function evictSession(tokenHash: string): void {
  byTokenHash.delete(tokenHash);
}

/// Deactivation, role change, password change: every session the person
/// holds, since the cached `user` (role, status) is what's now stale.
export function evictSessionsForUser(userId: string): void {
  for (const [key, entry] of byTokenHash) {
    if (entry.user.id === userId) byTokenHash.delete(key);
  }
}

export function clearSessionCache(): void {
  byTokenHash.clear();
}
