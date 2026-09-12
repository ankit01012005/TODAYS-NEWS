import { timingSafeEqual } from "crypto";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { PUBLIC_CACHE_TAG } from "@/lib/api/public";

/// docs/27 B3 — called by the API (backend/src/cache/revalidate.ts) after
/// a story is published, corrected or withdrawn, so readers never see a
/// stale page for longer than one request. Authenticated by a shared
/// secret; the only thing it can do is drop cached public data, so the
/// worst a leaked secret buys is extra load on the API.
const ALLOWED_TAGS = new Set<string>([PUBLIC_CACHE_TAG]);

function secretMatches(header: string | null): boolean {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || !header?.startsWith("Bearer ")) return false;
  const given = Buffer.from(header.slice("Bearer ".length));
  const wanted = Buffer.from(expected);
  return given.length === wanted.length && timingSafeEqual(given, wanted);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!secretMatches(req.headers.get("authorization"))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let tags: unknown;
  try {
    tags = ((await req.json()) as { tags?: unknown }).tags;
  } catch {
    return NextResponse.json({ message: "Expected a JSON body" }, { status: 400 });
  }
  if (!Array.isArray(tags) || tags.length === 0 || !tags.every((t) => typeof t === "string" && ALLOWED_TAGS.has(t))) {
    return NextResponse.json({ message: "tags must list known cache tags" }, { status: 400 });
  }

  // expire: 0 — a withdrawn story must be gone on the very next request,
  // not served stale while a background refresh runs.
  for (const tag of tags as string[]) {
    revalidateTag(tag, { expire: 0 });
  }
  return NextResponse.json({ revalidated: tags, at: new Date().toISOString() });
}
