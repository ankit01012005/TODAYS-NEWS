# 02 — Requirements

**Stage:** Product discovery (pre-development)
**Last updated:** 2026-09-08

This document lists **what the product must do**, written so that a non-engineer
can read it. It does not say *how* anything is built.

---

## 0. How requirements are numbered

Each requirement has a permanent ID. IDs never get reused, even if a requirement
is deleted, so that a discussion from six months ago still makes sense.

| Prefix | Area |
|---|---|
| `CAP-` | Core product capability |
| `PUB-` | Public reader website |
| `EDT-` | Editor CMS |
| `ADM-` | Admin CMS |
| `WKF-` | Editorial workflow |
| `SRC-` | Sources and content management |
| `USR-` | Users, accounts, authentication |
| `BR-`  | Business rule (a rule the system must never break) |
| `SEC-` | Security |
| `SEO-` | Search engine visibility |
| `PRF-` | Performance |
| `SCL-` | Scalability |
| `A11Y-`| Accessibility |
| `OPS-` | Operations, backup, monitoring |

Labels **[CONFIRMED] / [PROPOSED] / [ASSUMPTION] / [OPEN]** are used exactly as
defined in `01-product-vision.md`.

---

## F. Core product capabilities

The smallest set of things the platform must be able to do at all.

| ID | Capability | Status |
|---|---|---|
| CAP-01 | Staff can sign in to a private back-office; the public cannot reach it | [CONFIRMED] |
| CAP-02 | An editor can create an article and save it privately as a draft | [CONFIRMED] |
| CAP-03 | An editor can submit an article for admin review | [CONFIRMED] |
| CAP-04 | An admin can see everything awaiting review in one place | [CONFIRMED] |
| CAP-05 | An admin can approve and publish an article | [CONFIRMED] |
| CAP-06 | An admin can reject an article | [CONFIRMED] |
| CAP-07 | An admin can request changes, with written feedback | [CONFIRMED] |
| CAP-08 | An editor can act on requested changes and resubmit | [CONFIRMED] |
| CAP-09 | Published articles appear on the public website | [CONFIRMED] |
| CAP-10 | Unpublished content is never reachable by the public | [CONFIRMED] |
| CAP-11 | Sources are entered and maintained manually by authorised staff | [CONFIRMED] |
| CAP-12 | An article can reference its sources | [CONFIRMED] |
| CAP-13 | Admins can create, deactivate and manage staff user accounts | [CONFIRMED] |
| CAP-14 | Admins can manage editorial configuration (e.g. categories) | [CONFIRMED] |
| CAP-15 | Every state change of an article is recorded with who and when | [PROPOSED] — see OQ-11 |
| CAP-16 | A published article can be corrected without losing the record of what changed | [PROPOSED] — see OQ-08 |
| CAP-17 | A published article can be removed from public view (unpublish) | [PROPOSED] — see OQ-16 |

---

## I. Public reader experience

**Plain-language framing:** this is the news site itself. It has to feel like a
real publication, not a demo.

| ID | Requirement | Status |
|---|---|---|
| PUB-01 | Homepage showing the latest published articles, newest first | [CONFIRMED] |
| PUB-02 | Article page showing headline, summary, body, author name, publish date and image | [CONFIRMED] |
| PUB-03 | Only articles in the `PUBLISHED` state are reachable publicly | [CONFIRMED] |
| PUB-04 | Every article has a stable, human-readable web address (slug) | [PROPOSED] — see OQ-20 |
| PUB-05 | Category / section pages listing articles in that section | [PROPOSED] — see OQ-18 |
| PUB-06 | Pagination or "load more" on listing pages | [PROPOSED] |
| PUB-07 | Author page showing that author's published articles | [PROPOSED] — future candidate |
| PUB-08 | Article page shows its sources, when the article has any | [PROPOSED] — see OQ-24 |
| PUB-09 | Correction / update notice shown when a published article has been materially changed | [PROPOSED] — see OQ-09 |
| PUB-10 | Basic site search over published articles | [PROPOSED] — see OQ-19 |
| PUB-11 | Share links / correct link previews on social platforms | [PROPOSED] |
| PUB-12 | Sensible "not found" page for unpublished, removed or mistyped addresses | [PROPOSED] |
| PUB-13 | The site is usable on phones, tablets and desktops | [CONFIRMED] |
| PUB-14 | Static pages (About, Contact, Editorial policy, Privacy) | [ASSUMPTION] — a real publication needs these; confirm |

