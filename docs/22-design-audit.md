# 22 — Design ↔ Requirement Audit

**Stage:** Phase 3 — visual design
**Last updated:** 2026-09-09
**Purpose:** compare what was *designed* against what the documentation *requires*, and record every mismatch without resolving any of them

**Method.** Every V1 page in `07-product-map.md` Part 2 and `12-page-specification.md`
was checked against the Figma file; every screen in the Figma file was checked
back against a page reference; the permission matrix in `03` §3 was checked
against what each designed screen actually exposes; and the seven states and
seventeen transitions in `11` were checked against the states board.

**Nothing in this document changes a requirement.** Where the design and the
documentation disagree, the documentation wins and the disagreement is recorded.

---

## 0. Summary

| | Count |
|---|---|
| V1 pages in the product map (incl. conditional) | 38 |
| Pages given a designed screen | 23 |
| **Pages with no design yet** | **13** *(+2 machine-facing, not designable)* |
| Screens designed that are **not** backed by a V1 page | **0** |
| Permission violations found in the design | **0** |
| Article states represented | 7 of 7 |
| Transitions with a UI trigger | 14 of 17 *(2 correctly absent, 1 FUTURE)* |
| Findings raised below | **27** *(24 original + `D-05`, `D-06`, `D-07`)* |
| Findings since resolved | **2** — `D-01`, `D-07` |
| Findings downgraded | **1** — `V-10`, 🔴 → 🟠 |

### ⭐ Canonical visual reference — [CONFIRMED 2026-09-09]

| | |
|---|---|
| **Source of truth** | Stitch `projects/18276979792746509337` — *“Today News — V1 Visual Design (Phase 3)”*, **Direction A — Broadsheet** |
| **Not canonical** | Stitch `projects/11776752516184334334` — *Veritas Gazette*. **Do not implement from it.** |
| **Handling** | The canonical project is **read-only this phase.** Cite it by ID, never as “the Stitch project”. |

Direction A is therefore **approved, not recommended**. The seven commitments in
`20-visual-direction.md` §5 are now fixed, and Phase 4 builds against them.

### Re-verification pass — 2026-09-09

Every artefact this audit refers to was re-checked directly against the tools
rather than against the previous session's notes. Three things changed:

| | |
|---|---|
| ✅ **`D-01` resolved** | The Stitch renders that were recorded as failed had in fact completed asynchronously. Five screens exist, including one per direction. `20-visual-direction.md` §0 has been corrected. |
| 🟠 **Three new findings** | `D-05` Figma call quota exhausted · `D-06` the prototype cannot reach the Admin CMS · `D-07` a second Stitch project contradicts the chosen direction |
| ✅ **Everything else confirmed** | Figma: 7 sections, 23 screens, 2 component sets, 24 prototype links — all present. Eraser: all 7 diagrams present and rendering. The `C-1`…`C-6` permission checks were not re-run; they were verified programmatically in the original pass and nothing has been written to the Figma file since. |

**The counts in the table above are unchanged**, because `D-05` prevented any new
screen from being added. Thirteen V1 pages still have no design.

**Headline finding:** the design contains **no unauthorised action and no
invented feature**. Every problem below is either a *coverage gap* (a V1 page not
yet drawn), a *scope correction* (something the Phase 3 brief asked for that is
not V1), or a *dependency on an unanswered question*.

**Severity:** 🔴 blocks the next phase · 🟠 must be resolved before that part is
built · 🟡 resolve before launch

---

## 1. The checks that passed — with evidence

These are recorded because they are the checks that matter most, and "we looked"
is worth more than "it looks fine".

### ✅ C-1 — No publish path exists in the editor area  (`BR-05`, `BR-02`)

Queried programmatically across the whole Figma file:

- The **Publish** button variant (`3:217`) has exactly **2 instances**, both in
  section `04 — Admin CMS` — on *Article review* and on the *Approve & publish
  confirmation*. **Zero** instances in `03 — Editor CMS`.
- Every clickable node in the Editor section resolves to: Save draft, Preview,
  Submit for review, Resubmit for review, Withdraw submission, Back to editing,
  My Articles. **No approve, publish, or reject control.**
