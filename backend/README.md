# Today_news — Backend API

The Today_news editorial API: session-based auth, capability-based
authorization, the article revision/workflow model, and the public read
API the frontend renders from. Express + TypeScript + Prisma + PostgreSQL.

See `../docs/` for the product and architecture decisions this service
implements — in particular `23-architecture-discovery.md` (system design),
`26-data-model-decisions.md` (schema/workflow decisions), and
`11-article-workflows.md` (the 17-transition editorial state machine).

## Tech stack

| Layer          | Choice                                           |
| -------------- | ------------------------------------------------- |
| Runtime        | Node.js (developed against Node 24)               |
| Framework      | Express 5                                          |
| Language       | TypeScript 5.9, compiled with `tsc`                |
| Database       | PostgreSQL, via Prisma 6                           |
| Auth           | Session cookies (opaque tokens, Argon2id hashing)  |
| Validation     | `class-validator` / `class-transformer`            |
| File uploads   | `multer` (local-disk storage — see Known gaps)     |
| Tests          | Jest + `ts-jest`                                   |

## Prerequisites

- Node.js 20+ (Node 24 recommended)
- A running PostgreSQL server (14+). You have three reasonable options:
  1. **This repo's own dev-only Postgres (recommended for local dev)** —
     `npm run db:start` boots a persistent local instance via
     `embedded-postgres`, no native install or admin rights needed. Data
     lives in `.devdb-data/` (git-ignored) and survives between runs;
     `npm run db:stop` shuts it down. See `scripts/dev-db.cjs`.
  2. **Native install** — [postgresql.org/download](https://www.postgresql.org/download/), or on Windows: `winget install PostgreSQL.PostgreSQL`.
  3. **Docker**: `docker run --name today-news-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16`

  Whichever you choose, create a database (default name assumed below is `today_news`).

## Setup

```bash
npm install
cp .env.example .env        # then fill in DATABASE_URL for real
npm run db:start             # skip this if you're using your own Postgres instead
npx prisma migrate deploy    # apply all committed migrations
npx prisma generate          # regenerate the Prisma client (also runs on install)
npm run db:bootstrap-admin   # creates a real, sign-in-able ADMIN account — see below
npm run dev
```

The server starts on `http://localhost:3001` (or `PORT`, see below) and
logs `Today_news API listening on port <PORT>` once ready. Hit
`GET /health` to confirm it's up.

There is no self-serve sign-up by design (invite-only, docs/03), so
`npm run db:bootstrap-admin` exists specifically to create the *first*
account — idempotent, safe to re-run, prints the email/password it used
(override with `BOOTSTRAP_ADMIN_EMAIL`/`BOOTSTRAP_ADMIN_PASSWORD`/
`BOOTSTRAP_ADMIN_NAME` env vars). Once you have that account, invite
everyone else through the CMS itself (`POST /users`, or the frontend's
`/staff/users` page).

Two more scripts round out a realistic local setup:

- `npm run prisma:seed` — `prisma/seed.ts`'s minimal, deterministic
  fixtures (exercises the schema's relationships; its users have a
  placeholder password hash and **cannot sign in**).
- `npm run db:seed-demo-content` — `scripts/seed-demo-content.cjs`: ~28
  realistic published articles across 7 sections with real photos
  (fetched once, stored locally like any other upload) and a handful of
  fictional staff accounts (password printed on first run) — makes the
  public site and CMS lists actually look like a working newsroom
  instead of one bare test article. Idempotent.

## Environment variables

| Variable               | Required | Default               | Notes                                                                 |
| ----------------------- | -------- | ---------------------- | ---------------------------------------------------------------------- |
| `DATABASE_URL`          | Yes      | —                       | `postgresql://USER:PASSWORD@HOST:5432/today_news?schema=public`        |
| `PORT`                  | No       | `3001`                  | HTTP port the API listens on                                           |
| `NODE_ENV`              | No       | `development`           | `development` \| `test` \| `production`. Affects the session cookie's `secure` flag |
| `SESSION_COOKIE_NAME`   | No       | `today_news_session`    | Must match the frontend's `SESSION_COOKIE_NAME` (`lib/api/session.ts`) |
| `SESSION_TTL_HOURS`     | No       | `12`                    | How long a session cookie/session row stays valid                      |

There is no `.env` committed — copy `.env.example` and fill in real
values; `.env` itself is git-ignored.

## Scripts

| Script                          | What it does                                              |
| -------------------------------- | ----------------------------------------------------------- |
| `npm run dev`                    | Runs the server directly from TypeScript via `ts-node`     |
| `npm run build`                  | Compiles to `dist/` (`tsconfig.build.json`)                |
| `npm start`                      | Runs the compiled `dist/main.js` — use after `build`       |
| `npm test`                       | Runs the Jest unit test suite                               |
| `npm run typecheck`              | `tsc --noEmit`                                              |
| `npm run prisma:generate`        | Regenerates the Prisma client from `schema.prisma`          |
| `npm run prisma:migrate:dev`     | Creates + applies a new migration (interactive, dev only)   |
| `npm run prisma:migrate:deploy`  | Applies committed migrations, no prompts (CI/production)    |
| `npm run prisma:validate`        | Validates `schema.prisma`                                   |
| `npm run prisma:seed`            | Runs `prisma/seed.ts` — minimal schema-exercise fixtures (idempotent) |
| `npm run db:start` / `db:stop`   | Starts/stops the persistent local dev Postgres (`scripts/dev-db.cjs`) |
| `npm run db:bootstrap-admin`     | Creates the first real, sign-in-able ADMIN account (idempotent) |
| `npm run db:seed-demo-content`   | Seeds ~28 realistic published articles with real photos (idempotent) |

## Project structure

```
src/
  app.ts                 # Express app wiring — route mount order IS the security boundary
  main.ts                # Process entry point (listen + graceful shutdown)
  config.ts / config/     # Env validation, fail-fast at boot
  db.ts                   # Prisma client singleton
  common/                 # Cross-cutting: auth middleware, capabilities, http-errors, audit
  auth/                   # Sign-in/out, invitations, password reset, self-service profile
  users/                  # Admin user management (invite, role, deactivate)
  articles/                # Article CRUD, revisions, the workflow state machine
  categories/ sources/ media/  # Supporting content domains
  audit/                   # Audit log reads
  public/                  # Unauthenticated read API the frontend's public site renders from
prisma/
  schema.prisma            # Source of truth for the data model
  migrations/               # Committed, ordered migrations
  seed.ts                   # Dev-only fixture data
scripts/
  dev-db.cjs                # Persistent local Postgres (npm run db:start/db:stop)
  bootstrap-admin.cjs        # First real admin account (npm run db:bootstrap-admin)
  seed-demo-content.cjs      # Realistic demo articles + photos (npm run db:seed-demo-content)
```

## Architecture notes

- **Route mount order is the security boundary.** `app.ts` mounts public
  routers (health, auth's public routes, the `/public/*` read API) before
  the `sessionAuth` middleware, and everything else after it. A new router
  that forgets to opt out is protected by default — the safe failure
  direction.
- **Authorization is capability-based**, never a raw role check
  (`common/capabilities.ts` is the one place `role -> capability` is
  decided). Every mutating route also has an ownership check in its
  service layer — capability and ownership are deliberately separate
  checks.
- **State lives on `ArticleRevision`, not `Article`.** An article's
  identity (slug, owner, category) is separate from its editorial state,
  which can have both an "open" revision being worked on and a
  "published" one live at the same time. See `docs/26-data-model-decisions.md`.
- **Media storage is a local-disk placeholder** (`media/storage.ts`),
  served back under `/uploads/*`. Swappable behind the `StorageAdapter`
  interface for real object storage later. `express.static` calls
  `next()` rather than responding when a file is missing — `app.ts`
  registers a dedicated 404 handler for `/uploads/*` right after it, so a
  missing image can't fall through into `sessionAuth` and come back as a
  confusing 401 instead of a plain 404 (found the hard way).

## Testing

```bash
npm test
```

Unit tests cover the service layer (auth, the workflow transitions,
authorization rules) with a mocked Prisma client — no database required
to run them. End-to-end verification against a real database has been
done ad hoc per phase using `embedded-postgres`; there is no committed
integration-test suite yet (see Known gaps).

## Deployment

1. `npm ci && npm run build`
2. Provision a real PostgreSQL instance and set `DATABASE_URL` to it.
3. Run `npx prisma migrate deploy` against it before starting the app.
4. Set `NODE_ENV=production` (this flips the session cookie's `secure`
   flag on — the app must be served over HTTPS at that point) and set a
   real `SESSION_COOKIE_NAME`/`SESSION_TTL_HOURS` if you want non-default
   values.
5. Start with `npm start` (runs `dist/main.js`) behind a process manager
   or your platform's own restart policy — the app itself handles
   `SIGTERM`/`SIGINT` for a clean shutdown (closes the server, disconnects
   Prisma).
6. Point the frontend's `API_BASE_URL` at this service's origin. The
   frontend talks to it **server-to-server only** — the API should not be
   exposed in a way a browser can reach directly in production (see
   `docs/23-architecture-discovery.md` §11.4).
7. Persist uploaded media somewhere durable — the local-disk adapter
   (`uploads/`) does not survive a redeploy on most PaaS platforms. See
   Known gaps below.

## Known gaps (disclosed, not silent)

These were called out deliberately during development rather than
fixed or hidden — worth reading before a real production deploy:

- **No email provider.** Invitation and password-reset tokens are
  generated and returned by the API, but nothing sends them anywhere yet.
- **Media storage is local-disk**, not real object storage — fine for a
  single-instance dev setup, not for production or multi-instance
  deployments.
- **CORS is fully permissive** (`origin: true` in `app.ts`) — needs to be
  locked to the real frontend origin before this is exposed publicly.
- **Body-content validation is structural only** (`articles/body.util.ts`)
  — it checks block *shape*, not the full inline-content/link-allowlist
  rules `docs/26-data-model-decisions.md` §3.4 specifies.
- **No integration/e2e test suite is committed** — verification against a
  real database has so far been done manually per phase.