**[ASSUMPTION]** The public site is read-only. Readers submit nothing — no
comments, no tips form, no newsletter signup in V1.

---

## K. Editor experience

**Plain-language framing:** the writer's desk. Success here is measured in
friction removed, not features added.

| ID | Requirement | Status |
|---|---|---|
| EDT-01 | Sign in to the editor back-office | [CONFIRMED] |
| EDT-02 | See a list of the editor's own articles with their current state | [CONFIRMED] |
| EDT-03 | Create a new article | [CONFIRMED] |
| EDT-04 | Enter headline, summary, body, category, image and sources | [PROPOSED] |
| EDT-05 | Save as draft at any time, repeatedly, without submitting | [CONFIRMED] |
| EDT-06 | Automatic save of in-progress work to prevent loss | [PROPOSED] — see OQ-26 |
| EDT-07 | Submit for review | [CONFIRMED] |
| EDT-08 | Cannot publish, under any circumstance | [CONFIRMED] |
| EDT-09 | See admin feedback when changes are requested | [CONFIRMED] |
| EDT-10 | Edit and resubmit after changes are requested | [CONFIRMED] |
| EDT-11 | See why an article was rejected | [PROPOSED] — see OQ-15 |
| EDT-12 | Preview the article as a reader would see it, before submitting | [PROPOSED] |
| EDT-13 | Be notified when an article is approved, rejected, or needs changes | [PROPOSED] — see OQ-25 |
| EDT-14 | Withdraw a submission that has not yet been reviewed | [PROPOSED] — see OQ-04 |
| EDT-15 | Upload / attach images to an article | [PROPOSED] — see OQ-21 |

**[OPEN]** Whether an editor can edit an article *while it is under review*, and
whether editors can see or edit each other's articles, are unresolved — OQ-03,
OQ-04, OQ-05.

---

## J. Admin experience

**Plain-language framing:** the editor-in-chief's desk. Success is measured in
how quickly and confidently a decision can be made.

| ID | Requirement | Status |
|---|---|---|
| ADM-01 | Sign in to the admin back-office | [CONFIRMED] |
| ADM-02 | A review queue of all articles awaiting review | [CONFIRMED] |
| ADM-03 | Open a submitted article and read it in full, as a reader would see it | [CONFIRMED] |
| ADM-04 | Approve and publish | [CONFIRMED] |
| ADM-05 | Request changes with a written comment (comment mandatory) | [CONFIRMED] |
| ADM-06 | Reject, with a reason | [CONFIRMED] |
| ADM-07 | See all articles across the newsroom, in any state | [PROPOSED] |
| ADM-08 | Filter / search the article list by state, author, category, date | [PROPOSED] |
| ADM-09 | Create, edit, deactivate staff accounts and assign roles | [CONFIRMED] |
| ADM-10 | Manage categories / sections | [PROPOSED] — see OQ-18 |
| ADM-11 | Manage the source list | [CONFIRMED] |
| ADM-12 | Unpublish a live article | [PROPOSED] — see OQ-16 |
| ADM-13 | Edit an article written by an editor | [PROPOSED] — see OQ-02 |
| ADM-14 | View the history of a given article (who did what, when) | [PROPOSED] — see OQ-11 |
| ADM-15 | Choose what appears on the homepage / feature a story | [OPEN] — see OQ-17 |
| ADM-16 | Schedule an article to publish at a future time | [OPEN] — see OQ-07 |
| ADM-17 | Archive articles | [PROPOSED] — see OQ-13 |

---

## L. Content and source management

### L.1 The article itself

**[PROPOSED]** An article is made of:

| Field | Purpose | Notes |
|---|---|---|
| Headline | The main title | Required |
| Summary / standfirst | 1–2 sentences; also used in listings, search results and link previews | Required — matters a lot for SEO |
| Body | The story itself | Required; format is **[OPEN]**, see OQ-22 |
| Author | Who wrote it | See OQ-06 (multiple authors?) and OQ-23 (byline vs account) |
| Category / section | Where it belongs on the site | See OQ-18 |
| Featured image + alt text + credit | Listing thumbnail, link preview, accessibility, image rights | See OQ-21 |
| Tags | Finer-grained topics | **[PROPOSED]** future, not V1 |
| Sources | Where the information came from | See OQ-24 |
| Slug | The article's web address | See OQ-20 |
| State | Draft / In review / Published etc. | See `04-article-lifecycle.md` |
| Timestamps | Created, last updated, submitted, published | |

