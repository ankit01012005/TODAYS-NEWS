# 06 — V1 vs Future

**Stage:** Product discovery (pre-development)
**Last updated:** 2026-09-08

---

## 1. What V1 means here

**[PROPOSED]** V1 is not a prototype or a demo. It is the smallest system that a
real newsroom could publish real news with, every day, safely.

The test for including something in V1 is:

> **Can a working newsroom publish credible news without it?**

If yes, it is not V1 — no matter how obviously useful it is.

---

## 2. The feature table

**Legend:** ✅ = in V1 · ➖ = not in V1 · ⭐ = future · ⚠️ = depends on an open question

### 2.1 Public reader website

| Feature | V1? | Future? | Why |
|---|---|---|---|
| Homepage with latest published articles | ✅ | | Without it there is no news site. |
| Article page (headline, summary, body, author, date, image) | ✅ | | The core product. |
| Category / section pages | ✅ | | Navigation and addresses depend on it; adding it later changes every article address. ⚠️ OQ-18 |
| Mobile-responsive layout | ✅ | | Most news traffic is mobile. Not optional. |
| Accessibility (WCAG 2.1 AA target) | ✅ | | Confirmed goal; cheap during build, expensive to retrofit. ⚠️ OQ-33 |
| SEO metadata, structured data, social previews | ✅ | | Search and social are the primary reader acquisition channels. |
| Sitemap and robots rules | ✅ | | Trivial to build, directly affects being found. |
| Stable, human-readable addresses | ✅ | | Public contracts; changing them later breaks links. ⚠️ OQ-20 |
| Correct 404 / redirect behaviour | ✅ | | Broken links damage both readers and search ranking. |
| Static pages (About, Contact, Privacy) | ✅ | | Expected of any real publication; also needed for privacy compliance. |
| RSS feed | ✅ | | Very cheap, still used by aggregators and readers. |
| Basic keyword search | ⚠️ | ⭐ | Include only if it is simple with the chosen storage. Never justifies a search cluster in V1. OQ-19 |
| Author pages | ➖ | ⭐ | Useful for credibility, not needed to publish. Requires OQ-23 first. |
| Related stories | ➖ | ⭐ | Needs tags or content analysis; V1 has neither. |
| Trending news | ➖ | ⭐ | Requires analytics data that does not exist until we have readers. |
| Recommendations / personalisation | ➖ | ⭐ | Requires reader identity, behavioural data, and scale. None exist in V1. |
| Comments | ➖ | ⭐ | Brings accounts, moderation and abuse handling — a product of its own. |
| Newsletter | ➖ | ⭐ | Separate system, separate consent obligations. |
| Paywall / subscriptions | ➖ | ⭐ | Business-model decision, not made. OQ-39 |
| Reader accounts | ➖ | ⭐ | Nothing in V1 needs to know who a reader is. OQ-01 |
| Multi-language editions | ➖ | ⭐ | Restructures the entire content model. OQ-40 |
| Native mobile apps | ➖ | ⭐ | A responsive site serves the same need at a fraction of the cost. |

### 2.2 Editor CMS

| Feature | V1? | Future? | Why |
|---|---|---|---|
| Sign in | ✅ | | Required for any private workspace. |
| List of own articles with state | ✅ | | Editors must know where their work stands. |
| Create / edit article | ✅ | | Core function. |
| Save draft | ✅ | | Explicitly confirmed. |
| Submit for review | ✅ | | Explicitly confirmed. |
| Read admin feedback, revise, resubmit | ✅ | | The workflow does not close without it. |
| Attach sources | ✅ | | Confirmed capability. ⚠️ OQ-24 |
| Upload a featured image with alt text | ✅ | | News without images looks unfinished; alt text is an accessibility requirement. ⚠️ OQ-21 |
| Preview as a reader | ✅ | | Prevents a whole category of avoidable review rounds. |
| Autosave | ✅ | | Losing a finished article to a closed tab is the fastest way to lose a newsroom's trust. ⚠️ OQ-26 |
| In-app status notifications | ✅ | | Without these the workflow stalls; people wait on each other silently. |
| Email notifications | ⚠️ | ⭐ | Better, but adds an external service. Decide at OQ-25. |
| Withdraw a submission | ✅ | | Tiny feature, removes a recurring irritation. ⚠️ OQ-04 |
| Rich media embeds (video, social posts, galleries) | ➖ | ⭐ | Depends on the body format decision; significant work. OQ-22 |
| Real-time collaborative editing | ➖ | ⭐ | A large project on its own; nothing in the brief requires it. OQ-05 |
| AI writing assistance / summaries | ➖ | ⭐ | Explicitly future. Needs editorial policy first. |

