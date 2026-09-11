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

- [ ] **A1 [REQUIRED] Public metadata can bypass review.** `Article.categoryId`
  and `Article.bylineOverride` are written directly by
  `articles.service.ts saveArticleContent`, so saving a correction changes the
  live story's section (and therefore its URL) and public byline while the
  old revision is still the published one. Move both onto `ArticleRevision`
  (or freeze them on `Article` until approval) so what readers see only
  changes on publish. *Verified 2026-09-11.*

- [ ] **A2 [REQUIRED] Save is not atomic.** In the same function the
  category/byline updates run outside any transaction and *before* the
  `result.count === 0` version check — a stale editor receives a 409 yet has
  already changed those fields. Wrap the revision update, the version check
  and any article-level writes in one `prisma.$transaction`, and abort the
  whole thing on a version mismatch. *Verified 2026-09-11.*

- [ ] **A3 [REQUIRED] Source attach/detach ignores the revision version.**
  `sources.service.ts` checks the open revision's state but writes without
  its version, so a request in flight can land after the article enters
  review. Require `version` on attach/detach, apply it with the same
  guarded-update pattern as saving, and bump the revision version so the
  admin never reviews a citation list that changed underneath them.

- [ ] **A4 [REQUIRED] Password-reset consumption is not atomic, and password
  changes keep other sessions alive.** `auth.service.ts setPasswordWithToken`
  reads then updates; two simultaneous requests can both pass. Consume the
  token with a conditional `updateMany` (hash matches AND not expired) and
  treat `count === 0` as invalid. On any password set or change, revoke every
  other session for that user (SEC-05's spirit).

- [ ] **A5 [REQUIRED] Post-login redirect is an open redirect.**
  `SignInForm.tsx` pushes `searchParams.get("from")` unvalidated. Accept only
  same-origin paths that start with `/staff/` (reject schemes, `//`,
  backslashes, and anything else); fall back to `/staff`. *Verified
  2026-09-11.*

- [ ] **A6 [REQUIRED] The frontend build depends on a live API.** Every
  prerendered page (`/`, `/_not-found`, the static pages via the masthead's
  category fetch) calls the API at build time; if it is unreachable, `next
  build` fails, so an API outage blocks a frontend deploy. Optional content
  (404's "latest", the nav's categories) must degrade to empty instead of
  throwing, and the build must succeed with the API down. Runtime behaviour
  stays as is (ISR serves the last good page; a hard failure still reaches
  the error page).

## B. Launch blockers — infrastructure

- [ ] **B1 [REQUIRED] Object storage for media.** `media/storage.ts` is a
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

- [ ] **B3 [REQUIRED] Publish-time cache invalidation.** Public pages
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