### L.2 Sources

| ID | Requirement | Status |
|---|---|---|
| SRC-01 | Sources are created and maintained manually by authorised staff | [CONFIRMED] |
| SRC-02 | A source has at minimum a name and, where applicable, a link | [PROPOSED] |
| SRC-03 | An article can reference one or more sources | [PROPOSED] — see OQ-24 |
| SRC-04 | Sources are reusable across articles (a shared list, not free text per article) | [PROPOSED] — see OQ-24 |
| SRC-05 | Sources carry a verification / trust status | [OPEN] — see OQ-14 |
| SRC-06 | Who may create sources: admins only, or editors too? | [OPEN] — see OQ-14 |
| SRC-07 | Sources may be shown publicly on the article page | [PROPOSED] — see OQ-24 |

**[CONFIRMED]** No automated source ingestion. Nothing fetches, scrapes, or
subscribes to external feeds.

### L.3 Users

| ID | Requirement | Status |
|---|---|---|
| USR-01 | Staff accounts are created by an admin; no public self-registration | [ASSUMPTION] — see OQ-27 |
| USR-02 | Each account has exactly one role | [PROPOSED] — see `03-user-roles-and-permissions.md` |
| USR-03 | Accounts can be deactivated without deleting their past work | [PROPOSED] |
| USR-04 | Sign-in requires a password; passwords are stored irreversibly hashed | [PROPOSED] |
| USR-05 | Password reset flow | [PROPOSED] |
| USR-06 | Two-factor authentication for admins | [PROPOSED] — see OQ-28 |
| USR-07 | The system always has at least one active admin | [PROPOSED] — see BR-14 |

---

## M. Important business rules

A business rule is something the system must **never** allow to be violated, no
matter which screen or path is used. These are the statements that later become
automated tests.

| ID | Rule | Status |
|---|---|---|
| BR-01 | An article is publicly visible **only** in the `PUBLISHED` state | [CONFIRMED] |
| BR-02 | Only a user with the admin role may publish | [CONFIRMED] |
| BR-03 | Saving a draft never makes anything public | [CONFIRMED] |
| BR-04 | Submitting for review never makes anything public | [CONFIRMED] |
| BR-05 | An editor may never perform a publish action, through any route | [CONFIRMED] |
| BR-06 | Every publish action records which admin performed it and when | [PROPOSED] |
| BR-07 | "Request changes" requires a non-empty comment | [PROPOSED] |
| BR-08 | "Reject" requires a non-empty reason | [PROPOSED] |
| BR-09 | An article must have headline, summary and body before it can be submitted | [PROPOSED] |
| BR-10 | Article state changes only follow the transitions defined in `04-article-lifecycle.md`; any other transition is refused | [PROPOSED] |
| BR-11 | Rules are enforced on the server; the interface only reflects them | [PROPOSED] |
| BR-12 | Deleting content is soft by default — content is retained and hidden, not erased | [PROPOSED] — see OQ-12 |
| BR-13 | ~~An admin may not approve or publish an article they wrote or last revised. A second admin must review it~~ | **[SUPERSEDED]** — resolved 2026-09-11. Moot: admin can no longer author or own an article at all (see `03-user-roles-and-permissions.md` §2.3), so self-approval is structurally impossible rather than merely forbidden. Originally confirmed 2026-09-09; see `26-data-model-decisions.md` §2 for that history |
| BR-14 | Exactly one active admin exists at all times — never zero, never more than one | **[CONFIRMED]** — extended 2026-09-11 from "at least one" to "exactly one," now that a second admin is no longer needed to review a self-authored article (BR-13, superseded) |
| BR-15 | A published article's web address does not change when it is edited | [PROPOSED] — see OQ-20 |
| BR-16 | Editing a published article does not change what the public sees until an admin approves the change | [PROPOSED] — see OQ-08 |

---

## N. Security considerations

**Plain-language framing:** a news platform is a target. Its two crown jewels are
*the ability to publish* and *unpublished stories*. Both must be defended.

