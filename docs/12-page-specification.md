# 12 — Page Specification

**Stage:** Phase 2 — product mapping
**Last updated:** 2026-09-08
**Covers:** every page in V1 — what it is for, what it needs, who may open it, and what can go wrong on it

No routes, no code, no visual design. "Path concept" describes the *shape* of an
address so we can discuss structure; the actual addressing is decided later.

Labels: **[CONFIRMED] / [PROVISIONAL] / [FUTURE] / [NEW ISSUE]**.

---

## 0. The standard states

Rather than repeating them 36 times, here is the vocabulary. Each page below
lists only the states that are *notable or unusual* for it.

| State | What it means | The rule |
|---|---|---|
| **Loading** | Content on its way | Public pages arrive complete *(SEO-01)*, so this is rare there; common in the back-office |
| **Success** | The normal, populated page | — |
| **Empty** | Nothing to show, and that is fine | Must explain and offer a next step — never a blank area or a spinner that never ends |
| **Error** | Something broke on our side | Plain apology, a way out, **never** technical detail *(SEC-06)* |
| **Not found** | The thing does not exist | Must be indistinguishable from "exists but you may not see it" *(SEC-03)* |
| **Unauthorised** | Not signed in | Send to sign-in, remember where they were going |
| **Forbidden** | Signed in, not allowed | **[PROVISIONAL — P2-10]** In the back-office, say so plainly. For anything that would reveal an unpublished story's existence, behave as "not found" instead. |
| **Validation error** | The person's input needs fixing | Say what is wrong, next to the field, keeping everything they typed |
| **Confirmation** | "Are you sure?" before something consequential | Only for actions that are public, irreversible, or affect other people |
| **Saving / working** | An action is in progress | The action cannot be triggered twice |

---

# Part A — Public website

### PG-PUB-01 — Homepage **[V1]**
- **Purpose:** the publication's front page; latest published stories
- **User:** anyone, not signed in
- **Path concept:** `/`
- **Entry from:** typed address, masthead from any page, search engines, 404 page
- **Exit to:** Article, Section, Search, static pages
- **Primary action:** open a story
- **Secondary:** browse a section, search, load more
- **Data:** published stories — headline, summary, picture + its description, section, publication time, author name **[CONFIRMED — BR-01: published only]**
- **Permissions:** public
- **Notable states:** *Empty* — no stories published yet, which is the site's day-one state and must look deliberate, not broken
- **Related:** PG-PUB-02, 03, 04
- **Depends on:** OQ-17 *(ordering)*, OQ-18 *(sections in the navigation)*

### PG-PUB-02 — Section page **[V1]** — [PROVISIONAL, OQ-18]
- **Purpose:** published stories within one section
- **User:** anyone
- **Path concept:** `/{section}`
- **Entry from:** navigation, homepage, an article's section label, search engines
- **Exit to:** Article, another section, home
- **Primary action:** open a story
- **Secondary:** load more, switch section
- **Data:** section name and description; its published stories, newest first
- **Permissions:** public
- **Notable states:** *Empty* — a real and normal state for a new section; *Not found* — unknown or removed section
- **Related:** PG-PUB-01, 03
- **Depends on:** OQ-18, OQ-20

### PG-PUB-03 — Article page **[V1]** — *the most important page in the product*
- **Purpose:** the story itself
- **User:** anyone — most arrive here first, from a search engine or a shared link
- **Path concept:** `/{section}/{story-slug}` **[PROVISIONAL — OQ-20]**; fixed permanently at publication *(BR-15)*
- **Entry from:** search engines, shared links, homepage, section pages, search results, feed readers
- **Exit to:** its section, another story, home, a source *(leaves the site)*
- **Primary action:** read
- **Secondary:** share, open a source, read a related story
- **Data:** headline, summary, body, author name, publication time, updated time, section, picture + description + credit, sources **[PROVISIONAL — OQ-24]**, correction notice if any **[PROVISIONAL — OQ-09]**, search-engine and social metadata *(SEO-03, 04, 05)*
- **Permissions:** public — **only** in `PUBLISHED` state *(BR-01)*
- **Notable states:** *Not found* — never published, wrong address, or withdrawn, and all three must look identical to a stranger *(SEC-03)*; *Withdrawn notice* — **[PROVISIONAL — OQ-16]**
- **Related:** everything
- **Depends on:** OQ-08, OQ-09, OQ-16, OQ-20, OQ-21, OQ-22, OQ-23, OQ-24

