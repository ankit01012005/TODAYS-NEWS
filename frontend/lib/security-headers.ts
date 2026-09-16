/// The response headers every page and route handler of this app sends.
///
/// The API has sent these since it was written
/// (backend/src/common/middleware/security-headers.middleware.ts) — but the
/// API is not what a browser loads. Readers and staff load *this* app, and
/// it was sending none of them: no framing policy, no CSP, no HSTS, no
/// nosniff, and an `X-Powered-By` naming the framework. Every browser-side
/// protection the product had was therefore being applied to the one
/// surface no browser talks to.
///
/// Applied in next.config.ts via `headers()`, which covers pages, route
/// handlers and static assets alike.

/// Where the app legitimately loads things from. Anything not listed here
/// is refused by the browser, which is the point: an injected
/// `<script src="//evil.example/x.js">` cannot execute even if something
/// manages to put it in the page.
const CLOUDINARY = "https://res.cloudinary.com";
const YOUTUBE = "https://www.youtube-nocookie.com https://www.youtube.com";

/// Content-Security-Policy.
///
/// `script-src` keeps 'unsafe-inline': Next.js inlines its own bootstrap
/// and flight data into the document, and removing it requires
/// nonce-injecting middleware on every request. That is a worthwhile next
/// step, and it is the one directive here that is weaker than it could be
/// — but the policy still blocks the things that matter most even so:
/// script from any other origin, <object>/<embed>, a rewritten <base>, a
/// form posting to somebody else's server, and framing by anyone.
function contentSecurityPolicy(): string {
  return [
    "default-src 'self'",
    // next/font self-hosts its files under /_next/static, so no external
    // font origin is needed.
    "font-src 'self' data:",
    `img-src 'self' data: blob: ${CLOUDINARY}`,
    // Tailwind and Next both emit inline style attributes.
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline'",
    // The browser talks only to this origin: every API call is proxied
    // server-side through /api/backend (docs/23 §11.4), so the backend's
    // origin never needs to be reachable from a page.
    "connect-src 'self'",
    // /tv embeds bulletins from the channel.
    `frame-src ${YOUTUBE}`,
    // Clickjacking: nothing may frame this app. The session cookie is
    // SameSite=Lax, so a cross-site frame would not be authenticated
    // anyway — this is the second lock, and the one that keeps holding if
    // the cookie policy ever has to change.
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // Stops a downgrade to http for any subresource.
    "upgrade-insecure-requests",
  ].join("; ");
}

export function securityHeaders(): { key: string; value: string }[] {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy() },
    // Redundant with frame-ancestors for modern browsers, and the only
    // framing protection older ones understand.
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
    // Two years, subdomains included. Only meaningful over https — a
    // browser ignores it on a plain-http origin, so it is safe to send in
    // development too. `preload` is deliberately omitted: it is close to
    // irreversible and should be a conscious decision once the real domain
    // is live (docs/28 §3).
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
    { key: "X-DNS-Prefetch-Control", value: "off" },
  ];
}

/// Pages behind a session must never be stored by a shared browser or an
/// intermediary — the back button on a newsroom machine should not
/// resurface someone else's queue. The API already says this for its own
/// responses; this covers the HTML.
export function noStoreHeaders(): { key: string; value: string }[] {
  return [{ key: "Cache-Control", value: "no-store, must-revalidate" }];
}
