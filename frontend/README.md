# ANVAY TV — Frontend

The public news site and the staff CMS (Editor + Admin), both in one
Next.js App Router app. Next.js 16 + React 19 + Tailwind CSS 4, built on
the **Anvay brand system** — the design handoff in
`Anvay Frontend Wireframe3/design_handoff_anvay_frontend/` (README, the
wireframe board and the client's brand references) is the source of
truth for structure and tokens. It supersedes the earlier Direction A /
Atlas Edition visual layer described in `../docs/19` and `../docs/20`;
the routes, proxy, data layer and block editor from that generation are
unchanged.

This app never talks to the backend directly from the browser — see
Architecture below.

## Tech stack

| Layer      | Choice                                                |
| ---------- | ----------------------------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack)                    |
| UI         | React 19                                              |
| Styling    | Tailwind CSS 4 (`@theme` tokens, no component library) |
| Motion     | CSS (scroll-driven reveals, ticker, live dot) + framer-motion for orchestrated entrances, tab/nav indicators, toasts, count-ups |
| Icons      | lucide-react for UI glyphs; platform marks drawn inline (`components/brand/SocialGlyph.tsx`) |
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

## Brand and design tokens

`app/globals.css` holds the whole system in one `@theme` block: the six
brand colours (Sindoor Red `#C81E1E`, Indigo Black `#12141C`, Haldi Gold
`#E8A33D`, Bone `#F4F2EE`, Slate `#5F6672`, Fresh Green `#1F8A5B`) and
the derived washes, the seven article-state colours, Archivo (everything)
+ IBM Plex Mono (timestamps, versions, addresses), the 4px spacing scale,
square corners with pills only for tags/states/the live dot, and the
motion easings. The rules the tokens encode are written at the top of the
file — gold never carries text on light, green is never decorative, red
is never more than ~10% of a screen.

The wordmark is drawn in type (`components/brand/Wordmark.tsx`): `ANVAY`
in Archivo 800, `TV` in red, the red pulse polyline beneath
(`PulseLine.tsx`). Vector versions for the press kit live in
`public/brand/` and the favicon is `app/icon.svg`. Ask the client for
production logo files before launch — these are faithful reconstructions
of direction 04 "The Pulse", not the client's originals.

## Project structure

```
app/
  (home)/, [category]/, [category]/[slug]/     # Reader site: Pulse Front, section, story
  about/, contact/, editorial-policy/, privacy/ # Static pages (contact/pitch forms compose an email)
  pr/                                           # PR & Distribution — reach cards, press kit, pitch form
  tv/                                           # ANVAY TV hub — YouTube embeds from lib/site.ts config
  search/                                       # Reader search over the public list (see lib/search.ts)
  sitemap.ts, robots.ts, feed.xml/, icon.svg    # SEO surfaces + favicon
  staff/                                        # The CMS (Editor + Admin)
    sign-in/, forgot-password/, reset-password/, accept-invitation/, access-denied/
    page.tsx                                    # Dashboard — the editor desk or the admin desk, by role
    articles/, articles/new/, articles/[id]/{edit,preview,history}/
    review/, review/[id]/                       # Admin-only review queue + decision page
    users/, categories/, social/, audit/        # Admin-only newsroom management (+ the audit log)
    sources/                                    # Both roles: editors add, admins verify
    media/                                      # Media library (both roles): delete, admin sync with Cloudinary
    profile/
  api/backend/[...path]/route.ts                # The one authenticated proxy — see below
  api/revalidate/route.ts                       # Cache purge endpoint the API calls on publish
  layout.tsx                                    # Root layout; mounts MotionProvider + ToastProvider
components/
  brand/     # Wordmark, PulseLine, SocialGlyph
  layout/    # Masthead, PrimaryNav, MobileMenu, PulseBand (ticker), HandlesBar, PublicFooter
  public/    # Story cards, Just In, Top on social, desk sections, article rendering
             # (shared by the public site AND the CMS preview / decision page)
  cms/       # CMS UI: composer, body editor, pickers, managers, primitives
             # Toast.tsx — ToastProvider + useToast(), the acknowledgement for every write
             # WriteFailures.tsx — the stale-version notice and the session-expired sign-in dialog
  motion/    # MotionProvider, Reveal, TextReveal, ImageReveal, Spotlight, CountUp, RevealRuntime
lib/
  api/
    public.ts, public-types.ts                  # Public-read fetchers (no auth; cache-tagged "public")
    session.ts, cms.ts, cms-types.ts, auth-types.ts   # Server-side authenticated reads
    client-fetch.ts, upload-media.ts, body-blocks.ts   # Client-side write helpers
  actions/public.ts                             # Server functions behind the reader's "Load more"
  search.ts                                     # Reader search without a search endpoint
  diff.ts                                       # Word diff for "Compare with rev n" on the history page
  cloudinary-loader.ts                          # next/image loader — CDN does the resizing (see below)
  format-date.ts, reading-time.ts, site.ts, site-url.ts, social-platform.ts
```

## Site configuration (`lib/site.ts`)

