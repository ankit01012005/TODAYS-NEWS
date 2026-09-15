# 29 — Security posture

**Status:** living document. Reviewed 2026-09-15 against the code at that
date. It records what is defended, *how*, and — more usefully — what is
**not** defended and why.

No system is "protected from attackers in any possible way", and a
document claiming otherwise would be worse than none. What follows is the
honest shape of the thing: a small, invite-only newsroom CMS with a public
read-only site, hardened against the attacks that class of application
actually gets, with the residual risks named.

---

## 1. Attack surface

| Surface | Reachable by | Notes |
|---|---|---|
| Public site (`/`, `/[category]`, `/[category]/[slug]`, `/tv`, `/search`, static pages, `feed.xml`, `sitemap.xml`, `robots.txt`) | Anyone | Read-only. No form on it posts anywhere — each composes a `mailto:` instead. |
| CMS (`/staff/*`) | Authenticated staff | Invite-only; there is no sign-up route to attack. |
| Write proxy (`/api/backend/*`) | Any browser | Same-origin only. Adds **no** privilege: the API re-authorises every request. |
| Revalidation hook (`/api/revalidate`) | Anyone who knows the secret | Can only drop cached public data. Worst case: extra load. |
| Express API (`:3001`) | The Next.js server | **Should not have a public hostname.** The browser never calls it (docs/23 §11.4). |
| PostgreSQL, Cloudinary, SMTP | The API only | Credentials in the platform's secret store. |

---

## 2. What is defended, and by what

### Authentication and sessions
- Opaque 256-bit random session tokens; only a SHA-256 hash is stored, so
  a leaked database row is not a usable credential.
- Passwords hashed with **argon2id**. Minimum 12 characters.
- Sign-in failures are indistinguishable — unknown email, wrong password
  and a deactivated account return one message, and a dummy hash is
  computed for the unknown-user path so response timing does not reveal
  which it was (P2-11).
- Sessions are server-side and individually revocable (SEC-05), never
  JWTs. Deactivating a user revokes **every** session in the same
  transaction; any password change revokes every *other* session.
- Set-password tokens (invitation and reset share one mechanism) are
  single-use, consumed by one conditional `UPDATE`, so two requests racing
  the same link cannot both succeed.
- Session cookie: `httpOnly`, `SameSite=Lax`, `Secure` in production,
  `path=/`. The browser holds only the first-party cookie; it never sees
  the API's origin.
- Expired and revoked sessions are deleted after a 30-day retention window
  (`common/session-reaper.ts`).

### Authorization
- **Deny by default**: `app.ts` mounts `sessionAuth` once, and every router
  registered after it is protected. A new router that forgets to opt in is
  protected, which is the safe direction.
- Capabilities are a strict role split, not a hierarchy — an admin has no
  authoring capability and an editor has no review capability
  (`common/capabilities.ts`). Publication requires an admin (BR-02/BR-05).
- The frontend's `requireRole` is UI routing only; the API re-checks every
  request. Nothing is enforced solely in the browser.

### Input handling
- Every request body goes through a `class-validator` DTO before a service
  sees it.
- Article bodies are **structured JSON with an allowlist of six block
  types**, never HTML. `isSafeHref` rejects anything that is not
  `http(s)`/relative/fragment and rejects whitespace and control
  characters, which is how `java\nscript:` gets smuggled past prefix
  checks.
- The frontend renders that structure as React elements. The only
  `dangerouslySetInnerHTML` in the app is the JSON-LD block, with `<`
  escaped.
- Uploads: 10 MB cap, magic-byte sniffing against a JPEG/PNG/GIF/WebP
  allowlist, generated filenames. **SVG is deliberately not accepted** — it
  is a script-execution vector.
- All database access is through Prisma's parameterised queries. The two
  raw calls are a constant `SET LOCAL` string and the verification
  script's own literal SQL; neither interpolates user input.

### Browser-side (added 2026-09-15)
The API had sent security headers since it was written — but the API is
not what a browser loads. The Next.js app was sending **none**. It now
sends, on every response (`frontend/lib/security-headers.ts`):

