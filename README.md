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

## Quick start (local development)

You need Node.js 20+, a PostgreSQL 14+ database and a free Cloudinary
account.

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env            # set DATABASE_URL, DIRECT_DATABASE_URL, CLOUDINARY_URL
npx prisma migrate deploy
BOOTSTRAP_ADMIN_EMAIL=you@example.com \
BOOTSTRAP_ADMIN_PASSWORD='a long passphrase' \
BOOTSTRAP_ADMIN_NAME='Your Name' \
npm run db:bootstrap-admin
npm run dev                     # http://localhost:3001

# 2. Frontend (second terminal)
cd frontend
npm install
cp .env.example .env.local      # API_BASE_URL=http://localhost:3001, SITE_URL=http://localhost:3000
npm run dev                     # http://localhost:3000  — CMS at /staff/sign-in
```

In development, invitation and password-reset emails are printed to the
backend's console (links included) instead of being sent.

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

`.github/workflows/ci.yml` runs on every push and pull request: backend
typecheck, unit tests and build; frontend lint, typecheck and production
build. Neither job needs a database, Cloudinary or the other application
to be running.

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

## Status

Pre-launch. The correctness blockers in `docs/27` (A1–A6), object storage
(B1) and publish-time cache invalidation (B3) are closed. Still open
before a public launch: the deployment pipeline and backups (B2),
real-database and browser tests (B4), and the product decisions and
placeholder replacements in sections D and E.
