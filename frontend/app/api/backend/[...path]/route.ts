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
async function proxy(req: NextRequest, path: string[]): Promise<NextResponse> {
  const targetUrl = `${apiBaseUrl()}/${path.join("/")}${req.nextUrl.search}`;

  const headers = new Headers(req.headers);
  // Let fetch compute these correctly for the outgoing request; forwarding
  // the incoming values verbatim can otherwise mismatch the actual body
  // being sent (Next.js may have already buffered/altered it).
  headers.delete("host");
  headers.delete("content-length");

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