### 2.3 Admin CMS

| Feature | V1? | Future? | Why |
|---|---|---|---|
| Review queue | ✅ | | The admin's primary workspace. |
| Read a submitted article in full | ✅ | | Cannot review what you cannot read properly. |
| Approve & publish | ✅ | | The point of the entire system. |
| Request changes with mandatory comment | ✅ | | Confirmed; feedback without explanation is the top newsroom friction. |
| Reject with reason | ✅ | | Confirmed. |
| See all articles in all states | ✅ | | Needed to run a newsroom rather than react to a queue. |
| Filter / search the article list | ✅ | | Becomes essential within weeks of launch. |
| Manage users and roles | ✅ | | Confirmed; without it nobody else can be onboarded. |
| Manage categories | ✅ | | Required by section 2.1. ⚠️ OQ-18 |
| Manage sources | ✅ | | Confirmed capability. |
| Unpublish | ✅ | | The ability to take a wrong story down quickly is a safety feature, not a nice-to-have. ⚠️ OQ-16 |
| Edit an editor's article | ✅ | | Normal sub-editing practice. ⚠️ OQ-02 |
| Article history / audit trail view | ✅ | | Cannot be reconstructed later; must exist from the first published article. ⚠️ OQ-11 |
| Archive | ✅ | | The destination for unpublished and abandoned work. ⚠️ OQ-13 |
| Scheduled publishing | ➖ | ⭐ | Real need, but introduces background processing. Keep the `APPROVED` state so it slots in cleanly. OQ-07 |
| Homepage curation / featured stories | ⚠️ | ⭐ | V1 can be reverse-chronological. Editorial control over the front page is often wanted sooner than expected. OQ-17 |
| Editorial analytics dashboard | ➖ | ⭐ | Needs traffic data first. |
| Multi-stage approval chains | ➖ | ⭐ | No confirmed need. Would add cost to every article forever. |
| Configurable workflows | ➖ | ⭐ | Configurability is a product feature disguised as flexibility. Not until the fixed workflow proves insufficient. |

### 2.4 Platform and foundations

