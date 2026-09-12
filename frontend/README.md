# Today_news — Frontend

The public news site and the staff CMS (Editor + Admin), both in one
Next.js App Router app. Next.js 16 + React 19 + Tailwind CSS 4, built on
the Direction A ("Broadsheet") design system — see `../docs/19-design-system.md`
and `../docs/20-visual-direction.md`.

This app never talks to the backend directly from the browser — see
Architecture below.

## Tech stack

| Layer      | Choice                                                |
| ---------- | ----------------------------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack)                    |
| UI         | React 19                                              |
| Styling    | Tailwind CSS 4 (`@theme` tokens, no component library) |
| Images     | `next/image` over Cloudinary CDN URLs                  |
| Language   | TypeScript 5.9                                        |
| Lint       | ESLint 9 (`eslint-config-next`)                       |

## Prerequisites

- Node.js 20+
- The [backend API](../backend/README.md) running and reachable — this
  app has no data of its own.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in real values
npm run dev
```

Opens on `http://localhost:3000`. The public site is the homepage and
everything under it (`/`, `/{category}`, `/{category}/{slug}`, `/about`,
…); the CMS lives under `/staff` (`/staff/sign-in` is the entry point —
there is no public sign-up). The CMS covers both roles: an editor writing
and submitting stories, and an admin reviewing/publishing them and running
the newsroom (users, sources, categories, social picks).

A freshly migrated database has no categories or articles, so the public
site renders its empty states until the first story is published through
the CMS.

## Environment variables

| Variable            | Required   | Example                 | Notes |
| ------------------- | ---------- | ----------------------- | ----- |
| `API_BASE_URL`      | Yes        | `http://localhost:3001` | The backend's origin. **Never** prefixed `NEXT_PUBLIC_*` — the browser must never see it (docs/23 §11.4). |
| `SITE_URL`          | Yes        | `http://localhost:3000` | This app's own public origin — absolute URLs in `sitemap.ts`, `robots.ts` and `feed.xml`. |
| `REVALIDATE_SECRET` | Production | (32+ random chars)      | Same value as the backend's. Authenticates the API's calls to `/api/revalidate`. Optional in development. |

Copy `.env.example` to `.env.local`; that file is git-ignored.

## Scripts

| Script              | What it does                                    |
| ------------------- | ----------------------------------------------- |
| `npm run dev`       | Next.js dev server (Turbopack)                  |
| `npm run build`     | Production build (does not need the API to be up) |
| `npm start`         | Serves the production build (run after `build`) |
| `npm run lint`      | `eslint .`                                      |
| `npm run typecheck` | `tsc --noEmit`                                  |

## Project structure

```
app/
  (home)/, [category]/, [category]/[slug]/     # Public site
  about/, contact/, editorial-policy/, privacy/ # Static pages
  sitemap.ts, robots.ts, feed.xml/              # SEO surfaces
  staff/                                        # The CMS (Editor + Admin)
    sign-in/, forgot-password/, reset-password/, accept-invitation/, access-denied/
    page.tsx                                    # Dashboard — branches by role
    articles/, articles/new/, articles/[id]/{edit,preview,history}/
    review/, review/[id]/                       # Admin-only review queue + decision page
    users/, sources/, categories/, social/      # Admin-only newsroom management
    profile/
  api/backend/[...path]/route.ts                # The one authenticated proxy — see below
  api/revalidate/route.ts                       # Cache purge endpoint the API calls on publish
components/
  public/    # Article rendering shared by the public site AND the CMS preview
  cms/       # CMS UI: editor, body editor, pickers, management panels, primitives
  layout/    # Public masthead, nav, footer
  motion/    # Reveal/tilt runtime for the public site
lib/
  api/
    public.ts, public-types.ts                  # Public-read fetchers (no auth; cache-tagged "public")
    session.ts, cms.ts, cms-types.ts, auth-types.ts   # Server-side authenticated reads
    client-fetch.ts, upload-media.ts, body-blocks.ts   # Client-side write helpers
  format-date.ts, reading-time.ts, site.ts, social-platform.ts
```

## Architecture: how this app talks to the backend

There is a hard rule behind this app's data layer (`docs/23-architecture-discovery.md`
§11.4): **the browser never talks to the backend directly.**

- **Reads**, public and CMS, happen in Server Components. They call the
  backend directly (`lib/api/public.ts` for public pages, `lib/api/session.ts`'s
  `authFetch()` + `lib/api/cms.ts` for the CMS, forwarding the browser's
  session cookie). CMS reads are `cache: "no-store"`; public reads are
  cached and tagged `"public"`.
- **Writes** — sign-in, saving an article, uploading media, everything
  under `/staff` that mutates something — happen in Client Components via
  `lib/api/client-fetch.ts`, which hits this app's own
  `/api/backend/[...path]` route. That single generic proxy forwards the
  request (method, headers, body — including multipart uploads) to the
  real backend and relays the response, including `Set-Cookie` via
  `Response.headers.getSetCookie()`. It adds no privilege of its own; its
  only job is keeping the session cookie `httpOnly` and first-party.

**Images** are Cloudinary CDN URLs returned by the API and rendered
through `next/image` (`next.config.ts` allows `res.cloudinary.com`). The
CMS writes the asset's stored URL into body blocks, and the backend
re-resolves it from the database on save regardless.

**Cache invalidation.** Public fetches use `revalidate: 60` plus the
`"public"` tag. When a story is published, corrected or withdrawn, the API
calls `POST /api/revalidate` with the shared `REVALIDATE_SECRET`, and the
tag is expired immediately — readers never see a withdrawn story for
longer than one request. The 60 s window is only the fallback.

**Sign-in redirect.** `?from=` is honoured only for paths inside `/staff`
(no schemes, hosts or protocol-relative URLs); anything else lands on the
dashboard.

## Testing

There is no automated frontend test suite yet (`docs/27` B4). Every
change has been verified by running the real dev server against a real
backend and driving the actual HTTP requests the UI makes.

## Deployment

This app **cannot** be deployed as a static export — it has Server
Components that fetch per-request, route handlers, and per-user pages.

1. `npm ci && npm run build` — the build does not contact the API.
2. Set `API_BASE_URL` to the backend's origin as reachable **from this
   server** (private network address is ideal), `SITE_URL` to this app's
   public origin, and `REVALIDATE_SECRET` to the same value the backend has.
3. `npm start`, or deploy to a platform that runs a Next.js server
   natively (Vercel, or any Node host/container running `next start`).
4. Serve over HTTPS: the backend sets the session cookie `Secure` in
   production, and the proxy relays it as-is.
5. If you front this with a CDN, never cache `/staff/*`, `/api/backend/*`
   or `/api/revalidate`; they must always be fresh and per-user.

## Known gaps

- **No automated test suite** (`docs/27` B4).
- **CMS lists stop at 100 articles** and the review/media/user lists are
  unpaginated (`docs/27` C3).
- **Body content has no inline-formatting editor** — the body editor
  supports the six V1 block types but not inline bold/italic/link marks
  (the public renderer supports them for content written another way).
- **Placeholder branding and contact details** remain in the static pages
  (`docs/27` E1) — replace before the public sees them.
