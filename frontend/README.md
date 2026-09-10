# Today_news — Frontend

The public news site and the staff CMS (Editor + Admin), both in one
Next.js App Router app. Next.js 16 + React 19 + Tailwind CSS 4, built on
the Direction A ("Broadsheet") design system — see `../docs/19-design-system.md`
and `../docs/20-visual-direction.md`.

This app never talks to the backend directly from the browser — see
Architecture below.

## Tech stack

| Layer      | Choice                                              |
| ---------- | ---------------------------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack)                   |
| UI         | React 19                                             |
| Styling    | Tailwind CSS 4 (`@theme` tokens, no component library) |
| Language   | TypeScript 5.9                                       |
| Lint       | ESLint 9 (`eslint-config-next`)                      |

## Prerequisites

- Node.js 20+ (Node 24 recommended)
- The [backend API](../backend/README.md) running and reachable — this
  app has no data of its own.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in real values
npm run dev
```

Opens on `http://localhost:3000` by default. The public site is the
homepage and everything under it (`/`, `/{category}`, `/{category}/{slug}`,
`/about`, etc.); the CMS lives under `/staff` (`/staff/sign-in` is the
entry point — there is no public sign-up, see the backend's docs). The
CMS covers both roles: an editor writing and submitting stories, and an
admin reviewing/publishing them and running the newsroom (users,
sources, categories).

The site will look bare with a freshly migrated, unseeded database —
run the backend's `npm run db:bootstrap-admin` for a sign-in-able
account and `npm run db:seed-demo-content` for ~28 realistic published
articles across 7 sections before judging how any page actually looks.

## Environment variables

| Variable        | Required | Example                  | Notes                                                                                   |
| ---------------- | -------- | -------------------------- | ------------------------------------------------------------------------------------------ |
| `API_BASE_URL`   | Yes      | `http://localhost:3001`    | The backend's origin. **Never** prefixed `NEXT_PUBLIC_*` — the browser must never see it directly (docs/23 §11.4). Also used by `next.config.ts` to rewrite `/uploads/*` to the backend. |
| `SITE_URL`       | Yes      | `http://localhost:3000`    | This app's own public origin — used to build absolute URLs in `sitemap.ts`, `robots.ts` and `feed.xml` |

Copy `.env.example` to `.env.local`; that file is git-ignored.

## Scripts

| Script              | What it does                              |
| --------------------- | -------------------------------------------- |
| `npm run dev`          | Next.js dev server (Turbopack)               |
| `npm run build`        | Production build                             |
| `npm start`            | Serves the production build (run after `build`) |
| `npm run lint`         | `eslint .`                                    |
| `npm run typecheck`    | `tsc --noEmit`                                |

## Project structure

```
app/
  page.tsx, [category]/, [category]/[slug]/   # Public site
  sitemap.ts, robots.ts, feed.xml/              # SEO surfaces
  staff/                                         # The CMS (Editor + Admin), under /staff
    sign-in/, forgot-password/, accept-invitation/, access-denied/
    page.tsx                                     # Dashboard — branches by role (editor vs. admin)
    articles/, articles/new/, articles/[id]/edit/, articles/[id]/preview/
    articles/[id]/history/                        # Admin-only: full audit + review-decision timeline
    review/, review/[id]/                          # Admin-only: review queue + article review (approve/reject/request-changes)
    users/, sources/, categories/                  # Admin-only: newsroom management, each one page with inline actions
    profile/
  api/backend/[...path]/route.ts                 # The one generic authenticated proxy — see below
components/
  public/    # Article rendering shared between the public site AND the CMS preview page
  cms/       # Shared CMS UI — Button (deliberately no `publish` variant, BR-05),
             # StatusBadge, Tabs, Alert, ConfirmAction (the two-step confirm used by
             # publish/reject/withdraw), the article editor, and the admin
             # management panels (UsersManager, SourcesManager, CategoriesManager,
             # ArticleReviewActions, AdminDashboard)
  layout/    # Public site header/footer
lib/
  format-date.ts                  # Shared relative/absolute date formatting
  api/
    public.ts, public-types.ts     # Public-read fetchers (no auth)
    session.ts, cms.ts, cms-types.ts, auth-types.ts   # Server-side authenticated reads
    client-fetch.ts, upload-media.ts, body-blocks.ts, media-url.ts   # Client-side write helpers
```

## Architecture: how this app talks to the backend

There is a hard rule behind this app's data layer (`docs/23-architecture-discovery.md`
§11.4): **the browser never talks to the backend directly.** Two paths,
depending on whether it's a read or a write:

