import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl } from "@/lib/api/config";

/// The single generic authenticated proxy every CMS write (and the
/// sign-in form) goes through — docs/23 §4.4 "CMS writes" row: "Posted to
/// a Next.js server action or route handler, which calls the API — keeps
/// the session cookie httpOnly and first-party." This forwards method,
/// headers, and body verbatim to the real backend at the matching path,
/// then relays the response back. It adds no privilege of its own —
/// authorization is enforced entirely by the real backend on every
/// request, exactly as it would be if the browser could reach it directly;
/// this hop exists only so the browser never holds the backend's own
/// origin or cookie.
/// Headers that assert the request's origin. Anything a browser can set,
/// the API must not trust.
const FORWARDING_HEADERS = [
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-forwarded-port",
  "x-real-ip",
  "forwarded",
  "via",
];

/// Whether this app itself sits behind a proxy whose forwarding headers
/// can be believed. Matches the backend's TRUST_PROXY convention: unset or
/// 0 means "we are reached directly", and then nothing about the client
/// address is worth passing on. Set it in production to the same topology
/// the backend is configured for.
const TRUSTED_EDGE = Number(process.env.TRUST_PROXY ?? 0) > 0;

async function proxy(req: NextRequest, path: string[]): Promise<NextResponse> {
  const targetUrl = `${apiBaseUrl()}/${path.join("/")}${req.nextUrl.search}`;

  const headers = new Headers(req.headers);
  // Let fetch compute these correctly for the outgoing request; forwarding
  // the incoming values verbatim can otherwise mismatch the actual body
  // being sent (Next.js may have already buffered/altered it).
  headers.delete("host");
  headers.delete("content-length");

  // Strip every header that claims where the request came from. These
  // arrive from the browser and are trivially forged, and the API trusts
  // them when TRUST_PROXY is set: Express then reports the forged value as
  // req.ip, which is what the sign-in and password-reset rate limiters key
  // on (auth.router.ts). Left in place, an attacker could send a different
  // X-Forwarded-For on every request and never be limited at all.
  //
  // The real client address is re-attached below, from the value this
  // process actually observed.
  for (const header of FORWARDING_HEADERS) {
    headers.delete(header);
  }

  // What the platform in front of Next.js recorded — a CDN or load
  // balancer sets this, and Next exposes it as the request's IP. Absent
  // (a direct connection in development), nothing is sent and the API
  // falls back to the socket address.
  const clientIp = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (clientIp && TRUSTED_EDGE) {
    headers.set("x-forwarded-for", clientIp);
  }

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const backendRes = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: hasBody ? req.body : undefined,
    // Required by undici when streaming a body through fetch in Node.
    duplex: hasBody ? "half" : undefined,
    cache: "no-store",
  } as RequestInit);

  const responseHeaders = new Headers(backendRes.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.delete("transfer-encoding");
  // `set-cookie` is deleted above via the Headers copy already excluding
  // nothing — but Headers.get("set-cookie") is unreliable for multi-value
  // headers, so it's removed and re-added explicitly and correctly below.
  responseHeaders.delete("set-cookie");

  const response = new NextResponse(backendRes.body, {
    status: backendRes.status,
    headers: responseHeaders,
  });

  // Node's fetch (undici) makes Set-Cookie unavailable via the ordinary
  // Headers.get()/iteration API — .getSetCookie() is the multi-value-safe
  // method that actually returns it. This is the one place sign-in's
  // cookie would silently vanish if this used .get("set-cookie") instead.
  for (const cookie of backendRes.headers.getSetCookie()) {
    response.headers.append("set-cookie", cookie);
  }

  return response;
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  return proxy(req, (await ctx.params).path);
}
export async function POST(req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  return proxy(req, (await ctx.params).path);
}
export async function PATCH(req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  return proxy(req, (await ctx.params).path);
}
export async function DELETE(req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  return proxy(req, (await ctx.params).path);
}