| Feature | V1? | Future? | Why |
|---|---|---|---|
| Role-based permissions enforced on the server | ✅ | | The product's integrity rests on this. |
| Password authentication with sessions | ✅ | | Required for a private back-office. |
| Two-factor authentication for admins | ⚠️ | ⭐ | A stolen admin account can publish on your masthead. Strongly recommended for V1. OQ-28 |
| Content sanitisation | ✅ | | Without it, contributor input becomes a route to attacking readers. |
| HTTPS everywhere | ✅ | | Baseline. |
| Soft delete / retention | ✅ | | Accidental deletion is permanent otherwise. ⚠️ OQ-12 |
| Revision snapshots at workflow transitions | ✅ | | Underpins correction handling and "what changed". History not kept is gone forever. ⚠️ OQ-26 |
| Automated backups with tested restore | ✅ | | An untested backup is a hope, not a backup. |
| Error and uptime monitoring | ✅ | | You will otherwise learn about outages from readers. |
| Staging environment | ✅ | | Testing changes against the live news site is not acceptable. |
| Page caching for public pages | ✅ | | The public site is almost entirely reads of rarely-changing content — the cheapest performance win available. |
| Image resizing and optimisation | ✅ | | Unoptimised images are the most common cause of slow news pages. |
| Basic traffic analytics | ✅ | | You cannot improve what you cannot see. ⚠️ OQ-34 |
| Full version history of every save | ➖ | ⭐ | Snapshots at transitions cover the real needs at a fraction of the cost. |
| Article tagging | ➖ | ⭐ | Prerequisite for related stories and clustering; not needed to publish. |
| Semantic / advanced search | ➖ | ⭐ | Substantial infrastructure. Needs a real content volume to be worth anything. |
| Story clustering | ➖ | ⭐ | Advanced; depends on tagging and volume. |
| Push notifications | ➖ | ⭐ | Needs reader identity and consent. |
| Public API | ➖ | ⭐ | No confirmed consumer. An API with no consumer is maintenance with no benefit. |
| Automated news aggregation / scraping | ➖ | ⚠️ | Explicitly excluded by the brief. Also raises copyright questions. |
| Microservices | ➖ | ➖ | No need is remotely visible. Would multiply cost and failure modes. |
| Message queues / event streaming | ➖ | ⚠️ | Only if background work (scheduling, notifications at volume) proves it necessary. |
| Dedicated search cluster | ➖ | ⚠️ | Only when search requirements genuinely exceed what the main storage can do. |
| Container orchestration | ➖ | ⚠️ | Only when the deployment genuinely outgrows something simpler. |

---

## 3. The recommended V1, in one paragraph

**[PROPOSED]** A public news site (homepage, category pages, article pages) that
is fast, mobile-friendly, accessible and properly indexed. A private back-office
where editors write, save drafts, attach sources and images, and submit for
review. An admin area with a review queue where admins approve and publish,
request changes, or reject — plus user management, categories, sources,
unpublishing, and a record of who did what. Nothing else.

Everything else on your future list stays on the list.

---

## 4. What V1 deliberately does *not* have — and why that is correct

| Left out | Why leaving it out is the right call |
|---|---|
| Scheduled publishing | Introduces background processing before we have proven the foreground works. |
| Tags, related stories, trending | All depend on having a body of content and traffic that does not exist yet. |
| Reader accounts and comments | Bring accounts, moderation, abuse handling and privacy obligations — a second product. |
| AI features | Cannot design an AI editorial workflow before the human editorial workflow is proven in daily use. |
| Advanced search | The most common excuse for adopting heavy infrastructure early. |
| Configurable workflows | Configurability multiplies test cases. Build one workflow that works first. |
| Microservices and orchestration | A single well-built application will comfortably serve this product for a long time. |

---

## 5. Suggested sequence after V1 — [PROPOSED]

Not commitments; a sensible order based on what unlocks what.

**Phase 2 — editorial comfort**
Scheduled publishing · email notifications · homepage curation · richer media ·
author pages

**Phase 3 — reader growth**
Tags · related stories · better search · newsletter · analytics for editors

**Phase 4 — scale and intelligence**
Trending · clustering · recommendations · semantic search · AI-assisted
editorial tooling

Each phase should re-run the same test: *does a real need justify this, and what
requirement does it trace back to?*

---

## 6. V1 "definition of done" — [PROPOSED]

V1 is finished when all of the following are demonstrably true:

1. An editor can write, save, submit, receive feedback, revise and resubmit.
2. An admin can review, approve, publish, request changes, and reject.
3. A published article is publicly visible; nothing else is, by any route
   including a guessed address.
4. Business rules `BR-01` to `BR-16` each have an automated test that fails if the
   rule is broken.
5. The public site meets the agreed performance and accessibility targets.
6. Search engines can index published articles, and shared links preview
   correctly.
7. Backups run and a restore has actually been tested.
8. For every published article, the record shows who wrote it, who published it,
   and when.
9. Every requirement in `02-requirements.md` is either implemented, explicitly
   deferred, or explicitly dropped — with none silently forgotten.