### PG-PUB-04 — Search results **[V1?]** — [PROVISIONAL, OQ-19]
- **Purpose:** find a published story by keyword
- **User:** anyone
- **Path concept:** `/search?q=...`
- **Entry from:** the search box in the masthead; the 404 and empty pages
- **Exit to:** Article, home
- **Primary action:** open a result
- **Secondary:** refine the search
- **Data:** the term as typed *(displayed back safely — SEC-06)*, number of matches, matching stories
- **Permissions:** public; published stories only *(BR-01)*
- **Notable states:** *Empty* — no matches, with recent stories offered instead; *Empty query* — prompt rather than error
- **Related:** PG-PUB-01, 03, 09
- **[NEW ISSUE P2-27]** Search result pages should almost certainly be excluded from search-engine indexing — they generate unlimited low-value pages. Phase 1 did not address it.

### PG-PUB-05 — About **[V1]**
- **Purpose:** who the publication is; a credibility signal for readers and search engines
- **Path concept:** `/about` · **Entry:** footer, search engines · **Exit:** home, contact
- **Data:** static text **[NEW ISSUE P2-29]** — nobody has said whether staff can edit these pages themselves or whether they are fixed at build time and changed by a developer
- **Permissions:** public

### PG-PUB-06 — Contact **[V1]**
- **Purpose:** how to reach the newsroom
- **Path concept:** `/contact` · **Entry:** footer · **Exit:** home
- **Data:** email address, postal address if any, corrections contact
- **Permissions:** public
- **[NEW ISSUE P2-03]** **Information only, no form.** Phase 1 states the public site is read-only and readers submit nothing. A contact form would contradict that, and brings spam handling, abuse, and personal-data obligations with it. If a form is wanted, it is a scope change, not a detail.

### PG-PUB-07 — Editorial policy and corrections **[V1]** — [PROVISIONAL]
- **Purpose:** how the publication handles accuracy, corrections and withdrawals — the page that makes a correction notice mean something
- **Path concept:** `/editorial-policy` · **Entry:** footer, correction notices on articles
- **Permissions:** public · **Depends on:** OQ-41 *(the policy itself must exist before the page can describe it)*

### PG-PUB-08 — Privacy policy **[V1]**
- **Purpose:** legally required disclosure about data handling
- **Path concept:** `/privacy` · **Entry:** footer, any consent banner
- **Permissions:** public · **Depends on:** OQ-32, OQ-34

### PG-PUB-09 — Page not found **[V1]**
- **Purpose:** recover a lost reader; tell search engines the address is gone
- **Path concept:** any unmatched address
- **Entry from:** wrong addresses, old links, unpublished or withdrawn stories
- **Exit to:** home, sections, search
- **Data:** recent stories and section links, so the page is useful rather than a dead end
- **Permissions:** public
- **Critical:** must return the correct "not found" response *(SEO-10)*, and must look identical whether the story never existed or merely is not published *(SEC-03)*

### PG-PUB-10 — Something went wrong **[V1]**
- **Purpose:** a dignified failure
- **Entry from:** any unexpected fault
- **Data:** apology, link home. **Never** technical detail *(SEC-06)*
- **Permissions:** public

### PG-PUB-11 — Story withdrawn **[V1?]** — [PROVISIONAL, OQ-16]
- **Purpose:** tell readers arriving on an old link that a story was deliberately withdrawn
- **Data:** short notice, date, link to editorial policy
- **Permissions:** public
- Exists only if OQ-16 is answered with the "withdrawal notice" option

### PG-PUB-M1/M2/M3 — Sitemap, crawler rules, news feed **[V1]**
- **Purpose:** machine-facing; not pages people visit
- **Path concept:** `/sitemap.xml`, `/robots.txt`, `/feed`
- **Data:** M1 — every published story with its address and last update *(SEO-08)*; M2 — instruction that the back-office is never indexed *(SEO-09)*; M3 — recent stories, summaries not full text **[PROVISIONAL]**
- **Critical:** withdrawn stories must leave M1 and M3 immediately *(SEO-14)*

