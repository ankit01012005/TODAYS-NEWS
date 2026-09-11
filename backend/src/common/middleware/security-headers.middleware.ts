import { NextFunction, Request, Response } from "express";

/// The response headers a JSON API should always send. A framing header
/// because /uploads serves files a browser will render; nosniff so a
/// crafted upload can never be reinterpreted as script; no-store on
/// everything behind a session so a shared machine's back button can't
/// resurface newsroom data (public routes set their own caching). Kept as
/// a dozen lines rather than a dependency: there is nothing here a
/// library would do differently for this API.
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Resource-Policy", req.path.startsWith("/uploads/") ? "cross-origin" : "same-origin");
  if (!req.path.startsWith("/public/") && !req.path.startsWith("/uploads/") && req.path !== "/health") {
    res.setHeader("Cache-Control", "no-store");
  }
  next();
}