- The words "publish/approve/reject" do appear in the Editor section, but every
  occurrence is either the story's own headline text ("*approves* £48m budget"),
  body prose, a **read-only state label** an editor is entitled to see
  (`Published 2`, `Rejected 1`, "Published by Ravi Menon"), or the `BR-05`
  warning note itself. None is a control.

### ✅ C-2 — The author byline is not a link anywhere on the public site

Author pages are `[FUTURE]` (`PG-PUB-F1`, `OQ-23`). Zero byline nodes carry a
prototype reaction. Linking it would promise a page that does not exist.

### ✅ C-3 — Publishing appears on exactly one screen

`PG-ADM-03` only — matching `phase-2-open-issues.md` §4, "Publish appears on
exactly one page, admin-only".

### ✅ C-4 — Colour is never the only signal  (`A11Y-02`)

All 7 status badge variants carry a text label as well as a dot. `REJECTED` is
additionally solid-filled so it can never be read as `CHANGES REQUESTED`
(`09` §6).

### ✅ C-5 — Alt text is a required field, not optional  (`A11Y-03`, `SEO-12`)

Marked `*` and carrying the note "An image cannot be attached without alt text"
on both article-editor screens.

### ✅ C-6 — Mandatory feedback is enforced in the interface

`Request changes` shows a required comment with the submit control **disabled**
(`BR-07`); `Reject` shows a required reason (`BR-08`). Both screens state that
the server refuses an empty one — the interface reflects the rule rather than
implementing it (`SEC-02`).

---

## 2. Coverage gaps — V1 pages with no design

The largest category. None of these is a contradiction; they are simply not drawn
yet.

### 🟠 F-01 — The four static public pages are undesigned

- **PROBLEM:** `PG-PUB-05` About, `PG-PUB-06` Contact, `PG-PUB-07` Editorial
  policy & corrections, `PG-PUB-08` Privacy are all **V1** and have no screen.
- **LOCATION:** Figma `02 — Public Website`. They exist only as footer links.
- **WHY IT MATTERS:** `PG-PUB-07` is not decoration — it is the page a correction
  notice *links to*, and the article page already links to it. A correction
  notice pointing at a page that does not exist is a credibility failure, not a
  missing nicety. Contact also carries an unresolved scope question (`P2-03`:
  information only, or a form?).
- **RECOMMENDED FIX:** Design all four as one simple template. Settle `P2-03`
  first — a form is a scope change, not a detail. Also settle `P2-29`: can staff
  edit these pages, or are they fixed at build time?

### 🟠 F-02 — The account-recovery screens are undesigned

- **PROBLEM:** `PG-EDT-03` Forgot password and `PG-EDT-04` Set password / accept
  invitation are **V1** and undesigned.
- **LOCATION:** Figma `03 — Editor CMS`. Sign-in links to "Forgot password" but
  the destination does not exist.
- **WHY IT MATTERS:** `PG-EDT-04` is how **every member of staff gets their first
  account** (`09` §E-01). Without it there is no onboarding path at all. It also
  carries a security requirement: the reset confirmation must read identically
  whether or not the address belongs to an account.
- **RECOMMENDED FIX:** Design both. They share one narrow centred layout with the
  sign-in screen and are cheap to add.

### 🟠 F-03 — `My profile` is undesigned

- **PROBLEM:** `PG-EDT-10` is **V1**, used by both roles, and exists only as a
  navigation item.
- **LOCATION:** Figma `03 — Editor CMS` side navigation.
- **WHY IT MATTERS:** It is where a user changes their own password and — if
  `OQ-23` separates byline from account — their public byline. It also carries a
  hard rule that must be visible: **nobody can change their own role**.
- **RECOMMENDED FIX:** Design it after `OQ-23` is answered, since the byline field
  is the only part in question.

### 🟠 F-04 — Admin detail screens are undesigned

- **PROBLEM:** `PG-ADM-07` User detail / invite and `PG-ADM-09` Source detail are
  **V1**. Only their list pages exist.
- **LOCATION:** Figma `04 — Admin CMS`.
- **WHY IT MATTERS:** `PG-ADM-07` is where `BR-14` becomes visible — the last
  active admin cannot be deactivated or demoted, and `12` requires the system to
  **refuse** it rather than warn. That behaviour currently exists only as a note
  on the Users list, not as a designed interaction. `PG-ADM-09` is where a source
  is marked *verified*, which `10` §A-12 calls an editorial judgement.