---

# Part B — Editor CMS

### PG-EDT-01 — Staff sign-in **[V1]**
- **Purpose:** the only door into the back-office
- **User:** editors and admins **[PROVISIONAL — P2-04: one page for both]**
- **Path concept:** `/staff/sign-in`
- **Entry from:** typed address, an expired session, an invitation email
- **Exit to:** editor dashboard, admin dashboard, or two-step verification — whichever the role and settings dictate
- **Primary action:** sign in · **Secondary:** forgot password
- **Data required:** email, password. Nothing about the newsroom is displayed here
- **Permissions:** public page, but reveals nothing
- **Notable states:** *Validation* — missing fields; *Failure* — **one generic message** for wrong password, unknown account and deactivated account alike **[PROVISIONAL — P2-11]**; *Rate limited* — after repeated failures *(SEC-09)*; *Session expired* — explains why they are here and returns them afterwards
- **Related:** PG-EDT-02, 03, 04

### PG-EDT-02 — Two-step verification **[V1?]** — [PROVISIONAL, OQ-28]
- **Purpose:** second factor, strongly recommended for admins
- **Entry from:** successful password entry · **Exit to:** the relevant dashboard
- **Notable states:** validation, expired code, too many attempts

### PG-EDT-03 — Forgot password **[V1]**
- **Purpose:** start a password reset
- **Primary action:** request a reset link
- **Notable states:** *Success* — **[PROVISIONAL]** the same confirmation whether or not the address belongs to an account; anything else confirms which emails are staff

### PG-EDT-04 — Set password / accept invitation **[V1]**
- **Purpose:** a new member of staff sets their own password; also completes a reset
- **Entry from:** an emailed link · **Exit to:** dashboard
- **Notable states:** *Invalid or expired link* — with a way to request a new one; *Validation* — password requirements
- **Depends on:** OQ-27

### PG-EDT-05 — Editor dashboard **[V1]**
- **Purpose:** answer "what needs me today?" in one second
- **User:** editor
- **Path concept:** `/staff`
- **Entry from:** sign-in, the masthead of the back-office
- **Exit to:** article editor, My Articles, profile
- **Primary action:** open whatever needs attention
- **Secondary:** start a new story
- **Data:** own stories grouped by state; changes-requested first
- **Permissions:** signed-in editor
- **Notable states:** *Empty* — a first-day invitation to write, not an empty grid
- **[NEW ISSUE P2-06]** Phase 1 never specified dashboard content; §3 of `09-editor-flow.md` proposes a minimum

### PG-EDT-06 — My Articles **[V1]**
- **Purpose:** everything this editor has written, and where each stands
- **Path concept:** `/staff/articles`
- **Entry from:** dashboard, after submitting, after saving
- **Exit to:** article editor, read-only view, preview
- **Primary action:** open a story
- **Secondary:** filter by state, search by headline, sort, start a new story
- **Data:** own stories with state, section, last updated, submitted time, admin feedback summary
- **Permissions:** own stories only **[PROVISIONAL — OQ-05]**
- **Notable states:** *Empty* overall; *Empty for a filter* — "nothing in changes requested" is good news and should read that way
- **[PROVISIONAL — P2-05]** Drafts / Waiting / Changes requested / Published / Rejected are **filters here**, not five separate pages

### PG-EDT-07 — Article editor **[V1]** — *the editor's main workspace*
- **Purpose:** write and revise a story
- **User:** the owning editor; an admin **[PROVISIONAL — OQ-02]**
- **Path concept:** `/staff/articles/{id}/edit`
- **Entry from:** "write new", My Articles, dashboard, admin review page
- **Exit to:** preview, My Articles *(after submitting)*, back
- **Primary action:** **Submit for review** *(never publish — `BR-05`)*
- **Secondary:** save draft, preview, attach picture, choose section, attach sources, edit search-engine title and description
- **Data required:** the story and its fields; the list of sections; the list of sources; admin feedback if the story was sent back
- **Permissions:** owner or admin; **[PROVISIONAL — OQ-03]** read-only while `IN_REVIEW`; **[PROVISIONAL — OQ-08]** a published story opens as a *correction*, not a live edit
- **Notable states:** *Loading*; *Saving* and *Saved* indicators for autosave **[PROVISIONAL — OQ-26]**; *Autosave failed* — must be visible, never silent; *Validation* on submit — headline, summary, body *(BR-09)*; *Confirmation* on submit — explains the story locks; *Locked* — read-only with an explanation; *Unsaved changes* warning on leaving; *Conflict* — someone else changed it **[NEW ISSUE P2-25]**
- **Related:** PG-EDT-08, 06; PG-ADM-03
- **Depends on:** OQ-02, OQ-03, OQ-08, OQ-21, OQ-22, OQ-24, OQ-26