| ID | Requirement | Status |
|---|---|---|
| SEC-01 | Every permission check happens on the server, on every request | [PROPOSED] |
| SEC-02 | Hiding a button is not a permission check | [PROPOSED] |
| SEC-03 | Knowing an article's address must not reveal it before publication | [PROPOSED] |
| SEC-04 | Passwords stored using a modern one-way hashing method, never recoverable | [PROPOSED] |
| SEC-05 | Sessions expire; sign-out works everywhere; sessions end when an account is deactivated | [PROPOSED] |
| SEC-06 | Protection against the standard web attack classes: injection, cross-site scripting, cross-site request forgery, insecure direct object access | [PROPOSED] |
| SEC-07 | Article body content is sanitised so a contributor cannot inject scripts into the public site | [PROPOSED] — critical if rich text is used, see OQ-22 |
| SEC-08 | All traffic over HTTPS | [PROPOSED] |
| SEC-09 | Rate limiting / brute-force protection on sign-in | [PROPOSED] |
| SEC-10 | Uploaded files are validated by type and size, and cannot be executed | [PROPOSED] — see OQ-21 |
| SEC-11 | Audit trail is append-only and cannot be edited by any role | [PROPOSED] — see OQ-11 |
| SEC-12 | Secrets and credentials never live in source code | [PROPOSED] |
| SEC-13 | Two-factor authentication for accounts that can publish | [PROPOSED] — see OQ-28 |
| SEC-14 | Personal data handled per applicable privacy law | [OPEN] — see OQ-32 |

---

## O. SEO considerations

**Plain-language framing:** for most news sites, search and social are where the
readers come from. SEO here means "be readable by machines", not tricks.

| ID | Requirement | Status |
|---|---|---|
| SEO-01 | Article content is present in the HTML the server sends, not assembled later in the browser | [PROPOSED] |
| SEO-02 | One clear `<h1>` per page and a sensible heading structure | [PROPOSED] |
| SEO-03 | Per-article title and description metadata, editable by staff | [PROPOSED] |
| SEO-04 | Open Graph / social metadata so shared links show a proper title, summary and image | [PROPOSED] |
| SEO-05 | Structured data marking pages as news articles (headline, author, publish date) | [PROPOSED] |
| SEO-06 | Clean, stable, human-readable addresses | [PROPOSED] — see OQ-20 |
| SEO-07 | Canonical address declared for every page, to avoid duplicate-content penalties | [PROPOSED] |
| SEO-08 | Automatically maintained sitemap of published articles | [PROPOSED] |
| SEO-09 | `robots.txt`; back-office and unpublished content excluded from indexing | [PROPOSED] |
| SEO-10 | Correct HTTP status codes — 404 for missing, 301 for permanently moved | [PROPOSED] |
| SEO-11 | Machine-readable publish and update timestamps | [PROPOSED] |
| SEO-12 | Images have descriptive alt text (also an accessibility requirement) | [PROPOSED] |
| SEO-13 | RSS feed | [PROPOSED] — cheap, still used by aggregators; candidate for V1 |
| SEO-14 | Unpublishing removes the article from the sitemap and returns a correct status code | [PROPOSED] |

---

## Accessibility

**[CONFIRMED]** The platform must be accessible.
**[PROPOSED]** Target WCAG 2.1 Level AA for the public site. **[OPEN]** — OQ-33.

| ID | Requirement | Status |
|---|---|---|
| A11Y-01 | All functionality reachable by keyboard alone | [PROPOSED] |
| A11Y-02 | Text contrast meets AA thresholds | [PROPOSED] |
| A11Y-03 | Images carry meaningful alt text; decorative images marked as such | [PROPOSED] |
| A11Y-04 | Semantic HTML structure, so screen readers can navigate headings and landmarks | [PROPOSED] |
| A11Y-05 | Visible focus indicators | [PROPOSED] |
| A11Y-06 | Text resizes without breaking layout | [PROPOSED] |
| A11Y-07 | The back-office is keyboard-operable too (staff may also have disabilities) | [PROPOSED] |

---

## P. Performance considerations

**Plain-language framing:** news traffic is bursty and mostly mobile. A story can
go from 0 to very busy in minutes. The public site must stay fast under that.

| ID | Requirement | Status |
|---|---|---|
| PRF-01 | Article and listing pages respond quickly under normal load | [CONFIRMED] — **[OPEN]** numeric target, OQ-30 |
| PRF-02 | Public pages are cacheable, because published content is the same for everyone | [PROPOSED] |
| PRF-03 | Newly published or corrected articles appear promptly despite caching | [PROPOSED] |
| PRF-04 | Images are resized/compressed and served at appropriate sizes for the device | [PROPOSED] |
| PRF-05 | The reader downloads only what the page needs | [PROPOSED] |
| PRF-06 | Listing pages never load an unbounded number of articles | [PROPOSED] |
| PRF-07 | Public read performance is not degraded by back-office activity | [PROPOSED] |
| PRF-08 | Core Web Vitals (loading, interaction, layout stability) tracked as launch criteria | [PROPOSED] |
| PRF-09 | Back-office responsiveness matters less than public site speed, but must not be painful | [PROPOSED] |

