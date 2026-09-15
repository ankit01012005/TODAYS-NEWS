# Today_news

An editorial newsroom platform: a public news site plus an invite-only
staff CMS with a reviewed publication workflow (editors write and submit;
an admin reviews, approves and publishes). Two applications in one
repository, deployed separately.

| Directory   | What it is | Stack |
| ----------- | ---------- | ----- |
| `backend/`  | The API — auth, authorization, the article workflow, media, public reads | Node.js · Express 5 · TypeScript · Prisma 6 · PostgreSQL |
| `frontend/` | The public site and the staff CMS | Next.js 16 · React 19 · Tailwind CSS 4 |
| `docs/`     | Product, design and architecture decisions the code implements | Markdown |

Each application has its own README with setup, environment variables,
scripts and deployment notes:

- [`backend/README.md`](backend/README.md)
- [`frontend/README.md`](frontend/README.md)

## How it fits together

```
Readers ──▶ Next.js (public site, cached, tagged "public")
                │  server-to-server only
Staff ────▶ Next.js (/staff CMS) ──▶ Express API ──▶ PostgreSQL
                                        │
                                        ├──▶ Cloudinary  (image upload + CDN delivery)
                                        ├──▶ SMTP        (invitations, password resets)
                                        └──▶ Next.js /api/revalidate  (purge on publish)
```

- The browser never calls the API directly; every CMS write goes through
  the frontend's authenticated proxy so the session cookie stays
  `httpOnly` and first-party.
- Images are uploaded by the API to Cloudinary and served to readers from
  its CDN. The API never serves image bytes.
- Publishing, correcting or withdrawing a story purges the frontend's
  public cache immediately.

## Running it locally

### Once, the first time

You need **Node.js 20+**, a **PostgreSQL 14+** database (a free Neon or
Supabase project is fine, or a local server) and a free **Cloudinary**
account. No Docker required for development.

```bash
git clone <this repo> && cd Today_news

# --- 1. API ---------------------------------------------------------
cd backend
npm install
cp .env.example .env
```

Open `backend/.env` and set the three required values:

| Variable | Where it comes from |
| --- | --- |
| `DATABASE_URL` | Your database's **pooled** connection string |
| `DIRECT_DATABASE_URL` | The **direct** (session-mode) one. Same value if there is no pooler — migrations fail through a transaction pooler |
| `CLOUDINARY_URL` | Cloudinary dashboard → "API environment variable" |

Everything else has a working default for development. Leave the mail
settings out and invitation and reset links print to the API's console
instead of being emailed.

```bash
# Check the database BEFORE creating anything in it: right server,
# reachable, encrypted, and are we allowed to change it?
npm run db:verify -- --stage=pre

# Create the schema.
npm run prisma:migrate:deploy

# Check what was created: every migration landed, every trigger and
# constraint that carries an editorial rule is installed, data consistent.
npm run db:verify -- --stage=post
```

Create the first admin — there is no sign-up page by design, the whole
system is invite-only:

```bash
# PowerShell
$env:BOOTSTRAP_ADMIN_EMAIL = "you@example.com"
$env:BOOTSTRAP_ADMIN_PASSWORD = "a long passphrase"   # 12+ characters
$env:BOOTSTRAP_ADMIN_NAME = "Your Name"
npm run db:bootstrap-admin

# bash
BOOTSTRAP_ADMIN_EMAIL=you@example.com BOOTSTRAP_ADMIN_PASSWORD='a long passphrase' BOOTSTRAP_ADMIN_NAME='Your Name' npm run db:bootstrap-admin
```

Then the site:

```bash
cd ../frontend
npm install
cp .env.example .env.local      # defaults are correct for local work
```

### Every time after that

Two terminals, API first:

```bash
# terminal 1
cd backend && npm run dev          # http://localhost:3001

# terminal 2
cd frontend && npm run dev         # http://localhost:3000
```

- Public site — <http://localhost:3000>
- Newsroom — <http://localhost:3000/staff/sign-in>

Sign in with the admin you created. As an admin you review and publish;
to write a story, invite yourself a second account as an **EDITOR** from
`/staff/users` (the roles are a strict split — an admin never authors, an
editor never publishes).