### PG-EDT-08 — Article preview **[V1]**
- **Purpose:** see the story exactly as a reader would, before submitting
- **User:** the owning editor; admins
- **Path concept:** `/staff/articles/{id}/preview`
- **Entry from:** the editor; the admin review page
- **Exit to:** back to editing
- **Data:** the story rendered as the public page would render it
- **Permissions:** **critical** — signed in and entitled to see this story. **[CONFIRMED — SEC-03]**
- **[NEW ISSUE P2-07]** How preview addresses work is undecided and carries a real leak risk. A guessable or shareable preview address is a route to reading unpublished stories, which is precisely what `SEC-03` forbids.

### PG-EDT-09 — Article read-only view **[V1?]**
- **Purpose:** read a story that cannot currently be edited — in review, rejected, published, or archived
- **Entry from:** My Articles · **Exit to:** My Articles; withdraw **[PROVISIONAL — OQ-04]**
- **Data:** the story, its state, its feedback history
- Exists only if OQ-03 locks articles during review

### PG-EDT-10 — My profile **[V1]**
- **Purpose:** manage own name, password, and display byline
- **Path concept:** `/staff/profile`
- **Primary action:** save changes · **Secondary:** change password, set up two-step verification
- **Permissions:** own account only. **[CONFIRMED]** Nobody can change their own role
- **Notable states:** validation, current-password required to set a new one, success confirmation
- **Depends on:** OQ-23 *(is the byline separate from the account?)*

### PG-EDT-11 — Access denied **[V1]**
- **Purpose:** a signed-in user reached something not theirs
- **Data:** plain explanation, link back to their dashboard
- **Critical:** **[PROVISIONAL — P2-10]** must not confirm that a particular story exists. Where that risk applies, behave as "not found" instead.

---

# Part C — Admin CMS

Admins reuse PG-EDT-01/02/03/04 *(sign-in)*, PG-EDT-07 *(editor)*, PG-EDT-08
*(preview)* and PG-EDT-10 *(profile)*.

### PG-ADM-01 — Admin dashboard **[V1]**
- **Purpose:** what needs a decision right now
- **Path concept:** `/staff` *(role decides what is shown)*
- **Exit to:** review queue, all articles, management pages
- **Primary action:** go to the review queue
- **Data:** count waiting, oldest wait time, recently published, stories sitting with editors
- **Permissions:** admin only
- **Notable states:** *Empty* — "nothing is waiting", a success message rather than a blank page
- **[NEW ISSUE P2-06]** Content not specified in Phase 1

### PG-ADM-02 — Review queue **[V1]** — *the admin's main workspace*
- **Purpose:** every story awaiting a decision
- **Path concept:** `/staff/review`
- **Entry from:** dashboard, after any decision, notification badge
- **Exit to:** article review
- **Primary action:** open a story to review
- **Secondary:** filter by section or author, sort
- **Data:** for each — headline, author, section, submitted time, how long waiting, whether previously sent back
- **Permissions:** admin only *(CAP-04)*
- **Notable states:** *Empty* — success; *Stale* — a story has been decided by another admin since the list loaded **[NEW ISSUE P2-23]**
- **[PROVISIONAL]** Ordered oldest-first, so the longest-waiting editor is served first

