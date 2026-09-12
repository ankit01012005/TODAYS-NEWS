# 27 — Production readiness checklist

**Status:** binding. Every item marked **[REQUIRED]** must be closed before
the first public production deployment. Items marked **[DECISION]** need a
product decision first (see notes); items marked **[SOON AFTER]** may ship
in the first weeks after launch but must be scheduled.

**Origin:** an external readiness review of the codebase at commit `9a3739b`
(2026-09-11), verified against the code and accepted 2026-09-11. Verdict at
that point: a strong functional alpha — server-side permissions,
transactional publication, protected audit records, optimistic concurrency,
probes, graceful shutdown, headers, structured logs and SMTP are all in
place — but not yet dependable for a public launch, and not safe to run as
more than one API instance.

Check an item off by changing `[ ]` to `[x]` **in the same PR that closes
it**, with the PR number.

---

## A. Launch blockers — correctness

- [x] **A1 [REQUIRED] Public metadata can bypass review.** *(closed: chore-production-hardening — `categoryId`/`bylineOverride` moved onto `ArticleRevision`; `Article`'s copies are written only by the publish transition.)* `Article.categoryId`
  and `Article.bylineOverride` are written directly by
  `articles.service.ts saveArticleContent`, so saving a correction changes the
  live story's section (and therefore its URL) and public byline while the
  old revision is still the published one. Move both onto `ArticleRevision`
  (or freeze them on `Article` until approval) so what readers see only
  changes on publish. *Verified 2026-09-11.*

- [x] **A2 [REQUIRED] Save is not atomic.** *(closed: chore-production-hardening — one `$transaction`, one guarded `updateMany`, rollback on version mismatch.)* In the same function the
  category/byline updates run outside any transaction and *before* the
  `result.count === 0` version check — a stale editor receives a 409 yet has
  already changed those fields. Wrap the revision update, the version check
  and any article-level writes in one `prisma.$transaction`, and abort the
  whole thing on a version mismatch. *Verified 2026-09-11.*

- [x] **A3 [REQUIRED] Source attach/detach ignores the revision version.** *(closed: chore-production-hardening — `version` required on attach (body) and detach (query); guarded update bumps the revision version and returns it.)*
  `sources.service.ts` checks the open revision's state but writes without
  its version, so a request in flight can land after the article enters
  review. Require `version` on attach/detach, apply it with the same
  guarded-update pattern as saving, and bump the revision version so the
  admin never reviews a citation list that changed underneath them.

- [x] **A4 [REQUIRED] Password-reset consumption is not atomic, and password
  changes keep other sessions alive.** *(closed: chore-production-hardening — conditional `updateMany` consumes the token; every other session is revoked on any password set/change.)* `auth.service.ts setPasswordWithToken`
  reads then updates; two simultaneous requests can both pass. Consume the
  token with a conditional `updateMany` (hash matches AND not expired) and
  treat `count === 0` as invalid. On any password set or change, revoke every
  other session for that user (SEC-05's spirit).

- [x] **A5 [REQUIRED] Post-login redirect is an open redirect.** *(closed: chore-production-hardening — `safeStaffPath()` accepts only `/staff…` paths.)*
  `SignInForm.tsx` pushes `searchParams.get("from")` unvalidated. Accept only
  same-origin paths that start with `/staff/` (reject schemes, `//`,
  backslashes, and anything else); fall back to `/staff`. *Verified
  2026-09-11.*

- [x] **A6 [REQUIRED] The frontend build depends on a live API.** *(closed: `caa1944` — public reads wait for `connection()`; build succeeds with the API down.)* Every
  prerendered page (`/`, `/_not-found`, the static pages via the masthead's
  category fetch) calls the API at build time; if it is unreachable, `next
  build` fails, so an API outage blocks a frontend deploy. Optional content
  (404's "latest", the nav's categories) must degrade to empty instead of
  throwing, and the build must succeed with the API down. Runtime behaviour
  stays as is (ISR serves the last good page; a hard failure still reaches
  the error page).

## B. Launch blockers — infrastructure

- [x] **B1 [REQUIRED] Object storage for media.** *(closed: chore-production-hardening — Cloudinary adapter; CDN URL stored on `MediaAsset.url`; body image URLs resolved server-side; `/uploads` route and rewrite removed.)* `media/storage.ts` is a
  local-disk adapter: uploads vanish on redeploy, a second instance can't see
  them, rolling deploys serve broken images, and there is no backup. Ship an
  S3-compatible adapter behind the same interface, return CDN URLs from
  `public.view.ts`, and drop the `/uploads` rewrite in `next.config.ts`.

- [ ] **B2 [REQUIRED] Deployment system.** There is no CI, container
  definition, infrastructure config or release pipeline. Minimum: managed
  PostgreSQL, staging + production, domain/HTTPS/CDN, secrets management,
  `prisma migrate deploy` in the release step, a rollback procedure, database
  backups with point-in-time recovery, a *tested* restore, and post-deploy
  smoke checks against `/health`, `/ready` and one public page.

- [x] **B3 [REQUIRED] Publish-time cache invalidation.** *(closed: chore-production-hardening — public fetches tagged `public`; API calls `POST /api/revalidate` with `REVALIDATE_SECRET` after publish/unpublish commits; `expire: 0`.)* Public pages
  revalidate on a fixed 60 s (`frontend/lib/api/public.ts`); publishing,
  correcting or withdrawing does not invalidate the story, homepage, section,
  sitemap or feed, so a withdrawn story can stay visible for a minute (longer
  through a CDN). The API should call the frontend's revalidation endpoint
  (tag- or path-based, shared secret) from the publish/unpublish/correct
  transitions, and the CDN must honour it.

- [ ] **B4 [REQUIRED] Tests that touch the real system.** Backend tests mock
  Prisma; the PostgreSQL triggers (BR-14, append-only audit, publication
  markers) and concurrent review/publish behaviour have no automated
  coverage. Commit: an integration suite against a real database (the
  `verify-*.ts` scripts written during development are the starting point),
  one browser test of write → submit → publish → live, and frontend
  component tests for the editor and users page. Run them in CI (B2).

## C. Multi-instance and growth

- [ ] **C1 [REQUIRED before >1 API instance] Shared rate-limit store.**
  `auth.router.ts` uses express-rate-limit's in-memory store: N instances
  multiply the allowance and forget it on restart. Use a shared store
  (PostgreSQL or Redis) when scaling out, and verify `TRUST_PROXY` against
  the real topology.

- [ ] **C2 [REQUIRED before >1 API instance] Connection-pool limits.** Set
  Prisma's pool size per instance from the managed database's connection
  budget (or put PgBouncer in front) before running several instances.

- [ ] **C3 [SOON AFTER] CMS lists stop at 100.** `frontend/lib/api/cms.ts`
  fetches 100 articles and filters in the browser; the review queue and the
  media, sources and users lists are unbounded. Add server-side filtering
  and pagination to `/articles`, `/admin/review-queue` and `/media`.

- [ ] **C4 [SOON AFTER] Observability.** Add an error tracker, request
  latency/error-rate metrics, alerting on `/ready` failures and 5xx rate,
  and an external uptime check — readers must not be the first to notice.

- [ ] **C5 [SOON AFTER] Image processing.** Uploads are buffered whole in
  memory (10 MB × concurrent uploads) and only signature-checked. Decode and
  re-encode on upload (strips EXIF, rejects malformed files), generate
  responsive derivatives, and cap concurrent uploads per process.

- [ ] **C6 [SOON AFTER] Durable email.** Resets are sent fire-and-forget with
  no retry record or bounce handling. Acceptable for a pilot on a
  long-running server; add an outbox table with retries before relying on it
  for account recovery at scale.

## D. Product decisions needed

- [ ] **D1 [DECISION] Exactly one active admin.** BR-14 currently enforces
  *at most* one active admin (client decision, 2026-09-11). Operationally
  that makes review, publication, staff management and emergency withdrawal
  depend on one person: if that account is unavailable or locked out the
  newsroom cannot publish or recover. Recommendation: allow two or more
  review-only admins (the safety property is "admins never author", which
  already holds — the count of one adds risk, not safety). Reopen `docs/03`
  §5 if accepted; the trigger change is small.

- [ ] **D2 [DECISION] Draft loss.** DM-02 (`docs/26`) excludes autosave as a
  binding decision; the editor has explicit Save plus a beforeunload
  warning. A browser crash, mobile suspension, expired session or
  navigation loses unsaved work. A client-side recovery copy (localStorage,
  restored on return, never sent to the server) respects DM-02 while
  removing most of the loss. Decide before onboarding real reporters.

## E. Before the public sees it

- [ ] **E1 [REQUIRED] Replace placeholders.** Contact addresses use
  `todaynews.example`, branding is provisional (OQ-38 / P3-01), and the
  privacy text assumes no analytics. Real organisation, jurisdiction,
  contact process, analytics policy and corrections policy are needed.

---

## Suggested order

1. A1–A6 (correctness; all small, all backend/frontend code only).
2. B1, B2, then B3 (needs the deploy topology to exist first).
3. B4 alongside B2 so CI runs it from day one.
4. C1–C2 only when a second instance is actually planned; C3–C6 in the
   first weeks after launch.
5. D1, D2 and E1 are conversations, not code — have them now.

---

# Part 2 — Production architecture and rollout plan

**Accepted 2026-09-12** as the plan that closes the checklist above. Each
step names the checklist items it satisfies.

## Target topology

Multiple users do not require microservices. One properly sized API
instance with caching and a managed database serves the first release;
add API instances only when monitoring shows a real need.

```
Readers → CDN → Next.js
                   ↓
Staff  → Next.js → Express API → Managed PostgreSQL
                   ↓
            Object storage / CDN
```

Not needed for launch: Kubernetes, microservices, Kafka, Elasticsearch, or
a queue system. Sticky sessions are unnecessary — sessions already live in
PostgreSQL, so the API is effectively stateless.

## Step 1 — Correctness and security first *(A1–A6)*

Before anything deploys:

- One database transaction around article content, category, byline and
  the version check (A2); draft corrections must not change the currently
  published category or byline (A1).
- Version/state protection on source attach and detach (A3).
- Atomic reset-token consumption; revoke other sessions after any
  password change (A4).
- Post-login `from` restricted to internal `/staff/...` paths (A5).
- 404 (and every prerendered page) works with the API temporarily
  unavailable (A6).
- Tests for every case above.

## Step 2 — Replace local image storage *(B1, C5)*

An S3-compatible storage adapter behind the existing `media/storage.ts`
interface, providing:

- Durable storage independent of application servers, with CDN delivery.
- Generated filenames (already the case), upload size **and dimension**
  limits.
- Decode → re-encode on upload (strips EXIF, rejects malformed files) and
  responsive derivatives.
- Cleanup of the stored object when the database write fails after upload.

Mandatory before running more than one API instance.

## Step 3 — Managed PostgreSQL, properly *(B2, C2)*

- Automated daily backups and point-in-time recovery, with a **tested**
  restore procedure.
- Connection pooling (Prisma pool size per instance, or PgBouncer).
- Database SSL; restricted credentials (no superuser at runtime).
- Separate development, staging and production databases.
- `prisma migrate deploy` automated in the release step.

## Step 4 — Production caching *(B3)*

Explicit cache tags with invalidation. Publishing, correcting or
withdrawing a story immediately invalidates: the article page, the
homepage, its category page, the sitemap and the RSS feed. A CDN sits in
front of public pages and images. **Never** cache `/staff/*`, preview
pages, or `/api/backend/*`.

## Step 5 — Deployment pipeline *(B2)*

Every change automatically runs, in order:

1. Backend tests
2. Backend build
3. Frontend lint
4. Frontend typecheck
5. Frontend production build
6. Database integration tests
7. Deploy to staging
8. Database migrations
9. Production deployment
10. Health (`/health`, `/ready`) and smoke checks

Keep a one-action rollback available.

## Step 6 — Real-system tests *(B4)*

The 79 backend tests mostly mock the database. Add:

- PostgreSQL integration tests (triggers, markers, BR-14).
- A browser test: sign-in → write → submit → review → publish → live.
- Concurrent publication tests; stale-editing and source-change tests.
- Invitation and password-reset tests against a test mailbox.
- Upload and image-delivery tests.
- A backup-restoration test.

## Step 7 — Load test realistic traffic

Test public and CMS traffic separately; define acceptable response times
and error rates **before** running. Scenarios:

- Hundreds of simultaneous readers on one viral article.
- Homepage and category traffic.
- 20–50 staff sessions reading CMS pages.
- Several editors saving simultaneously.
- Two review actions against the same version.
- Concurrent image uploads.
- A temporary database or API failure.

## Step 8 — Multi-instance coordination *(C1, C2)*

Only when running more than one API instance:

- Shared rate-limit store; `TRUST_PROXY` set for the real load balancer.
- Object storage for every file (Step 2).
- Cache invalidation that reaches every frontend instance.
- PostgreSQL connections limited and monitored.
- Sessions stay in PostgreSQL (already true).
- Important writes idempotent where a retry is possible.

## Step 9 — Monitoring and incident handling *(C4)*

Error tracking; external uptime monitoring; API latency and error-rate
metrics; database connection and query monitoring; disk/object-storage
monitoring; alerts for failed email delivery, repeated authorization
failures, and failed deployments or migrations; a short incident and
rollback runbook. The health endpoints and structured request logs are the
foundation.

## Step 10 — Remove operational single points of failure *(D1, E1)*

Allow multiple review-only admins while requiring at least one active
admin; keep individual accounts and audit records; never a shared admin
login. Configure a real SMTP provider with domain authentication (SPF /
DKIM / DMARC), genuine contact addresses, privacy and corrections
policies, and production branding.

## Implementation sequence

1. Article transaction and concurrency fixes
2. Redirect and password-reset security
3. Frontend build resilience
4. Object storage and image processing
5. PostgreSQL integration tests
6. CI/CD and staging
7. Cache invalidation and CDN
8. Monitoring and backups
9. Load testing
10. Production launch