- `Content-Security-Policy` — `default-src 'self'`, `object-src 'none'`,
  `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`,
  images limited to self + Cloudinary, frames to the YouTube embed hosts.
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`, `Permissions-Policy`,
  `Strict-Transport-Security` (2 years, subdomains).
- `Cache-Control: no-store` on `/staff/*` and `/api/backend/*`.
- `X-Powered-By` removed.

### Abuse and transport
- Sign-in and password-reset are rate limited per **IP + targeted
  account** — keying on IP alone would lock the whole newsroom out
  together, since every request reaches the API from one server.
- The write proxy strips client-supplied `X-Forwarded-*`, `X-Real-IP`,
  `Forwarded` and `Via` before calling the API, and only re-attaches a
  client address when `TRUST_PROXY` says there is a trustworthy edge in
  front. Without this a caller could forge a different address on every
  request and never be rate limited (fixed 2026-09-15).
- CORS is **off** unless `CORS_ORIGINS` is set explicitly; never a
  reflected origin with credentials.
- Request body capped at 512 kB; server keep-alive, header and request
  timeouts set so a slow client cannot hold a worker through a deploy.

### Records
- `audit_logs` and `review_decisions` are **append-only, enforced by
  database triggers** — not by application convention. The application's
  own database role cannot rewrite history.
- BR-14 (active admin count), slug immutability after publication, and the
  one-open/one-published-revision invariants are likewise triggers and
  constraints, so they hold against anything that reaches the database.
- `npm run db:verify -- --stage=post` asserts every one of those objects
  is still installed; CI runs it on a database migrated from empty.

### Secrets
- No credential is committed. `.env*` is git-ignored except the examples.
- Logs redact any value whose key names a credential, at any depth, before
  the line is written; stacks are suppressed in production by default.
- Error responses never carry a stack or a raw database error.

---

## 3. Residual risk — what is NOT defended

Ordered by what a real attacker would try first.

1. **No multi-factor authentication.** A stolen or phished staff password
   is full access for that role. For an admin that means publishing and
   withdrawing stories. This is the single largest gap; it needs a product
   decision (TOTP is the cheap option).
2. **`script-src` still allows `'unsafe-inline'`.** Next.js inlines its own
   bootstrap and flight data; removing it needs nonce-injecting middleware
   on every request. The CSP therefore does not fully stop an injected
   *inline* script — though the content pipeline gives one no way in, and
   every other CSP directive still applies.
3. **No brute-force protection beyond rate limiting.** No account lockout,
   no CAPTCHA, no notification on repeated failures. 10 attempts per 15
   minutes per IP+account is slow, not impossible, against a weak password.
4. **The in-process rate limiter and session cache do not survive a second
   API instance** (docs/27 C1). Two instances double the sign-in
   allowance. Close C1 before scaling out.
5. **No intrusion detection or alerting.** The logs now distinguish the
   events that matter (`docs/28` §7) but nothing watches them. Repeated
   403s or a spike in 401s would go unnoticed (docs/27 C4).
6. **Uploads are not re-encoded.** Signature-checked, but a malformed file
   that passes the magic-byte check is stored as-is and served from the
   CDN. Decode-and-re-encode on ingest is docs/27 C5.
7. **No dependency scanning in CI.** `npm audit` is run by hand. As of
   2026-09-15 the frontend has zero advisories and the backend has three
   highs, all in the **Prisma CLI** — a devDependency, absent from the
   runtime image, and not reachable by any request.
8. **Email delivery is fire-and-forget.** A failed password-reset mail is
   logged, not retried (docs/27 C6). Account recovery is therefore
   best-effort.
9. **One active admin (BR-14).** A security control that is also an
   availability risk: if that account is lost, nobody can publish or
   manage staff. See docs/27 D1.
10. **Some staff endpoints return raw database models.** `/categories`,
    `/sources`, `/media` and the staff social-pick list return Prisma
    models directly rather than a shaped view, so a column added to the
    schema later is exposed to the CMS automatically. Every one of them is
    behind `sessionAuth` and a capability check, and none currently
    carries a secret — but the *public* routes are all explicitly shaped
    (`public.view.ts`, `social.view.ts`), and these should be too before
    any sensitive column is added.
11. **Everything below the application.** Host patching, network exposure,
    database credentials, DNS and TLS, backup encryption, and who has
    access to the hosting and Cloudinary accounts are operator
    responsibilities this repository cannot enforce.

---

## 4. Operator obligations

The code cannot do these for you:

- Do **not** give the Express API a public hostname. Nothing but the
  Next.js server needs to reach it.
- Connect to PostgreSQL as a **non-superuser** — a superuser can disable
  the triggers that hold the editorial invariants. `db:verify --stage=pre`
  fails on this in production.
- Enforce TLS everywhere, and set `TRUST_PROXY` on both apps to the real
  number of hops.
- Keep `REVALIDATE_SECRET` and the database URL in a secret manager, not
  in a file on the host.
- Rotate any credential that has ever been written into a document or a
  chat.
- Never share a staff login. Every action is attributed to an account, and
  the audit trail is only as truthful as that.