### PG-ADM-03 — Article review **[V1]** — *where publication happens*
- **Purpose:** read a submitted story and decide
- **Path concept:** `/staff/review/{id}`
- **Entry from:** review queue, all articles, dashboard
- **Exit to:** review queue *(after any decision)*, article editor, article history
- **Primary action:** **Approve & publish**
- **Secondary:** request changes, reject, edit directly **[PROVISIONAL — OQ-02]**, view history, preview
- **Data:** the full story as a reader would see it; author; submitted time; section; sources; picture credit; previous feedback; **[PROVISIONAL — OQ-26]** what changed since the last submission
- **Permissions:** **admin only** *(BR-02)* — the single most important permission check in the product
- **Notable states:**
  - *Loading* → *Story loaded*
  - *Approve* → **Confirmation** → *Publishing* → *Published* → returns to queue
  - *Request changes* → comment required → **validation if empty** *(BR-07)* → *Changes requested* → returns to queue
  - *Reject* → reason required → **validation if empty** *(BR-08)* → **Confirmation** → *Rejected* → returns to queue
  - *Already decided* — another admin got there first; the action is refused cleanly **[P2-23]**
  - *Self-authored* — **[CONFIRMED — `BR-13`, resolved 2026-09-09]** refused: the Approve & publish control is **not rendered**, and the panel says another admin must approve. Request changes and Reject remain available
- **Related:** PG-ADM-02, 04, 05; PG-EDT-07, 08

### PG-ADM-04 — All articles **[V1]**
- **Purpose:** every story in the newsroom, in any state; also serves "manage published articles"
- **Path concept:** `/staff/articles/all`
- **Primary action:** open a story
- **Secondary:** filter by state / author / section / date, search by headline, withdraw, archive
- **Data:** all stories with state, author, section, dates, publisher
- **Permissions:** admin only
- **Notable states:** empty, empty-for-filter, confirmation dialogs for withdraw and archive

### PG-ADM-05 — Article history **[V1?]** — [PROVISIONAL, OQ-11]
- **Purpose:** who did what to this story, and when
- **Path concept:** `/staff/articles/{id}/history`
- **Entry from:** article review, all articles
- **Data:** every state change — actor, time, from-state, to-state, comment or reason
- **Permissions:** admin only
- **Critical:** read-only for everyone, including admins *(SEC-11)*. A record that can be edited is not a record.

### PG-ADM-06 — Users **[V1]**
- **Purpose:** the newsroom's staff
- **Path concept:** `/staff/users`
- **Primary action:** invite someone · **Secondary:** filter by role or status, open a user
- **Data:** name, email, role, status, last sign-in, article counts
- **Permissions:** admin only *(CAP-13)*
- **[PROVISIONAL — P2-04]** One page with a role filter, rather than separate "Users" and "Editors" pages

### PG-ADM-07 — User detail / invite **[V1]**
- **Purpose:** create, edit, deactivate a staff account
- **Path concept:** `/staff/users/{id}` and `/staff/users/invite`
- **Primary action:** save · **Secondary:** change role, deactivate, reactivate, resend invitation
- **Permissions:** admin only
- **Notable states:** validation *(duplicate email)*; confirmation on role change and deactivation; **blocked** — the last active admin cannot be deactivated or demoted *(BR-14)*, and the system must refuse it rather than warn
- **[NEW ISSUE P2-20]** What happens to a deactivated editor's drafts and submissions is undefined

### PG-ADM-08 — Sources **[V1]**
- **Purpose:** the shared, manually maintained source list *(CAP-11)*
- **Path concept:** `/staff/sources`
- **Primary action:** add a source · **Secondary:** search, filter by verification status, open one
- **Data:** name, link, verification status, how many stories use it
- **Permissions:** view — editors and admins; create — **[PROVISIONAL — OQ-14]** both; edit, delete, verify — admins only

### PG-ADM-09 — Source detail **[V1]**
- **Purpose:** view and edit one source
- **Primary action:** save · **Secondary:** mark verified *(admin)*, delete *(admin)*
- **Notable states:** validation; **blocked deletion** — **[PROVISIONAL]** a source cited by a published story is not hard-deleted, because the citation must still make sense years later

