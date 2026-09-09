/// PRF-06, SCL-01 — keyset (cursor) pagination over published articles;
/// offset pagination degrades as the archive grows. The cursor is the last
/// item's (publishedAt, id) tuple, opaque to the caller.
export interface Cursor {
  publishedAt: string;
  id: string;
}

export function encodeCursor(c: Cursor): string {
  return Buffer.from(JSON.stringify(c)).toString("base64url");
}

export function decodeCursor(raw: string | undefined): Cursor | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (typeof parsed.publishedAt === "string" && typeof parsed.id === "string") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