Hand-maintained values the design needs that are not in the database:
the site name and tagline, the four social handles (used by the handles
bar, footer, mobile menu and PR page — `reach` renders as "—" until the
real figure is filled in), the contact addresses (the public forms
compose an email to these; nothing is posted anywhere), the ANVAY TV
config (`liveVideoId`, next bulletin time, shorts and bulletins as
YouTube ids), and the PR desk copy. Replace the placeholders before the
public sees them.

## Motion

Two layers, both off under `prefers-reduced-motion`:

- **CSS, scroll-driven, no listeners** — the scroll reveal
  (`.reveal` + `components/motion/RevealRuntime.tsx`, which never hides
  content already in view and does nothing without JavaScript), the
  Pulse ticker (pauses on hover), the live dot's ring, the lead picture's
  parallax drift, the reading-progress bar, the nav's shadow once
  scrolled, section rules drawing in, card hover rules and "Read" tags.
- **framer-motion** — `TextReveal` (headlines arrive word by word),
  `ImageReveal` (the lead picture wipes open), `Spotlight` (a gold glow
  follows the pointer on the dark heroes), `CountUp` (dashboard counts),
  the sliding tab/nav indicators, toasts, dialogs and the composer's block
  list. `MotionProvider` in the root layout applies `reducedMotion="user"`
  to all of it.

The lead story card is deliberately *not* a shared-element morph target
(its wipe would fight the morph); every other card image morphs into the
article hero via React `<ViewTransition>`.

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
through `next/image` with a custom loader (`lib/cloudinary-loader.ts`,
wired in `next.config.ts`). The loader turns the stored master URL into a
delivery URL carrying `f_auto,q_auto,w_<width>,c_limit`, so Cloudinary's
CDN does the resizing and format negotiation for every `srcset` entry and
`/_next/image` is never involved — no multi-megabyte master fetched and
re-encoded on this server, in development or production. The CMS writes
the asset's stored URL into body blocks, and the backend re-resolves it
from the database on save regardless.

**Every write is acknowledged.** `components/cms/Toast.tsx` provides a
`ToastProvider` (mounted in the root layout, above every route, so a toast
raised just before `router.push()` — sign-in, set-password, submit — is
still on screen when the next page renders) and a `useToast()` hook.
Convention: a successful write calls `success()`/`info()`; a failed one
sets the inline `Alert` next to the control that failed (and `error()` for
failures that happen away from a form, such as uploads). Set-password and
sign-out also land on `/staff/sign-in?reason=…`, which shows a persistent
note in case the toast has faded.

**Media library** (`/staff/media`). Editors upload and delete their own
images; the admin deletes any and can *Sync with Cloudinary*, which asks
the API to drop rows whose object was deleted from the Cloudinary
dashboard (otherwise they linger in the picker and render as broken
pictures). Deleting is real — Cloudinary and database together — and the
API refuses it while a live or in-progress story still shows the image.

**Permanent deletion.** An admin can delete a story that is not live from
its editor page (the "Delete permanently" section) — `DELETE /articles/:id`,
confirmed in two steps, recorded in the audit log. Withdrawn and archived
stories appear under the **Archived** tab of the article list so they can
be found, restored or deleted; they never disappear from the CMS while
they exist in the database.

**Optimistic concurrency, made visible.** Every transition posts the
`version` the page loaded. A `409` from the API is rendered as the
"Someone else changed this" panel (`StaleVersionNotice`) with Reload and
"Copy my text first"; a `401` mid-edit opens the session-expired dialog,
which signs the person in again in place and retries the exact write —
the draft never leaves the screen (`lib/api/client-fetch.ts`
`readWriteFailure`).

**Search.** `/search?q=` has no backend endpoint yet: `lib/search.ts`
walks the public list (bounded to eight pages) and matches headline,
summary, byline and section. When `GET /public/search` exists, replace
`searchPublished` and nothing else changes.

**404 status.** The dynamic public routes have no `loading.tsx` on
purpose: a streamed response can only answer `200`, and an unknown
section or a withdrawn story must answer `404` (SEO-10, SEC-03).
`generateMetadata` throws `notFound()` before anything streams.

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

**Why the CMS feels slow in development:** each CMS page fans out into a
handful of API calls, and each of those is one or more round trips from
the API to its database. With the database on another continent every
query costs 250 ms or more before any work happens; the API caches the
session lookup and batches what it can, but the distance itself is the
cost. Run the API against a local PostgreSQL for development (see the
backend README), and expect the first visit to each route to take extra
seconds in `next dev` while Turbopack compiles it.

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
- **Placeholder handles, reach figures, contact addresses and TV config**
  in `lib/site.ts`, and placeholder desk names on `/about` — replace
  before the public sees them (`docs/27` E1). No production logo vector
  from the client yet; `public/brand/*.svg` are reconstructions.
- **No `GET /public/search`** — reader search scans the public list
  (bounded). Fine at this size; a real endpoint is a day's work on the
  API and a one-function swap here.
- **No video block** — ANVAY TV lives on `/tv` as YouTube embeds from
  config; stories stay text + photo (design handoff "Gaps" 1).