### PG-ADM-10 — Categories **[V1]** — [PROVISIONAL, OQ-18]
- **Purpose:** the sections of the site
- **Path concept:** `/staff/categories`
- **Primary action:** add a section · **Secondary:** rename, reorder, deactivate
- **Data:** name, address fragment, description, article count
- **Permissions:** admin only *(ADM-10)*
- **Notable states:** validation *(duplicate name)*; **blocked or handled deletion** — **[NEW ISSUE P2-21]** deleting a section containing published stories can break every public address inside it *(BR-15)*

### PG-ADM-11 — Settings **[V1?]**
- **Purpose:** publication-wide options
- **Path concept:** `/staff/settings`
- **Permissions:** admin only
- **[NEW ISSUE P2-08]** Phase 1 never defined what belongs here. Proposed minimum: publication name, logo, contact email, timezone for publication times *(OQ-42)*, default search-engine description, social accounts, footer links. **[NEW ISSUE P2-28]** The timezone choice is visible on every article page and in every feed — it is a reader-facing decision, not an administrative one.

---

# Part D — Responsive behaviour

**[CONFIRMED]** All three areas must work on phones, tablets and desktops. This
describes *behaviour and priority only* — no visual design.

## Public pages

Covered in detail in `08-reader-flow.md` §4. In summary: the article page keeps a
single comfortable reading column at every size; the headline and the start of
the story always come first; navigation collapses on small screens; smaller
pictures are sent to smaller screens *(PRF-04)*.

## Editor CMS

**[ASSUMPTION]** Editors will sometimes work on tablets, occasionally on phones —
filing from an event is a real newsroom situation. Writing a long story on a
phone is not; reading feedback and checking status on one is.

| Page | Mobile | Tablet | Desktop |
|---|---|---|---|
| Dashboard | Single column; "needs attention" first | Single or two columns | Multi-column overview |
| My Articles | Cards, not a wide table; state shown prominently | Compact table | Full table with all columns |
| Article editor | **[PROVISIONAL]** Usable for short edits and fixing feedback; not optimised for writing a long story. Formatting controls collapse; feedback appears above the story rather than beside it | Comfortable writing | Full workspace; feedback alongside |
| Preview | Doubles as the mobile-reader check | Same | Should offer a mobile-width view, since most readers are on phones |
| Profile | Single column | Single column | Single column |

**[PROVISIONAL]** The one thing that must work perfectly on a phone: an editor
reading requested changes and understanding what is being asked. Whether they can
comfortably *write* on a phone is a much lower priority.

## Admin CMS

**[ASSUMPTION]** Most admin work happens at a desk. But the decision to publish —
or to pull a story down — is exactly the thing that happens at 11pm away from a
desk, so those specific actions must work on a phone.

| Page | Mobile | Tablet | Desktop |
|---|---|---|---|
| Dashboard | Waiting count and oldest wait, first | Two columns | Full overview |
| Review queue | Cards showing headline, author, waiting time | Compact table | Full table, sortable |
| **Article review** | **Must fully work.** Story readable; approve / request changes / reject all reachable without zooming | Full | Full, with history alongside |
| All articles | Filters behind a control | Table | Full table |
| Users / Sources / Categories | List with the primary action reachable; editing possible but not optimised | Table | Full table |
| Settings | Single column | Single column | Single column |

**Applies everywhere:** keyboard operable *(A11Y-07)*; every destructive action
confirmable on a small screen without mis-taps; nothing depending on hover.

---

# Part E — Page count and traceability

| Area | V1 pages | Conditional | Future |
|---|---|---|---|
| Public | 10 + 3 machine files | 2 *(search, withdrawal notice)* | 6 |
| Editor | 10 | 2 *(two-step, read-only view)* | 2 |
| Admin | 9 | 2 *(history, settings)* | 6 |
| **Total** | **32 + 3** | **6** | **14** |

Every page above carries a permanent reference. The traceability chain from
Phase 1 can now be extended:

```
Requirement  →  Workflow          →  Page          →  [Phase 3+]
CAP-05          A-04a publish        PG-ADM-03        backend, data, test
EDT-07          E-06 submit          PG-EDT-07        backend, data, test
BR-01           R-02 / E-01          PG-PUB-03/09     backend, data, test
BR-05           §5.1 invalid moves   PG-EDT-07        backend, data, test
```

The two right-hand columns stay empty until the technology stack is chosen — that
is Phase 3, and it has not started.