- **RECOMMENDED FIX:** Design both, showing the blocked-deactivation state
  explicitly.

### 🟠 F-05 — Article history has no screen

- **PROBLEM:** `PG-ADM-05` is marked **V1?** and is linked from the review screen
  ("View history"), but no screen exists.
- **LOCATION:** Figma `04 — Admin CMS`, Article review decision panel.
- **WHY IT MATTERS:** `10` §A-10 states this record cannot be reconstructed later
  — if it is not built before the first story is published, those months have no
  history. It is also the answer to "who approved this?", which is exactly the
  question asked when something goes wrong.
- **RECOMMENDED FIX:** Answer `OQ-11`, then design it. The component is already
  specified in `19` §4.8 (append-only, visually read-only, no edit affordance).

### 🟡 F-06 — Two-step verification is undesigned

- **PROBLEM:** `PG-EDT-02` is **V1?** pending `OQ-28`.
- **WHY IT MATTERS:** `10` §A-01 argues it matters specifically for admins — a
  stolen admin account can publish anything on the masthead, which is a
  reputational event rather than merely a security one.
- **RECOMMENDED FIX:** Answer `OQ-28`. If yes, it is one small screen.

### 🟡 F-07 — Settings is undesigned, and may not deserve to exist

- **PROBLEM:** `PG-ADM-11` is **V1?** and, per `P2-08`, traces back to **no Phase 1
  requirement at all**.
- **WHY IT MATTERS:** Every other page answers to a requirement. Designing this
  one would be adding a page because products usually have one — the exact
  reasoning `01` §5.6 forbids.
- **RECOMMENDED FIX:** Either write the requirement or drop the page from V1.
  Do not design it first.

### 🟡 F-08 — "Something went wrong" exists only as a state card

- **PROBLEM:** `PG-PUB-10` is **V1**; it appears on the states board but has no
  full screen.
- **RECOMMENDED FIX:** Low cost — it is the not-found layout with different words.

---

## 3. Scope corrections — screens the Phase 3 brief asked for that are not V1