### Checking it is actually healthy

```bash
curl http://localhost:3001/health     # {"status":"ok"}    process is alive
curl http://localhost:3001/ready      # {"status":"ready"} it can reach the database
node scripts/smoke.mjs                # end-to-end: API, pages, feed, sitemap, auth
```

`/health` deliberately does **not** touch the database, so a database
hiccup never makes a supervisor restart a healthy process. `/ready` is the
one that tells you the truth about the database.

### When something is wrong

| Symptom | Cause | Fix |
| --- | --- | --- |
| API exits with `Missing required environment variable: DATABASE_URL` | No `.env`, or you started it from the wrong directory | `.env` must sit in `backend/`, and the command must run from `backend/` |
| `/ready` returns 503, pages 503 with `Retry-After` | The database is unreachable. **This is the honest answer, not a bug** — the app distinguishes "database down" (503, retry) from "we have a bug" (500) | Check the database is awake; some networks block outbound port 5432 |
| `P1001 Can't reach database server` from `prisma migrate` | Same, on the **direct** URL | Confirm `DIRECT_DATABASE_URL`; a transaction pooler refuses migrations |
| Links in the sitemap/RSS point at the wrong port | `SITE_URL` in `frontend/.env.local` does not match where the app is served | Set it to the real origin; `cd frontend && npm run check:env` catches this |
| Invitation email never arrives | No SMTP configured — the default in development | The link is printed in the API's console output |
| Cannot deactivate the only admin | Working as designed (BR-14: exactly one active admin must exist) | Promote another admin first |

Logs are one JSON object per line. To see more while debugging:
`LOG_LEVEL=debug npm run dev`.

## Services to provision for a deployment

| Service | Used for | Variables |
| ------- | -------- | --------- |
| PostgreSQL (managed, with backups) | All application data | `DATABASE_URL` (pooled), `DIRECT_DATABASE_URL` (direct) |
| Cloudinary | Image storage and CDN | `CLOUDINARY_URL`, optional `CLOUDINARY_FOLDER` |
| SMTP provider | Invitations, password resets | `MAIL_TRANSPORT=smtp`, `SMTP_URL`, `MAIL_FROM` |
| Node host for the API | `backend/` | `NODE_ENV=production`, `APP_BASE_URL`, `REVALIDATE_SECRET`, `TRUST_PROXY` |
| Node host for the site | `frontend/` | `API_BASE_URL`, `SITE_URL`, `REVALIDATE_SECRET` |

The full variable reference lives in each application's `.env.example`
and README. `REVALIDATE_SECRET` must be the same value on both sides.

## Continuous integration

`.github/workflows/ci.yml` runs on every push and pull request:

- **backend** — typecheck, unit tests, build.
- **frontend** — lint, typecheck, production build, and `check:env` under
  production rules.
- **database** — brings up a real PostgreSQL 16, verifies it before
  migrating, applies every migration from an empty database, verifies the
  result, then proves the migrations are idempotent and that
  `schema.prisma` has not drifted from them.

Only the database job needs a database, and it creates its own.

## Documentation map

The `docs/` directory is numbered in the order the decisions were made.
The ones the code refers to most:

| Doc | Why you'd read it |
| --- | ----------------- |
| `03-user-roles-and-permissions.md` | Who can do what — the capability matrix |
| `04-article-lifecycle.md`, `11-article-workflows.md` | The seven states and seventeen transitions |
| `19-design-system.md`, `20-visual-direction.md` | The design system the frontend implements |
| `23-architecture-discovery.md` | System design, security model, caching |
| `26-data-model-decisions.md` | Why the schema is shaped the way it is |
| `27-production-readiness.md` | The pre-launch checklist and rollout plan — what is done and what remains |
| `28-deployment-runbook.md` | **How to deploy and how to roll back** — the release procedure, step by step |
| `29-security-posture.md` | What is defended and how, what is **not**, and what the operator must do |

## Status

Pre-launch. The correctness blockers in `docs/27` (A1–A6), object storage
(B1) and publish-time cache invalidation (B3) are closed. Still open
before a public launch: the deployment pipeline and backups (B2),
real-database and browser tests (B4), and the product decisions and
placeholder replacements in sections D and E.
