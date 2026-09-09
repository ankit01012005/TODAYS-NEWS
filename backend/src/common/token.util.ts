import { randomBytes, createHash } from "crypto";

/// Session cookies and password-reset/invitation links both work the same
/// way: hand the caller an unguessable random value, store only its hash.
/// A leaked database row is then useless without the raw value that was
/// only ever sent to the one legitimate recipient.
export function generateOpaqueToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("hex");
  return { raw, hash: hashToken(raw) };
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