**[PROPOSED] Design consequence:** the public site is overwhelmingly *reads* of
content that changes rarely. That is the easiest performance profile there is —
it should be exploited with caching before any heavier machinery is considered.

---

## Q. Scalability considerations

**Plain-language framing:** scalability means "we can grow without rewriting".
It does **not** mean "build for millions on day one".

| ID | Requirement | Status |
|---|---|---|
| SCL-01 | Article count grows indefinitely; nothing may assume all articles fit on one page or in memory | [PROPOSED] |
| SCL-02 | Traffic spikes on a single story must not take the site down | [PROPOSED] |
| SCL-03 | Newsroom size may grow from a handful to dozens of staff | [PROPOSED] |
| SCL-04 | The data model must accommodate later features (tags, multiple authors, versions) without redesign | [PROPOSED] |
| SCL-05 | Serve more readers by adding capacity, not by rewriting | [PROPOSED] |
| SCL-06 | Media storage grows continuously and must not be bound to one machine's disk | [PROPOSED] |
| SCL-07 | Deliberately **not** in scope: multi-region, sharding, microservices, event streaming — until a measured need exists | [CONFIRMED] |

**[ASSUMPTION]** Expected scale is a normal digital publication: tens of articles
per day at most, thousands to low millions of monthly readers. If the real target
is far larger, several decisions change — please confirm, OQ-31.

---

## Operations

| ID | Requirement | Status |
|---|---|---|
| OPS-01 | Regular automated backups with a tested restore procedure | [PROPOSED] |
| OPS-02 | Error and uptime monitoring with alerting | [PROPOSED] |
| OPS-03 | Deployments do not require taking the public site down | [PROPOSED] |
| OPS-04 | Separate staging environment for testing before release | [PROPOSED] |
| OPS-05 | Basic traffic analytics | [PROPOSED] — see OQ-34 |

---

## R. Potential future capabilities

**[CONFIRMED]** Named as possible directions; none are V1 requirements. Detailed
in `06-v1-vs-future.md`.

Advanced search · recommendations · related stories · trending news · story
clustering · article tagging · author pages · analytics · AI-assisted editorial
workflows · AI-generated summaries · semantic search · personalisation ·
notifications · social sharing · content versioning · scheduled publishing.

**[PROPOSED]** Additional future candidates worth naming now, because they
influence how the data is shaped later: newsletters, RSS, comments/moderation,
paywall or membership, multi-language editions, a public API, live blogs, and
media galleries.

---

## Traceability

**[CONFIRMED]** Every important requirement should eventually be traceable:

```
Requirement → User workflow → Page/UI → Backend behaviour → Data model → Test
```

This table is deliberately mostly empty. The right-hand columns get filled in as
later phases happen; the left column already exists, which is what makes the
tracing possible at all.

| Requirement | Workflow | Page / UI | Backend behaviour | Data model | Test |
|---|---|---|---|---|---|
| CAP-02 / EDT-05 | Editor saves draft | *TBD* | *TBD* | *TBD* | *TBD* |
| CAP-03 / EDT-07 | Editor submits for review | *TBD* | *TBD* | *TBD* | *TBD* |
| CAP-05 / ADM-04 | Admin approves and publishes | *TBD* | *TBD* | *TBD* | *TBD* |
| CAP-07 / ADM-05 | Admin requests changes | *TBD* | *TBD* | *TBD* | *TBD* |
| CAP-06 / ADM-06 | Admin rejects | *TBD* | *TBD* | *TBD* | *TBD* |
| CAP-08 / EDT-10 | Editor resubmits | *TBD* | *TBD* | *TBD* | *TBD* |
| BR-01 | Reader requests an unpublished article | *TBD* | *TBD* | *TBD* | *TBD* |
| BR-05 | Editor attempts to publish | *TBD* | *TBD* | *TBD* | *TBD* |

**[PROPOSED] Rule:** a requirement is not "done" until it has a row here with a
test in the last column. Business rules `BR-01` to `BR-16` are the highest
priority for test coverage, because they are the ones that must never break.
