# Today_news — Backend API

The Today_news editorial API: session-based auth, capability-based
authorization, the article revision/workflow model, media uploads to
Cloudinary, and the public read API the frontend renders from.
Express + TypeScript + Prisma + PostgreSQL.

See `../docs/` for the product and architecture decisions this service
implements — in particular `23-architecture-discovery.md` (system design),
`26-data-model-decisions.md` (schema/workflow decisions),
`11-article-workflows.md` (the 17-transition editorial state machine) and
`27-production-readiness.md` (the pre-launch gate).

## Tech stack

| Layer          | Choice                                            |
| -------------- | ------------------------------------------------- |
| Runtime        | Node.js 20+ (developed against Node 24)           |
| Framework      | Express 5                                         |
| Language       | TypeScript 5.9, compiled with `tsc`               |
| Database       | PostgreSQL 14+, via Prisma 6                      |
| Auth           | Session cookies (opaque tokens, Argon2id hashing) |
| Validation     | `class-validator` / `class-transformer`           |
| Media          | Cloudinary (upload + CDN delivery)                |
| Email          | SMTP via `nodemailer`                             |
| Tests          | Jest + `ts-jest`                                  |

## Prerequisites

- Node.js 20+
- A PostgreSQL 14+ database (managed — Neon, Supabase, Railway, RDS — or
  a local install / `docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16`)
- A [Cloudinary](https://cloudinary.com) account (the free tier is fine
  for development) — copy the `CLOUDINARY_URL` from its dashboard
- For invitations and password resets outside development: an SMTP
  account (any transactional provider — Resend, Postmark, SES, Brevo —
  gives you an SMTP URL)

## Setup

```bash
npm install
cp .env.example .env         # fill in DATABASE_URL, DIRECT_DATABASE_URL, CLOUDINARY_URL
npx prisma migrate deploy    # apply all committed migrations
npx prisma generate          # regenerate the Prisma client (also runs on install)
BOOTSTRAP_ADMIN_EMAIL=you@example.com \
BOOTSTRAP_ADMIN_PASSWORD='a long passphrase' \
BOOTSTRAP_ADMIN_NAME='Your Name' \
npm run db:bootstrap-admin   # creates the first, sign-in-able ADMIN account
npm run dev
```

The server starts on `http://localhost:3001` (or `PORT`) and logs
`Today_news API listening on port <PORT>` once ready. `GET /health`
confirms it is up; `GET /ready` confirms it can reach the database.

There is no self-serve sign-up by design (invite-only, docs/03), so
`npm run db:bootstrap-admin` exists specifically to create the *first*
account — idempotent, safe to re-run, and it refuses to run without all
three `BOOTSTRAP_ADMIN_*` variables (no default password, ever). Once you
have that account, invite everyone else through the CMS (`/staff/users`).

## Environment variables

All validated at boot in `src/config/env.validation.ts`; the process
refuses to start with a missing or malformed required value.

| Variable               | Required            | Default              | Notes |
| ---------------------- | ------------------- | -------------------- | ----- |
| `DATABASE_URL`         | Yes                 | —                    | Runtime connection string. Use the **pooled** address on Neon/Supabase/PgBouncer. |
| `DIRECT_DATABASE_URL`  | Yes (Prisma CLI)    | —                    | Direct, session-mode connection used by `prisma migrate`. Same as `DATABASE_URL` without a pooler. |
| `CLOUDINARY_URL`       | Yes                 | —                    | `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`, from the Cloudinary dashboard. |
| `CLOUDINARY_FOLDER`    | No                  | `today-news`         | Folder uploads land in — one account can host several environments. |
| `NODE_ENV`             | No                  | `development`        | `development` \| `test` \| `production`. Production enables `Secure` cookies and requires SMTP, https `APP_BASE_URL` and `REVALIDATE_SECRET`. |
| `PORT`                 | No                  | `3001`               | |
| `TRUST_PROXY`          | No                  | `0`                  | Reverse-proxy hops in front of this process; needed for correct client IPs in rate limiting. |
| `SESSION_COOKIE_NAME`  | No                  | `today_news_session` | Must match `frontend/lib/api/session.ts`. |
| `SESSION_TTL_HOURS`    | No                  | `12`                 | |
| `APP_BASE_URL`         | No (yes in prod)    | `http://localhost:3000` | The Next.js app's public origin — used in emailed links and to reach `/api/revalidate`. |
| `REVALIDATE_SECRET`    | Production          | —                    | Shared with the frontend; 32+ random characters. Lets the API purge the public page cache on publish/withdraw. |
| `MAIL_TRANSPORT`       | No                  | `console` (dev) / `smtp` (prod) | `console` prints emails (links included) to stdout. |
| `SMTP_URL`             | With `smtp`         | —                    | `smtps://USER:PASSWORD@host:465` or `smtp://…:587`. |
| `MAIL_FROM`            | With `smtp`         | —                    | `Today News <newsroom@example.com>`. |
| `CORS_ORIGINS`         | No                  | (none)               | Comma-separated origins. Leave unset — the browser never calls this API directly. |

`.env` is git-ignored; only `.env.example` is committed.

## Scripts

