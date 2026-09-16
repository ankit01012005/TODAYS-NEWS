import {
  SESSION_CACHE_TTL_MS,
  cacheSession,
  clearSessionCache,
  evictSession,
  evictSessionsForUser,
  getCachedSession,
} from "./session-cache";

const alice = { id: "u-alice", email: "alice@example.com", displayName: "Alice", role: "EDITOR" as const };
const bob = { id: "u-bob", email: "bob@example.com", displayName: "Bob", role: "ADMIN" as const };
const farFuture = new Date(Date.now() + 60 * 60 * 1000);

describe("session cache", () => {
  beforeEach(() => clearSessionCache());

  it("returns what was cached while fresh", () => {
    cacheSession("hash-1", alice, farFuture);
    expect(getCachedSession("hash-1")?.user).toEqual(alice);
  });

  it("forgets an entry once the TTL has passed — a stale user is never served", () => {
    cacheSession("hash-1", alice, farFuture);
    expect(getCachedSession("hash-1", Date.now() + SESSION_CACHE_TTL_MS + 1)).toBeNull();
  });

  it("never serves a session past its own expiry, even inside the TTL", () => {
    cacheSession("hash-1", alice, new Date(Date.now() + 1_000));
    expect(getCachedSession("hash-1", Date.now() + 2_000)).toBeNull();
  });

  it("sign-out evicts exactly that token", () => {
    cacheSession("hash-1", alice, farFuture);
    cacheSession("hash-2", alice, farFuture);
    evictSession("hash-1");
    expect(getCachedSession("hash-1")).toBeNull();
    expect(getCachedSession("hash-2")?.user).toEqual(alice);
  });

  it("deactivation / role change / password change evict every session of that user only", () => {
    cacheSession("hash-1", alice, farFuture);
    cacheSession("hash-2", alice, farFuture);
    cacheSession("hash-3", bob, farFuture);
    evictSessionsForUser(alice.id);
    expect(getCachedSession("hash-1")).toBeNull();
    expect(getCachedSession("hash-2")).toBeNull();
    expect(getCachedSession("hash-3")?.user).toEqual(bob);
  });
});