The Phase 3 brief listed 22 screens. Six of them are **not V1 pages**. They were
excluded, as the brief itself instructed ("*If some listed screens are not
actually V1, exclude them*"), and are recorded here so the exclusion is a visible
decision rather than an omission.

### 🟠 S-01 — "Latest News" is not a V1 page

- **PROBLEM:** Requested as public screen #2. It is `PG-PUB-F3`, **FUTURE**.
- **WHY IT MATTERS:** `P2-02` — it is identical to the homepage today. Two
  addresses showing one list confuses search engines and splits ranking signals
  (`SEO-07`). It only becomes worthwhile once the homepage is hand-curated.
- **RECOMMENDED FIX:** Keep it out until `OQ-17` (homepage curation) is answered
  yes. If you want it anyway, that is a scope change, not a detail.

### 🟠 S-02 — "Author" page is not a V1 page

- **PROBLEM:** Requested as public screen #6. It is `PG-PUB-F1`, **FUTURE**.
- **WHY IT MATTERS:** It depends on `OQ-23` — whether a byline is the same thing
  as a login account. Designing it now would force that answer implicitly. This is
  why the byline is deliberately **not a link** (C-2).
- **RECOMMENDED FIX:** Answer `OQ-23` first.

### 🟠 S-03 — "Admin Login" is not a separate page

- **PROBLEM:** Requested as admin screen #15. `P2-04` specifies **one** staff
  sign-in for both roles; the role decides the destination.
- **WHY IT MATTERS:** A separate admin sign-in is a second thing to secure and it
  advertises where the valuable accounts are. The single sign-in screen is
  labelled to make this explicit.
- **RECOMMENDED FIX:** None — this is the documented design. Confirm `P2-04`.

### 🟡 S-04 — "Create Article" is not a separate screen

- **PROBLEM:** Requested as editor screen #10. It is `PG-EDT-07` in its empty
  state — the same page used for writing and editing (`12`, `PG-EDT-07`).
- **RECOMMENDED FIX:** None. Building a separate create screen would double the
  most complex screen in the product for no capability.

### 🟡 S-05 — "Submitted/Review Status" and "Changes Requested" are states, not pages

- **PROBLEM:** Requested as editor screens #13 and #14. `P2-05` specifies these as
  **filters on My Articles**, and the changes-requested experience lives *in the
  article editor* alongside the story (`09` §5).
- **WHY IT MATTERS:** Splitting feedback onto its own page would put the admin's
  comment somewhere other than with the story — the one thing `09` §5 explicitly
  forbids.
- **RECOMMENDED FIX:** None. Both are designed, as a filter tab and as an editor
  state respectively.

### 🟡 S-06 — "Article Approval" is not a separate page

- **PROBLEM:** Requested as admin screen #19. Approval is a state of `PG-ADM-03`
  plus a confirmation dialog, both designed.
- **RECOMMENDED FIX:** None.

### 🟡 S-07 — A V1 page was missing from the requested list

- **PROBLEM:** `PG-ADM-10` **Categories** is a V1 page and was not among the 22
  requested screens.
- **WHY IT MATTERS:** Sections are load-bearing — public addresses are built from
  them (`OQ-18`, `OQ-20`), and `P2-21` warns that deleting a section containing
  published stories can break every link inside it.
- **RECOMMENDED FIX:** Designed and included, with the delete-versus-deactivate
  rule shown on the screen.

---

## 4. Permission and role consistency

### 🟠 P-01 — Editors are granted source access the design only partly provides

- **PROBLEM:** `03` §3.2 grants editors "browse the source list" and "create a
  source". The design gives editors a **source picker inside the article editor**
  and an "Add a source" control, but no browsable source list — `PG-ADM-08`
  remains admin-only.
- **LOCATION:** Figma `03 — Editor CMS` article editor sidebar vs `04 — Admin CMS`
  Sources.
- **WHY IT MATTERS:** This is `P2-30`, unresolved. The design follows Phase 2's
  *recommendation*, and a recommendation is not an approval. If the permission
  matrix is right as written, an editor-facing source page is missing.
- **RECOMMENDED FIX:** Settle `P2-30`. Either amend `03` §3.2 to say "through the
  picker", or add an editor-visible source list.

### 🟠 P-02 — Editors are granted "own article history" that no editor screen provides

- **PROBLEM:** `03` §3.1 grants editors "view an article's history — own only".
  No editor screen shows any history.
- **LOCATION:** Figma `03 — Editor CMS`.
- **WHY IT MATTERS:** This is `P2-31`, unresolved, and it interacts with `P2-16`
  — if an admin edits an editor's story, can the editor see *what* changed?
  Currently the design shows neither.
- **RECOMMENDED FIX:** Settle `P2-31` and `OQ-26`. If revisions are kept, add a
  simple history to the editor's own story view.

### ✅ P-03 — The self-approval contradiction — **RESOLVED 2026-09-09**

- **PROBLEM:** `BR-13` forbids an admin approving their own article; `OQ-29`
  recommends allowing it with a distinct record. The design shows only a note on
  the review screen: *"If you wrote this story, that is shown here and recorded
  distinctly."* The decision controls are neither disabled nor confirmed enabled.
- **LOCATION:** Figma `04 — Admin CMS`, Article review decision panel.
- **WHY IT MATTERS:** This is `P2-01`, the highest-priority contradiction in the
  documentation. It is a state transition the system must either permit or refuse
  — there is no third option, and the state machine cannot be finalised while both
  statements stand.
- **RESOLUTION 2026-09-09:** Settled in favour of `BR-13` — **an admin may not
  approve or publish an article they wrote or last revised.** `OQ-29` is closed,
  `BR-13` is **[CONFIRMED]**, and `P2-01` is closed.
- **DESIGN CONSEQUENCE — action still needed in Figma:** on `PG-ADM-03`, when the
  viewing admin authored the story, the **Approve & publish control must not be
  rendered at all** (not merely disabled), and the note becomes *"You wrote this
  story — another admin must approve it."* Request changes and Reject stay.
  `19` §4.5 has been updated to specify this. **The Figma screen has not been
  changed** — it is still blocked by `D-05` (the Figma plan quota).

### 🟡 P-04 — "Edit directly" is exposed without its rules settled

- **PROBLEM:** The review screen offers "Edit directly `[OQ-02]`".
- **WHY IT MATTERS:** `P2-17` asks whether an admin can edit **and publish in one
  motion**. If they can, review becomes "rewrite and publish" and the byline may
  no longer match the text — a real editorial-integrity problem, not a UX one.
  `P2-25` separately asks whether an admin edit keeps the story in review.
- **RECOMMENDED FIX:** Settle `P2-17` and `P2-25` before this control is built.
  The label carries its open question so it cannot be built by accident.

---

## 5. State and transition coverage

### ✅ Represented correctly

All seven states appear on the states board with their real labels and colours.
`DRAFT`, `IN_REVIEW`, `CHANGES_REQUESTED`, `REJECTED`, `PUBLISHED` and `ARCHIVED`
all appear in at least one live screen.

### 🟡 T-01 — `APPROVED` is defined but appears in no screen

- **PROBLEM:** The badge variant exists; no screen shows it.
- **WHY IT MATTERS:** This is **correct** and matches `P2-24` — in V1 approve and
  publish are one action, so the state is passed through instantly and is never
  visible. It is recorded here so nobody later mistakes it for an oversight.
- **RECOMMENDED FIX:** None. Keep the badge; it costs nothing and is the hook
  scheduling will need.

### 🟡 T-02 — Transition T11 has no interface

- **PROBLEM:** `APPROVED → CHANGES_REQUESTED` (send an approved story back) has no
  trigger anywhere in the design.
- **WHY IT MATTERS:** `phase-2-open-issues.md` §4 already records T11 as
  **unreachable in V1**, because no page ever displays an approved story. The
  design is consistent with the documentation.
- **RECOMMENDED FIX:** None while `APPROVED` is instantaneous. It becomes
  reachable the moment scheduling (`OQ-07`) exists.

### 🟠 T-03 — Withdrawing a published story has no designed confirmation

- **PROBLEM:** `T12` (`PUBLISHED → ARCHIVED`) requires a reason and a confirmation
  (`10` §A-08). The design mentions it in a note on *All articles* but provides no
  screen or dialog.
- **WHY IT MATTERS:** `10` §A-08 stresses this must be **fast to reach** — a story
  that has to come down usually has to come down *now*, because of a legal demand
  or a serious factual error. A capability described only in a note is not
  designed.
- **RECOMMENDED FIX:** Design the withdraw dialog, reusing the reject pattern
  (mandatory reason + confirmation). Depends on `OQ-16` for what readers then see.

### 🟠 T-04 — `ARCHIVED` still means two different things

- **PROBLEM:** One "Archived" badge covers both *was published and taken down* and
  *was never published and abandoned*.
- **LOCATION:** Status badge component; *All articles*.
- **WHY IT MATTERS:** `P2-19` — only the first affects readers, listings, the feed
  and search engines. An admin looking at the archive cannot tell them apart, and
  the two need different handling.
- **RECOMMENDED FIX:** Settle `P2-19`. If separated, this becomes two badge
  variants — a cheap change now, an awkward one later.

---

## 6. Terminology consistency

### ✅ TE-01 — "Related stories" was deliberately not used

The article page says **"More in Politics"**, never "Related stories".
Algorithmic related stories are `[FUTURE]` (`06` §2.1) — they need tags or content
analysis and V1 has neither. What V1 shows is other published stories in the same
section. Using the words "related stories" would promise relevance the product
cannot deliver.

### 🟡 TE-02 — "Section" and "Category" are used for the same thing

- **PROBLEM:** The public site says **Section**; the admin page is **Categories**
  (`PG-ADM-10`). The documentation does the same thing — `07` says "sections",
  `ADM-10` says "categories".
- **WHY IT MATTERS:** Low impact, but staff will eventually ask whether they are
  two concepts. Inconsistent vocabulary in a small team is cheap to fix now.
- **RECOMMENDED FIX:** Pick one word. Recommend **Section** everywhere, as it is
  the publishing term and the one readers see. Update `ADM-10` and `PG-ADM-10` to
  match, or accept the split explicitly.

### 🟡 TE-03 — "Withdraw" is used for two different actions

- **PROBLEM:** An editor **withdraws a submission** (`T7`, returns to draft); an
  admin **withdraws a published story** (`T12`, removes it from the public).
- **WHY IT MATTERS:** Same verb, very different consequence, different role. The
  design mitigates it — the editor screen says "Withdrawing returns it to DRAFT —
  it is not a rejection" — but the collision remains in the vocabulary.
- **RECOMMENDED FIX:** Rename one. Suggest editor = **"Take back"**, admin =
  **"Withdraw from the site"**.

---

## 7. Provisional design decisions that need confirming

Each of these is drawn a particular way because a question is unanswered. None is
a defect; all will need revisiting if the answer differs.

| Ref | Designed as | Depends on | If the answer differs |
|---|---|---|---|
| 🔴 V-01 | Search results page included, labelled `[V1? — OQ-19]` | `OQ-19` | Drop the screen and the masthead search control |
| 🔴 V-02 | Sections exist; article addresses shown as `/politics/...` | `OQ-18`, `OQ-20` | Navigation, the section page and every address change |
| 🟠 V-03 | Sources shown publicly on the article page | `OQ-24` | Remove the public sources block; keep the editor picker |
| 🟠 V-04 | "What changed since last submission" shown on review | `OQ-26` | Remove the green diff band — review quality falls as stories lengthen |
| 🟠 V-05 | Story locked while `IN_REVIEW`; editor can withdraw | `OQ-03`, `OQ-04` | The locked read-only screen disappears |
| 🟠 V-06 | Correction notice on the published article, after the body | `OQ-09`, `P3-02` | Notice removed, or moved under the byline |
| 🟠 V-07 | Autosave with a visible "Saved 14:12" indicator | `OQ-26` | Indicator removed; explicit save only |
| 🟡 V-08 | Homepage strictly newest-first, stated on the page | `OQ-17` | A featured/lead position is introduced |
| 🟡 V-09 | Withdrawn story shown a notice, not a 404 | `OQ-16` | The withdrawn-notice card is dropped |
| 🟠 V-10 | **The identity layer only** — the name *“Today News”* and the masthead red `#9B2C1E` | `OQ-38` / `P3-01` | The wordmark and identity colour are replaced — contained, not a rework |

> **V-10 was downgraded from 🔴 on 2026-09-09.** It previously read *“the entire
> visual identity … the whole phase is reworked”*. Direction A is now approved
> (`D-07`), so the type pairing, neutrals, spacing and density model are **fixed
> decisions**, not proposals at risk. What `OQ-38` can still change is the
> identity layer sitting on top — and because `19` §1.1 forbids `#9B2C1E` on any
> interactive element, swapping it touches the masthead and wordmark only.
> **This is the clearest return so far on that rule.** It is still worth answering
> before Phase 4 puts it in code.

---

## 8. Tooling deviations — what could not be produced as specified

Recorded so the deliverable is not misrepresented.

### ✅ D-01 — **RESOLVED 2026-09-09.** Stitch produced the screens after all

- **ORIGINALLY RECORDED AS:** the three visual directions were created
  successfully as Stitch design systems, but **every screen-generation call
  failed** — five attempts all timed out server-side and `list_screens` returned
  empty.
- **WHAT WAS ACTUALLY TRUE:** the generations were still running. They completed
  asynchronously and persisted. Verified on 2026-09-09, the project holds five
  rendered 2560px screens, including one per direction (`19ba…` A, `db79…` B,
  `9848…` C). See `20-visual-direction.md` §0 for the full list.
- **WHY THE ERROR MATTERS MORE THAN THE FIX:** a failure was recorded in a client
  deliverable on the basis of a timeout. It was wrong, and it under-sold the work
  by one whole comparison set. **A timed-out call is not a failed call** — re-check
  before recording a failure. This is the same class of mistake as `D-04`, where
  tools returned "success" over a broken canvas: in both directions, the tool's
  own response was not evidence of the outcome.
- **REMAINING ACTION:** the scores in `20` §2 were awarded before any render
  existed and have **not** been re-checked against them. Look at the three renders
  before approving Direction A.

### 🟠 D-05 — The Figma MCP call quota was exhausted before the remaining work

- **PROBLEM:** On 2026-09-09 the Figma MCP returned
  *"You've reached the Figma MCP tool call limit on the Starter plan"* and refused
  all further calls. Three pieces of planned work stopped at that point:
  **(a)** the Admin-CMS prototype route in `D-06` below, **(b)** the nine
  buildable missing screens from `F-01`–`F-04` and `F-08`, and **(c)** a
  re-verification screenshot pass.
- **WHY IT MATTERS:** these are not design disagreements — they are work that was
  specified, is understood, and simply could not be written to the file. The
  Figma file is therefore still at **23 screens**, and §0's counts stand
  unchanged.
- **RECOMMENDED FIX:** the same Professional-plan upgrade already recommended in
  `D-02` lifts both this limit and the seven-pages limit. Nothing about the design
  needs rethinking first.

### 🟠 D-06 — The prototype cannot reach the Admin CMS by clicking

- **PROBLEM:** `PG-EDT-01` Staff sign-in has exactly one prototype reaction, and
  it goes to the **Editor** dashboard. `PG-ADM-01` Admin dashboard has **no
  inbound link at all**. Verified by querying all 24 reactions in the file.
- **WHY IT MATTERS:** **Journey 2 (Admin) and Journey 4 (Approval) cannot be
  demonstrated by clicking.** The admin screens all exist and are internally
  wired — queue → review → approve/request-changes/reject all work once you are
  inside — but there is no way in from the sign-in screen. `21-client-demo-script.md`
  assumes the presenter can walk the whole story in presentation mode, and at
  Journey 2 they cannot; they must jump manually. The one story the demo is built
  to tell breaks exactly where the product's most important rule lives.
- **WHY IT IS NOT A DESIGN ERROR:** the product routes by role from one shared
  sign-in (`P2-04`), which a static prototype cannot branch on. This is a
  prototype-plumbing gap, not a contradiction of the requirements.
- **RECOMMENDED FIX:** add a visibly non-product affordance to `PG-EDT-01` —
  a dashed panel labelled *"Prototype only — the real product routes by role"*
  with *Continue as Editor* and *Continue as Admin*. It must not look like a
  product control, or it becomes a role-selection feature nobody asked for.
  Also worth adding while there: `Request changes` → the editor's
  `CHANGES_REQUESTED` screen, which is the Journey 3 handoff and is currently
  missing, and `My Articles` → `Article editor`.

### ✅ D-07 — **RESOLVED 2026-09-09 by client decision.** Canonical project named

- **PROBLEM:** `projects/11776752516184334334` (**"TODAY NEWS"**, created
  2026-09-09) contains four mobile screens built on a different design system —
  wordmark *"Veritas Gazette"*, **Public Sans** interface type, **0px** radii, and
  a different palette. It was not produced by the documented Phase 3 work.
- **WHY IT MATTERS:** two visual languages now exist under near-identical names in
  one account. Whoever builds Phase 4 from "the Stitch project" has a 50% chance
  of building the wrong one. It also renders `20-visual-direction.md` ambiguous as
  a source of truth.
- **RESOLUTION — [CONFIRMED 2026-09-09]:** Stitch `projects/18276979792746509337`
  (*“Today News — V1 Visual Design (Phase 3)”*) and its **Direction A —
  Broadsheet** are the canonical visual source of truth. The *Veritas Gazette*
  project is **not** canonical and must not be used as a basis for
  implementation. The canonical project is **not to be modified during this
  phase**. Recorded in `20-visual-direction.md` §0 as **P3-03**.
- **NOT deleted, deliberately:** the decision de-canonicalised the second project;
  it did not authorise destroying it. It stays, labelled non-canonical wherever it
  is referenced.
- **The one residual risk:** two projects with near-identical names still sit in
  one account. **Phase 4 must cite `projects/18276979792746509337` by ID**, never
  by the phrase "the Stitch project".
- **Consequential change elsewhere:** Direction A is now **approved rather than
  recommended**, so the seven commitments in `20` §5 are fixed, and `V-10` below
  is downgraded — see the note on that row.

### 🟡 D-02 — The Figma file has one page, not seven

- **PROBLEM:** The requested structure was `00 — Overview` … `06 — States` as
  seven pages. The Figma **Starter** plan refused page creation.
- **WHY IT MATTERS:** Presentation only. The identical structure is carried by
  seven named **Sections** on a single page, and the Overview explains this.
- **RECOMMENDED FIX:** On a Professional plan, promote each section to a page.
  No content changes.

### 🟡 D-03 — Eraser AI credits ran out after three diagrams

- **PROBLEM:** Diagrams 1–3 were AI-generated. Credits were then exhausted, and
  diagrams 4–7 were **hand-authored in Eraser's flowchart DSL** instead.
- **WHY IT MATTERS:** None for the client — all seven diagrams exist and render.
  The hand-authored four are arguably more accurate, since every role label and
  transition ID was written deliberately rather than inferred.
- **RE-VERIFIED 2026-09-09:** all seven confirmed present and rendering in file
  `LonyMflc9abdabC5Y7rZ`. Diagrams 1–3 (*What the product is made of*, *How a
  Reader Moves Through the Site*, *Editor's Journey*) are `freeform` diagrams;
  4–7 (*Admin Workflow*, *Article Lifecycle*, *High-Level System Boundary*, *How
  a story reaches the public*) are flowchart DSL.
- **⚠️ A trap worth writing down:** listing the diagrams reports an **empty
  `code` field for all three freeform diagrams**, because a freeform diagram
  stores its scene in a separate structure, not in `code`. They look deleted or
  blank when they are neither. During this re-verification that reading caused
  three duplicate diagrams to be created and then removed again. **Check a
  freeform diagram's actual content — or just open it — before concluding it is
  empty.** Same lesson as `D-01` and `D-04`: the tool's response is not the
  artefact.
- **🟡 One real defect found:** in diagram 1, the *"PUBLISH — the only route to
  the public"* edge label overlaps the Editor CMS box, and *"No route to
  publication exists"* crosses the Search box. Both are legible but untidy, and
  they sit on the most important relationship in the diagram — the one the client
  demo opens with. Worth nudging before the presentation.
- **RECOMMENDED FIX:** fix the two overlapping labels in diagram 1. Nothing else.

### 🟡 D-04 — Four layout defects were found and fixed during verification

- **PROBLEM:** Screenshot verification revealed that (a) containers sized with a
  placeholder height were clipping their content — the article page rendered at
  335px instead of 2,580px; (b) image slots had collapsed to 13px; (c) button
  components were 10px wide, so action bars overlapped; (d) 30 text nodes
  overflowed their containers.
- **WHY IT MATTERS:** Recorded because all four were invisible in the tool's
  success responses. Every write returned "success" while the canvas was wrong.
- **RECOMMENDED FIX:** Already fixed and re-verified by screenshot. The lesson
  carries forward: in this file, verify visually rather than trusting return
  values.

---

## 9. What this audit did *not* check

Stated so the boundary is auditable:

- **No contrast measurements were run.** The palette was chosen against AA
  thresholds by calculation (`19` §1.1) but no automated contrast audit has been
  performed on the rendered screens.
- **No keyboard-order or screen-reader review** — these are meaningful only
  against a built interface, not a static design.
- **No performance assessment.** Image weight and count are design decisions with
  performance consequences (`PRF-04`, `PRF-05`), but nothing here has been
  measured.
- **No copy review by an editor.** All headline and body text is invented
  placeholder journalism.
- **No open question was answered**, and no requirement was changed.

---

## 10. Recommended order of resolution

| Order | Resolve | Unblocks |
|---|---|---|
| ~~1~~ | ~~`OQ-38` / `P3-01` — is there a brand?~~ **Demoted 2026-09-09** — Direction A is approved, so this now touches the wordmark and masthead red only. Answer it before Phase 4 writes code, but it no longer blocks. | The identity layer |
| **1** | **Unblock Figma** (`D-05`) — the Starter plan refuses all MCP calls | The Admin-CMS prototype route (`D-06`) and nine buildable screens (`F-01`–`F-04`, `F-08`). Pure tooling; no decision needed |
| ~~2~~ ✅ | ~~`P2-01` / `OQ-29` — self-approval~~ — **RESOLVED 2026-09-09.** Remaining: apply the review-panel change in Figma (blocked by `D-05`) | — |
| 3 | `OQ-18`, `OQ-20` — sections and addresses | Navigation, the section page, every public address |
| 4 | `OQ-08`, `P2-26` — correcting published stories | The correction flow and the data model |
| 5 | `OQ-26` — are revisions kept? | The diff band, autosave, `P2-16`, `P2-31` |
| 6 | `OQ-19` — search in V1? | Whether `PG-PUB-04` and the masthead control exist |
| 7 | `OQ-24` — are sources public? | The public sources block |
| 8 | `P2-30`, `P2-31` — editor source and history access | Two possibly-missing editor pages |
| 9 | `OQ-11` — audit trail | `PG-ADM-05`, which cannot be back-filled later |
| 10 | `P2-03`, `P2-08`, `P2-19` | Static pages, Settings, the archive split |