| Script                          | What it does |
| ------------------------------- | ------------ |
| `npm run dev`                   | Runs the server from TypeScript via `ts-node` |
| `npm run build`                 | Compiles to `dist/` (`tsconfig.build.json`) |
| `npm start`                     | Runs the compiled `dist/main.js` — use after `build` |
| `npm test`                      | Jest unit suite (no database or network needed) |
| `npm run typecheck`             | `tsc --noEmit` |
| `npm run prisma:generate`       | Regenerates the Prisma client from `schema.prisma` |
| `npm run prisma:migrate:dev`    | Creates + applies a new migration (interactive, dev only) |
| `npm run prisma:migrate:deploy` | Applies committed migrations, no prompts (CI/production) |
| `npm run prisma:validate`       | Validates `schema.prisma` |
| `npm run db:bootstrap-admin`    | Creates the first ADMIN account (idempotent; needs `BOOTSTRAP_ADMIN_*`) |

## Project structure

```
src/
  app.ts                  # Express wiring — route mount order IS the security boundary
  main.ts                 # Process entry point (listen + graceful shutdown)
  config.ts / config/     # Env validation, fail-fast at boot
  db.ts                   # Prisma client singleton
  common/                 # Auth middleware, capabilities, http-errors, audit, headers
  auth/                   # Sign-in/out, invitations, password reset, self-service profile
  users/                  # Admin user management (invite, role, deactivate)
  articles/               # Article CRUD, revisions, body validation, the workflow state machine
  categories/ sources/    # Supporting content domains
  media/                  # Uploads: content sniffing + Cloudinary storage adapter
  social/                 # Hand-curated "Top on social" picks
  audit/                  # Audit log reads
  cache/                  # Publish-time cache invalidation call to the frontend
  public/                 # Unauthenticated read API the public site renders from
  health/                 # /health (liveness) and /ready (readiness)
prisma/
  schema.prisma           # Source of truth for the data model
  migrations/             # Committed, ordered migrations (incl. raw-SQL triggers/checks)
scripts/
  bootstrap-admin.cjs     # First admin account (npm run db:bootstrap-admin)
```

## Architecture notes

- **Route mount order is the security boundary.** `app.ts` mounts the
  public routers (health, auth's public routes, `/public/*`) before the
  `sessionAuth` middleware and everything else after it. A new router
  that forgets to opt out is protected by default.
- **Authorization is capability-based**, never a raw role check
  (`common/capabilities.ts` is the one place `role → capability` is
  decided). Every mutating route also has an ownership check in its
  service layer.
- **State lives on `ArticleRevision`, not `Article`.** An article's
  identity (slug, owner) is separate from its editorial state; an article
  can have an "open" revision being worked on and a "published" one live
  at the same time. The section and byline being *edited* live on the
  revision; the article's own `categoryId`/`bylineOverride` are the
  *published* values and are written only by the publish transition — so
  nothing an editor saves changes what readers see until an admin approves
  it. See `docs/26-data-model-decisions.md` and `docs/27` A1.
- **Every save is one guarded transaction.** Content, section, byline and
  the optimistic-concurrency version check commit together or not at all;
  a stale save changes nothing. Source attach/detach follow the same
  rule and bump the revision version.
- **Media goes to Cloudinary** (`media/storage.ts`) and the CDN URL is
  stored on `MediaAsset.url`. Body image blocks are resolved server-side
  from that column — the URL a client sends is never persisted. If the
  database write fails after an upload, the object is deleted again.
- **Publishing purges the public cache.** After a publish or withdrawal
  commits, `cache/revalidate.ts` calls the frontend's `/api/revalidate`
  with the shared secret; the frontend's 60 s window is only the fallback.
- **Password security:** reset/invitation tokens are consumed in a single
  conditional `UPDATE` (two racing requests cannot both succeed), and any
  password set or change revokes every other session for that account.

## Testing

```bash
npm test
```

Unit tests cover the service layer (auth, the workflow transitions,
authorization rules, body validation, capabilities) with a mocked Prisma
client — no database, network or environment needed. The PostgreSQL
triggers and CHECK constraints in the migrations are not covered by an
automated suite yet (see `docs/27` B4).

## Deployment

1. `npm ci && npm run build`
2. Provision PostgreSQL and set `DATABASE_URL` (pooled) and
   `DIRECT_DATABASE_URL` (direct).
3. Set `CLOUDINARY_URL` (and `CLOUDINARY_FOLDER` per environment).
4. Run `npx prisma migrate deploy` against the database in the release
   step, before the new version starts serving.
5. Set `NODE_ENV=production`, `APP_BASE_URL=https://<your site>`,
   `REVALIDATE_SECRET` (same value as the frontend), `MAIL_TRANSPORT=smtp`,
   `SMTP_URL`, `MAIL_FROM`, and `TRUST_PROXY=1` if behind a load balancer.
   The API must be served over HTTPS in production (the session cookie is
   `Secure`).
6. Start with `npm start` behind a process manager or your platform's
   restart policy — the app handles `SIGTERM`/`SIGINT` for a clean
   shutdown. Point the platform's health check at `/ready`.
7. Point the frontend's `API_BASE_URL` at this service. The frontend
   talks to it **server-to-server only**; the API should not be reachable
   from readers' browsers (docs/23 §11.4).
8. Create the first admin with `npm run db:bootstrap-admin` (set the three
   `BOOTSTRAP_ADMIN_*` variables for that one run).

## Known gaps

- **No integration/e2e suite against a real database** (`docs/27` B4).
- **Single-instance rate limiting.** `auth.router.ts` uses an in-memory
  store; use a shared store before running more than one API instance
  (`docs/27` C1).
- **Email is fire-and-forget.** No outbox or retry table (`docs/27` C6).
- **Uploads are signature-checked, not re-encoded** — no EXIF stripping
  or responsive derivatives yet (`docs/27` C5). Cloudinary transformations
  can cover delivery-side sizing in the meantime.
