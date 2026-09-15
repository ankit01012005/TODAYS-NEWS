# 28 — Deployment runbook

**Status:** operational. This is the procedure for releasing Today_news /
ANVAY TV to staging and production, and for getting back when a release
goes wrong. It closes the procedural half of `docs/27` B2; the checklist
items it does *not* close are listed at the end.

Audience: whoever is doing the release. It assumes no prior context beyond
access to the hosting account, the database and the repository.

---

## 1. What runs where

```
Readers → CDN → Next.js (frontend/)        :3000
                    ↓  server-to-server only
Staff   → Next.js → Express API (backend/) :3001
                    ↓
              Managed PostgreSQL        (Neon or equivalent)
                    ↓
              Cloudinary (media + CDN)
```

Two containers, one database, one media provider. The browser never
reaches the API directly — every call is proxied by the Next.js app
(`docs/23` §11.4), so **the API does not need a public hostname**. Give it
one only if something else must call it, and restrict it if you do.

Both images are built from the repository:

| Component | Image                    | Port | Entry             |
|-----------|--------------------------|------|-------------------|
| API       | `backend/Dockerfile`     | 3001 | `node dist/main.js` |
| Site/CMS  | `frontend/Dockerfile`    | 3000 | `node server.js`  |

---

## 2. Configuration

Every variable is documented in `backend/.env.example` and
`frontend/.env.example`. The ones that are easy to get wrong:

### Backend

| Variable | Notes |
|---|---|
| `DATABASE_URL` | **Pooled** address on a managed provider. This is what the running app uses. |
| `DIRECT_DATABASE_URL` | **Direct**, session-mode address. Migrations only — poolers in transaction mode refuse them. |
| `APP_BASE_URL` | The frontend's public origin. Goes into invitation and reset emails, and is where cache purges are sent. Must be https in production. |
| `REVALIDATE_SECRET` | Must be **identical** to the frontend's. 32+ characters. Without it a withdrawn story stays visible until the 60-second window expires. |
| `TRUST_PROXY` | Number of proxy hops in front of the API. Wrong value = every client looks like the load balancer, and rate limiting applies to the whole newsroom at once. |
| `MAIL_TRANSPORT` / `SMTP_URL` / `MAIL_FROM` | Production refuses to start without real SMTP. `MAIL_FROM` must be a sender the provider allows. |
| `LOG_LEVEL` | `info` in production. `debug` temporarily while diagnosing; never leave it there. |

### Frontend

| Variable | When it is read | Notes |
|---|---|---|
| `SITE_URL` | **Build *and* run** | `robots.txt` and the sitemap are prerendered, so the value present at `docker build` is baked into them. Pass it as a build arg *and* an env var. |
| `API_BASE_URL` | Run | The API's internal address. Never `NEXT_PUBLIC_*`. |
| `REVALIDATE_SECRET` | Run | Must match the backend's. |

> The single most likely misconfiguration is `SITE_URL` left at a
> development value. Nothing about the deployment looks broken — but every
> canonical tag, the sitemap, the RSS feed and every shared link address a
> host that does not answer. `npm run check:env` exists to catch exactly
> this and is a required step below.

---

## 3. First-time setup

1. **Database.** Create separate `development`, `staging` and `production`
   databases. Enable automated daily backups and point-in-time recovery.
   Create a non-superuser role for the application — `npm run db:verify`
   fails in production if the app connects as a superuser, because a
   superuser can bypass the triggers that hold the editorial invariants.
2. **Restore drill.** Restore a backup into a scratch database and run
   `npm run db:verify -- --stage=post` against it. An untested backup is
   not a backup. Record the date; repeat quarterly.
3. **Media.** Create the Cloudinary account and set `CLOUDINARY_URL` and
   `CLOUDINARY_FOLDER` (use a different folder per environment).
4. **Mail.** Configure the SMTP provider with SPF, DKIM and DMARC on the
   sending domain, and verify `MAIL_FROM`.
5. **Secrets.** Generate `REVALIDATE_SECRET` with `openssl rand -hex 32`
   and store it in the platform's secret manager for both components.
6. **First admin.** There is no self-serve sign-up (invite-only,
   `docs/03`). Create the first account out of band:
   ```
   BOOTSTRAP_ADMIN_EMAIL=you@example.com \
   BOOTSTRAP_ADMIN_PASSWORD='a long passphrase' \
   BOOTSTRAP_ADMIN_NAME='Your Name' \
   npm run db:bootstrap-admin
   ```
   Change the password at `/staff/profile` after the first sign-in.

---

## 3a. Hardening gate — do this before the first deploy

Every item is something the code **cannot** enforce for you. `docs/29`
explains what each one defends against; this is the checklist form.
Nothing below is optional for a public deployment.

### Network shape