- **Reads**, both public and CMS, happen in Server Components. They call
  the backend directly (`lib/api/public.ts` for public pages,
  `lib/api/session.ts`'s `authFetch()` + `lib/api/cms.ts` for the CMS,
  forwarding the browser's own session cookie along). This keeps reads
  fast and always-fresh (`cache: "no-store"` for CMS reads) without ever
  exposing the backend's origin to client-side JS.
- **Writes** — sign-in, saving an article, uploading media, everything
  under `/staff` that mutates something — happen in Client Components,
  which call `lib/api/client-fetch.ts`'s `clientFetch()`. That hits this
  app's own `/api/backend/[...path]` route handler, a single generic
  proxy that forwards the request (method, headers, body — including
  multipart uploads) to the real backend and relays the response back,
  **critically including `Set-Cookie`** via `Response.headers.getSetCookie()`
  (not `.get("set-cookie")`, which Node's `fetch` makes unreliable for
  multi-value headers — this is the one place a naive proxy would
  silently break sign-in).

The proxy adds no privilege of its own — every request is still
authorized by the real backend, exactly as if the browser could reach it
directly. Its only job is keeping the session cookie `httpOnly` and
first-party.

`next.config.ts` also rewrites `/uploads/*` to the backend, so images
uploaded through the local-disk storage placeholder resolve correctly in
dev without CORS or needing the backend's origin to be public.

## Testing

There is no automated frontend test suite yet (see Known gaps). Every
phase of this app has instead been verified by running the real dev
server against a real backend + database and driving the actual HTTP
requests the UI makes (sign-in, the proxy's cookie relay, full CMS
workflows) — see the backend README's Testing section for how that's set
up locally.

## Deployment

This app **cannot** be deployed as a static export — it has Server
Components that fetch per-request, an API route (the proxy), and
`next.config.ts` rewrites, all of which need a running Node server.

1. `npm ci && npm run build`
2. Set `API_BASE_URL` (server-side env, not `NEXT_PUBLIC_*`) to the
   backend's real, reachable-from-this-server origin, and `SITE_URL` to
   this app's own public origin.
3. `npm start`, or deploy to a platform that runs a Next.js server
   natively (Vercel, or any Node host/container running `next start`
   behind a reverse proxy).
4. Make sure cookies survive the hop: this app and the backend should
   share a deployment topology where the proxy can reach the backend
   server-to-server, and the session cookie's `secure`/`sameSite`
   settings (set by the backend, see its README) match how this app is
   actually served (HTTPS in production).
5. The public site is cache-first (`revalidate: 60` on public reads) —
   if you front this with a CDN, make sure it isn't also caching
   `/staff/*` or `/api/backend/*`, which must always be fresh and
   per-user.

## Known gaps (disclosed, not silent)

- **No automated test suite** — verification has been manual/scripted
  end-to-end runs, not a committed Jest/Playwright suite.
- **No image CDN / real object storage** — featured images and inline
  images resolve through the backend's local-disk placeholder via the
  `/uploads/*` rewrite; fine for development, not for production scale.
- **Body content has no rich inline-formatting editor** — the CMS's body
  editor supports the six V1 block types but not inline bold/italic/link
  marks; the public renderer (`components/public/ArticleBody.tsx`)
  supports marks for content written another way, but the editor UI
  itself doesn't expose them yet.