- [ ] **The API has no public hostname.** Only the Next.js server needs to
      reach it — put it on a private network, or bind it to an internal
      interface. It is the component holding the database credentials, and
      no browser has ever needed to talk to it.
- [ ] **HTTPS everywhere, no plain-http listener.** The session cookie is
      `Secure` in production, so over http a staff sign-in simply will not
      work — and `API_BASE_URL` over plain http to a remote host would put
      session cookies on the wire in the clear. `check:env` refuses that.
- [ ] **`TRUST_PROXY` set to the real number of proxy hops** on *both*
      apps. Too low and every request looks like it came from the load
      balancer, so the sign-in rate limiter throttles the whole newsroom
      as one client. Too high and a caller can forge their address and
      never be limited at all.
- [ ] **CDN in front of the public site only.** Never cache `/staff/*`,
      `/api/backend/*` or `/api/revalidate`.

### Database

- [ ] **Connect as a non-superuser.** A superuser can disable the triggers
      that hold the editorial invariants — the append-only audit log among
      them. `db:verify --stage=pre` **fails** on this in production.
- [ ] **TLS required** on the connection (`sslmode=require` or the
      provider's equivalent). `db:verify` reports whether the live
      connection is actually encrypted, not whether you asked for it.
- [ ] **Separate databases** for development, staging and production.
- [ ] **Automated backups with point-in-time recovery**, and a **restore
      you have actually performed** — restore into a scratch database and
      run `npm run db:verify -- --stage=post` against it. An untested
      backup is not a backup. Record the date and repeat quarterly.

### Secrets

- [ ] **Nothing in a file on the host.** `DATABASE_URL`, `CLOUDINARY_URL`,
      `SMTP_URL` and `REVALIDATE_SECRET` belong in the platform's secret
      manager.
- [ ] **`REVALIDATE_SECRET` generated with `openssl rand -hex 32`** and
      **identical on both apps**. Mismatched, the API cannot purge the
      cache and a withdrawn story stays readable for up to 60 seconds.
- [ ] **Rotate anything ever written into a document, a chat or a
      screenshot.** Treat it as public from that moment.
- [ ] **No shared logins.** Every action is attributed to an account and
      the audit trail is only as truthful as that.

### Accounts and mail

- [ ] **Change the bootstrap admin's password** at `/staff/profile` right
      after the first sign-in.
- [ ] **SPF, DKIM and DMARC** on the sending domain, and `MAIL_FROM` a
      sender the provider will actually send as. Password recovery depends
      on mail arriving.
- [ ] Understand the standing risk: **there is no MFA**. A phished staff
      password is full access for that role. See `docs/29` §3.1.

### Verify the hardening landed

After the first deploy, confirm the headers are really being served —
misconfigured proxies strip them:

```bash
curl -sI https://your-site.example | grep -iE 'content-security|strict-transport|x-frame|x-content'
```

You should see `Content-Security-Policy`, `Strict-Transport-Security`,
`X-Frame-Options: DENY` and `X-Content-Type-Options: nosniff`, and you
should **not** see `X-Powered-By`.

---

## 3b. Toolchain — why the Node version is pinned everywhere

CI, both Docker images, both `package.json` `engines` fields, and three
`.nvmrc` files all say **Node 24**. That is not tidiness; it is the fix for
a real outage of the pipeline.

`package-lock.json` is an npm artefact, and npm 10 and npm 11 disagree
about which optional native dependencies belong in it (`@emnapi/*`). A
lockfile written by npm 11 — which is what Node 24 ships, and what every
developer machine here runs — fails `npm ci` under npm 10 with:

```
npm ci can only install packages when your package.json and
package-lock.json are in sync.
Missing: @emnapi/core@1.11.3 from lock file
```

CI was on Node 22 (npm 10), so **both jobs failed at `npm ci` in eleven
seconds**, every run, while every developer machine was green. Both
Dockerfiles were on `node:22-alpine` and would have failed identically on
the first real build.

Consequences to respect:

- **Do not change the Node version in one place only.** Change `.nvmrc`,
  both `engines`, the CI `node-version`, and both Dockerfiles together, and
  regenerate the lockfiles on that version.
- `engine-strict=true` in each app's `.npmrc` makes a wrong Node version
  fail at install time with a clear message, rather than silently writing
  a lockfile the pipeline cannot install.
- **Vercel** picks its Node version from `engines.node` in
  `package.json` (and `.nvmrc` in the project's root directory). Both are
  set, so it follows automatically — but if a build there starts failing
  at install, that is the first thing to check.

### Hosting as it currently stands

- **Two Vercel projects** (`todays-news` and `todays-news-tc2e`) build from
  this one repository. That is almost certainly one project too many:
  every push deploys twice, and only one of them can be the real site.
  Decide which to keep and disconnect the other.
- Vercel deploys the **frontend only**. The Express API is a long-running
  server and needs its own host; until it has one, a deployed site has no
  API to talk to and every public page will answer 503.
- Preview deployments are access-protected. Keep it that way — a preview
  is a full CMS pointed at whatever database it is configured with.

---

## 4. Release procedure

Run in this order. Every step must pass before the next.

```bash
# 1. Automated gate — CI runs this on the commit being released.
#    Backend typecheck, tests, build; frontend lint, typecheck, build,
#    config gate; migrations from an empty database + verification.
#    Do not release a commit whose CI run is not green.

# 2. Configuration gate, against the values this release will actually use.
cd frontend && npm run check:env

# 3. Pre-migration database check — is this the right server, can we reach
#    it, is the connection encrypted, are we a non-superuser?
cd ../backend && npm run db:verify -- --stage=pre

# 4. Migrate. Uses DIRECT_DATABASE_URL. Never run this from two places at
#    once, and never from application start-up (two replicas booting
#    together would race each other).
npm run prisma:migrate:deploy

# 5. Post-migration check — every migration landed, every trigger and
#    constraint that carries an invariant is present, the live data still
#    satisfies all of them.
npm run db:verify -- --stage=post

# 6. Deploy both images, API first (the frontend tolerates an API outage;
#    the reverse is not true for the CMS).

# 7. Smoke check the running release.
node scripts/smoke.mjs --api=https://api.example.com --site=https://example.com
```

Step 7 must exit 0. If it does not, roll back (§6) — do not "wait and see".

### Ordering rule for migrations

Migrations run **before** the new image takes traffic, which means every
migration must be safe for the *previous* version of the code to run
against for the few seconds of overlap. Additive changes (new nullable
column, new table, new index) are safe. A destructive change (dropping or
renaming a column still read by the running code) must be split across two
releases: add and backfill, ship, then remove in the next release.

---

## 5. What to check after a release

- `/health` — 200. The process is alive.
- `/ready` — 200. It can reach the database. **This is the one a load
  balancer routes on**; `/health` deliberately does not touch the database
  so a database hiccup cannot make the orchestrator restart a healthy
  process.
- One public page renders with content.
- Sign in, open the review queue, publish nothing.
- Logs: one JSON object per line, `event: "server.started"` present, no
  `request.unhandled` lines.

---

## 6. Rollback

1. **Application:** redeploy the previous image tag for both components.
   This is the normal case and takes effect immediately.
2. **Database:** there are no down-migrations. If a migration is the
   problem, roll the application back first (the old code against the new
   schema is usually fine for additive changes), then write a *new*
   forward migration that corrects it. Restoring from backup is the last
   resort and loses editorial work committed since the snapshot — it needs
   an explicit decision, not a reflex.
3. After any rollback, run `npm run db:verify -- --stage=post` and
   `scripts/smoke.mjs` again before declaring it over.

---

## 7. Operating notes

**Logs.** Every line is one JSON object: `time`, `level`, `event`, then
fields. Join a user's error report to a log line through `correlationId` /
`requestId` — it is in both the error response body and the log. Values
under keys naming a credential are redacted before they are written
(`backend/src/common/logger.ts`).

Events worth alerting on:

| Event | Meaning |
|---|---|
| `request.unhandled` | A bug. Status 500. Should be zero. |
| `request.unavailable` | The database was unreachable. Status 503. Retrying would work. |
| `process.uncaughtException` | The process is restarting itself. |
| `mail.smtp.unreachable` | Invitations and password resets are not being delivered. |
| `cache.revalidate.failed` | A published or withdrawn story will be stale for up to 60 seconds. |
| `sessions.reap_failed` | Repeated occurrences mean the session table is growing unbounded. |

**Single API instance.** The rate limiter and the session cache are
in-process, so a second instance doubles the sign-in allowance and holds
its own session cache. Before running more than one, close `docs/27` C1
and C2 (shared rate-limit store, connection-pool sizing).

**Never cache** `/staff/*`, preview pages, or `/api/backend/*` at the CDN.
Public pages and images should be cached; the API purges them on publish.

---

## 8. What this runbook does not yet close

From `docs/27`, still open after this document:

- **B2 (partly).** The pipeline steps are defined and CI runs the gates,
  but the actual hosting platform, staging environment, domain, TLS, CDN
  and secret storage are account-level setup, not repository content.
  Backups and a *tested* restore (§3.2) are likewise an operator action.
- **B4 (partly).** CI now runs migrations and the schema/invariant
  verification against a real PostgreSQL. Still missing: a browser test of
  sign-in → write → submit → publish → live, and component tests for the
  editor and users page.
- **C1, C2** — only needed before a second API instance.
- **C3–C6** — CMS pagination, observability, image processing, durable
  email. Scheduled for the weeks after launch.
- **D1, D2** — product decisions (number of admins; draft-loss recovery).
- **E1** — real contact addresses, jurisdiction and policies. The
  placeholder `todaynews.example` addresses must be replaced before the
  public sees the site.
