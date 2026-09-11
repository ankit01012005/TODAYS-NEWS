# 26 — Data-Model Decisions

**Stage:** Phase 4B-0 — finalising the decisions that block database implementation
**Last updated:** 2026-09-09
**Status:** **Decisions. Binding.** These supersede the corresponding open questions.

---

## 0. Scope

This document resolves the four items that stood between architecture discovery
(`23`) and database implementation. It does not restate the architecture, redesign
anything already settled, or introduce new product scope.

| # | Decision | Supersedes |
|---|---|---|
| 1 | Article / revision model | `OQ-08`, `OQ-26`, `P2-26`, `P2-19` *(modelling half)* |
| 2 | Admin self-approval | `BR-13` vs `OQ-29`, `P2-01`, contradiction `C-1` |
| 3 | Article body representation | `OQ-22` |
| 4 | Data-model boundary | — defines what Phase 4B implements |

**Documents already updated to match** (so no contradiction survives anywhere):
`02` `BR-13` · `03` §2.3 and §6.1 · `04` T5 and §5.3 · `05` OQ-08/22/26/29 and the
priority summary · `11` T5, §5.2, §9 `P2-01`, §10 · `phase-2-open-issues.md` `C-1`
and `P2-01` · `23` §1.4, §8.5, §12.2, §13.6, §26, §27, §28.

---

## 1. Article / revision model

### 1.1 Decision

**State lives on the revision. Identity lives on the article.**

An **`Article`** is a story's permanent identity — its address, its owner, its
section, and a pointer to whichever version is currently live. It carries no
workflow state.

An **`ArticleRevision`** is one version of the content, and it carries the
workflow state. A revision is editable only while it is the open working copy; at
every transition out of an editable state it is frozen and kept forever.

```
Article  (identity, slug, owner, category, publication status)
   |
   +-- currentPublishedRevisionId ---> the version READERS SEE  (nullable)
   |
   +-- revisions (1..n, ordered, permanent)
         rev 1  ARCHIVED    submitted, sent back  -> kept
         rev 2  ARCHIVED    resubmitted, published, later corrected -> kept
         rev 3  PUBLISHED   <-- live now
         rev 4  IN_REVIEW   <-- a correction, being reviewed right now
```

### 1.2 Why this shape

`BR-16` and `11` §8 require that a published story **stays live and untouched**
while a correction is written and reviewed. That means a story must be able to be
*published* and *have a correction in review* at the same time — `P2-26`.

A single state field on the article cannot express two situations at once. Putting
state on the revision expresses it naturally, and delivers `OQ-26`'s revision
history as a by-product rather than as a second mechanism.

It also makes the public-visibility rule a **pointer, not a comparison**. `BR-01`
becomes `currentPublishedRevisionId IS NOT NULL` — one predicate, in one place. It
is structurally impossible to have a story marked published with no published
content, because the pointer *is* the publication.

### 1.3 Revision states

The seven documented states from `04` §2 and `11` §1. **No state is added.**

| Kind | States | Meaning |
|---|---|---|
| **Open** (at most one per article) | `DRAFT`, `IN_REVIEW`, `CHANGES_REQUESTED`, `APPROVED` | Work in progress |
| **Live** (at most one per article) | `PUBLISHED` | What readers see |
| **Terminal** | `REJECTED`, `ARCHIVED` | Retired, retained |

**Editable states:** `DRAFT` and `CHANGES_REQUESTED` only. A revision in any other
state is immutable.

`ARCHIVED` carries its documented meaning — *retired from public view and active
work, retained* — and is therefore also the state of a **superseded** revision: one
that was live and has been replaced by an approved correction. That is exactly what
the definition describes, so no new value is needed.

### 1.4 How the lifecycle runs

| Event | Effect on revisions | Effect on the article |
|---|---|---|
| Create (`T1`) | rev1 created, `DRAFT`, editable | article created, `NEVER_PUBLISHED` |
| Save / autosave (`T2`, `T8`) | open revision updated in place — **no snapshot** | — |
| Submit / resubmit (`T3`, `T9`) | open revision → `IN_REVIEW`, **frozen** | — |
| Request changes (`T4`) | reviewed revision → `ARCHIVED`; **a new revision is created as a copy**, `CHANGES_REQUESTED`, editable | — |
| Approve (`T5`) | revision → `APPROVED` | — |
| Publish (`T10`) | revision → `PUBLISHED`; any previously live revision → `ARCHIVED` | `currentPublishedRevisionId` set; status `LIVE`; slug frozen |
| Reject (`T6`) | revision → `REJECTED` | — |
| Withdraw submission (`T7`) | revision → `DRAFT`, editable again | — |
| Start correction (`T13`) | **new revision created as a copy of the live one**, `DRAFT` | live revision and pointer untouched |
| Withdraw published (`T12`) | live revision → `ARCHIVED` | pointer cleared; status `WITHDRAWN` |
| Reopen / restore (`T14`, `T16`) | new revision created as a copy, `DRAFT` | — |

**Why `T4` creates a copy rather than reopening the reviewed revision:** `ADM-03`
requires the admin to see *what changed since last submission*, and `P2-16` asks
whether an editor can see what an admin changed. Both need the previously submitted
text preserved. If the editor edited the same row, the version the admin actually
reviewed would be gone.

### 1.5 Revision history — what "complete" means

Every revision ever frozen is kept permanently. Nothing is deleted or overwritten.
That gives a gap-free record of **every version that was submitted, reviewed,
published or rejected**, and answers *what did the public see on this date* — which
is the question a publisher is actually asked.

**Autosave is deliberately excluded.** It updates the open revision in place and
creates no snapshot. This is `OQ-26` option (b), as recommended: keystroke-level
history costs storage and complexity for no editorial benefit.

### 1.6 Article publication status

`NEVER_PUBLISHED` · `LIVE` · `WITHDRAWN`.

This **structurally resolves the modelling half of `P2-19`**, which recorded that
`ARCHIVED` conflated *was published and taken down* with *never published and
abandoned*. Those are now different values, which matters because only the first
affects readers, listings, the sitemap and search engines (`SEO-14`).

*(The reader-facing half of `P2-19` — whether a withdrawn story shows a 404 or a
withdrawal notice — is `OQ-16`, a UI decision that does not affect the schema.)*

### 1.7 Invariants the database must enforce

| # | Invariant | Enforcement |
|---|---|---|
| I-1 | At most **one open revision** per article | Partial unique index on `article_id` where state is open |
| I-2 | At most **one `PUBLISHED` revision** per article | Partial unique index on `article_id` where state = `PUBLISHED` |
| I-3 | `current_published_revision_id` must belong to the same article | FK + check |
| I-4 | `status = LIVE` ⟺ `current_published_revision_id IS NOT NULL` | Check constraint |
| I-5 | Slug unique, and **immutable once first published** (`BR-15`) | Unique index + application rule + audit |
| I-6 | A frozen revision cannot be updated | Application rule; enforced in the transition service |

---

## 2. Admin self-approval — resolved, then superseded

**[SUPERSEDED 2026-09-11]** This section's decision (2.1) held while admin
could still author articles. That premise no longer holds: admin lost every
authoring capability on 2026-09-11 (`03-user-roles-and-permissions.md` §2.3;
`backend/src/common/capabilities.ts`), so an admin can never own or author an
article and self-approval is now structurally impossible rather than merely
forbidden. `BR-13` is superseded (`02-requirements.md`); `DM-06` below is
superseded accordingly. The reasoning in §2.2 is kept for history, not as
current guidance.

### 2.1 Decision

> **An admin may not approve or publish an article they wrote or last revised.
> A second, different admin must review it.**

`BR-13` now states this as **[CONFIRMED]**. `OQ-29` is closed on option (b) —
forbidden. `P2-01` and contradiction `C-1` are closed.

### 2.2 Rationale

`01` §5.1 states that *publication is a privileged act*, and §5.5 that
*correctness beats cleverness in news*. An audit trail records what happened; it
does not prevent it. For the one action with immediate, irreversible public
consequence, prevention is worth more than a good record of the failure.

This reverses the earlier Phase 1 recommendation (`OQ-29` option (a), allow and
record). That reversal is deliberate and is noted where the recommendation was
originally made, so the reasoning that was on the table stays visible.

### 2.3 The rule, precisely

The check compares the acting admin against **both**:

- the article's **owner**, and
- the **`created_by`** of the revision being approved.

If the actor matches either, `T5` (approve) and `T10` (publish) are **refused by
the server**, with the refusal recorded (`11` §5.1).

Comparing against the reviser as well as the owner closes the obvious gap: an
admin who substantially rewrites someone else's story during review has authored
the text they would be approving.

### 2.4 Accepted costs

Recorded because they are real, not theoretical.

1. **The newsroom needs at least two admins** to publish admin-written stories.
   `OQ-36` (how many admins in practice) should be answered with that in mind.
2. **An admin-written story can be blocked** when no second admin is reachable.
   The remedy is editorial: reach a colleague, or write under an editor account
   and be reviewed normally.
3. **A shared admin login must never be the workaround.** It would destroy `BR-06`
   far more thoroughly than self-approval ever would. If the two-admin rule proves
   unworkable, **reopen the decision** rather than working around it.

Tracked as risk **R-13** in `23` §26.

---

## 3. Article body — resolved

### 3.1 Decision

**Structured blocks, stored as validated JSON.** `OQ-22` option (c).

The body is an ordered array of typed blocks. It is **never** contributor-supplied
HTML or Markdown.

### 3.2 V1 block types

| Block | Contents |
|---|---|
| `paragraph` | inline content |
| `heading` | level 2 or 3, inline content |
| `image` | `mediaId`, alt text (**required**), credit, optional caption |
| `quote` | inline content, optional attribution |
| `list` | ordered or unordered, items of inline content |
| `divider` | — |

**Inline content** is an array of `{ text, marks[] }`, where a mark is `strong`,
`em`, or `link` with an `href`. There is no raw-HTML escape hatch at any level.

### 3.3 Why blocks rather than sanitised rich text

The alternative — option (b), store HTML and clean it — was rejected on security
grounds, and `OQ-22` itself flagged that the body is *the classic route for
injecting malicious code into a public site*.

> **Sanitised HTML is trust-and-clean. Blocks are validate-and-construct.**

With stored HTML, contributor markup reaches the page and a sanitiser is the only
barrier. One sanitiser bug, one configuration drift, one library upgrade, and you
have stored XSS on every reader of that article — the highest-value attack path in
a publishing platform (`SEC-07`, `23` §18.2).

With blocks, contributor input never becomes markup. It is data, validated against
a strict schema on write, and rendered by your own components. There is nothing to
sanitise because nothing untrusted is ever interpreted as markup.

### 3.4 Security implications (`SEC-07`, `SEC-06`)

| Control | Rule |
|---|---|
| **Validation** | Strict schema on write. Unknown block types, unknown marks and malformed structure are **rejected**, not stripped. Rejection is visible; silent stripping hides an attack |
| **Rendering** | Block type → component. Text is escaped by the framework by default |
| **The one enforceable rule** | **`dangerouslySetInnerHTML` must not appear anywhere in the article renderer.** This is a single grep, and it can be a CI check — which is what makes this decision auditable rather than aspirational |
| **Links** | `href` allow-list: `http`, `https`, and internal relative paths only. `javascript:`, `data:` and `vbscript:` rejected at validation |
| **Images** | Reference a `MediaAsset` by id. No arbitrary remote URLs, so the body cannot be used to beacon or to load third-party content |
| **Depth and size** | Bounded block count and nesting depth, to prevent denial-of-service via a pathological document |

### 3.5 Costs, stated plainly

- **A block editor is more work than a rich-text field.** This is the real cost of
  the decision.
- **Pasting from Word or Google Docs needs a conversion step** that maps incoming
  markup onto the block set and drops the rest.
- **Embeds (video, social posts, galleries) are not in V1** — but the model
  accommodates them as new block types.

### 3.6 Extensibility

New block types are additive: a schema entry plus a renderer component. Because the
body is JSON, **no migration is required** to add one. This is what `OQ-22` meant
by option (c) avoiding a painful migration later, and it satisfies `SCL-04`.

### 3.7 One derived column

A plain-text projection of the body (`body_plain`) is maintained alongside it, for
full-text search (`23` §15). Derived on write, never edited by hand.

---

## 4. Data-model boundary

What Phase 4B must implement. **No SQL, schema or migration is written here.**

### 4.1 Entities

| # | Entity | Purpose | Notes |
|---|---|---|---|
| 1 | **User** | Someone who can sign in | One role (`USR-02`); deactivated, never deleted (`USR-03`) |
| 2 | **Session** | An active sign-in | Server-side and revocable (`SEC-05`) |
| 3 | **Article** | A story's permanent identity | Slug, owner, category, publication status, pointer to the live revision |
| 4 | **ArticleRevision** | One version of the content, with its workflow state | Holds headline, summary, body, SEO fields, featured image and its alt/credit |
| 5 | **ReviewDecision** | One admin decision on one revision | Comment/reason mandatory for request-changes and reject (`BR-07`, `BR-08`); immutable |
| 6 | **Category** | A section of the site | Deactivated, never deleted (`P2-21`) |
| 7 | **Source** | Where information came from | Shared and reusable (`SRC-04`) |
| 8 | **ArticleSource** | A citation on a specific revision | Ordering, per-source public flag, optional note |
| 9 | **MediaAsset** | An uploaded image | Storage key and file metadata only |
| 10 | **AuditLog** | Who did what, when | **Append-only** (`SEC-11`) |

**Not created in V1:** `Tag`, `ArticleTag` — `[FUTURE]` (`06` §2.4). Named only
because `SCL-04` requires the model to accept them later without redesign; both are
additive.

### 4.2 Relationships

```
User 1---N Article              (owner - authorisation scope)
User 1---N ArticleRevision      (created_by - who wrote this version)
User 1---N ReviewDecision       (decided_by - who made the call)
User 1---N MediaAsset           (uploaded_by)
User 1---N Session
User 1---N AuditLog             (actor)

Article 1---N ArticleRevision           (permanent history)
Article 0..1 --> ArticleRevision        (current_published_revision - what readers see)
Article N---1 Category
Article 1---N AuditLog

ArticleRevision 1---N ReviewDecision
ArticleRevision N---1 MediaAsset        (featured image, nullable)
ArticleRevision N---M Source            (via ArticleSource)
```

**Three placements that are deliberate, not incidental:**

- **Sources attach to the revision, not the article.** A correction may change
  what a story cites, and the published snapshot must record what was actually
  cited at the time.
- **Featured-image alt text and credit live on the revision**, not on the
  `MediaAsset`. The same photograph can be captioned differently in different
  stories, and each published version must preserve the caption it went out with.
- **Ownership is on the article; authorship is on the revision.** Ownership drives
  authorisation (an editor's own stories); authorship records who wrote a
  particular version — which is what `BR-13` compares against (§2.3), and what
  answers *an admin edited my story* (`09` E-12).

### 4.3 Constraints Phase 4B must implement

| Rule | Requirement |
|---|---|
| Public visibility is the pointer, in one place | `BR-01` |
| Slug unique; immutable after first publication | `BR-15` |
| At most one open revision, and one published revision, per article | §1.7 |
| Publish records the acting admin and the time, in the same transaction | `BR-06` |
| Approver ≠ article owner and ≠ revision author | **`BR-13`** |
| Request-changes and reject require non-empty text | `BR-07`, `BR-08` |
| Submit requires headline, summary and body | `BR-09` |
| Only the seventeen defined transitions are possible | `BR-10` |
| Optimistic concurrency version on every transition | `P2-23` |
| At least one active admin always exists | `BR-14` |
| Audit table: `INSERT` and `SELECT` privileges only — no `UPDATE`, no `DELETE` | `SEC-11` |
| Soft delete by default | `BR-12` |
| Media requires alt text before attachment | `A11Y-03`, `SEO-12` |
| Category cannot be deleted while published articles reference it | `P2-21` |

---

## 5. Still open — and whether it blocks

### 5.1 Genuine blockers to database implementation

**None.**

Every remaining open question either does not touch the schema, or is accommodated
by a shape that absorbs any of its possible answers additively.

### 5.2 Open, accommodated, not blocking

Listed so nothing appears to have been quietly ignored.

| Open question | How the model absorbs every possible answer |
|---|---|
| `OQ-23` byline vs account | `Article.byline_override` (nullable) covers options (a) and (b). Option (c), author profiles, adds an `Author` table and an FK — additive |
| `OQ-06` multiple authors | `Article.owner_id` stays the authorisation owner. Co-authors would arrive as an `ArticleContributor` join table — additive, and explicitly anticipated by `SCL-04` |
| `OQ-24` how sources attach | `ArticleSource` carries an optional free-text note and a per-source public flag, so options (a), (b) and (c) are all expressible without a shape change |
| `OQ-11` audit scope | `AuditLog` is generic over entity type, so option (b) and option (c) differ only in which rows get written |
| `OQ-18` do categories exist | The table is built. If the answer were "no", it is dropped — cheap and one-directional |
| `OQ-20` address shape | The slug is stored either way. If the section appears in the address, the extra rule is that **category is frozen at first publication** alongside the slug (`BR-15`) — a rule, not a column |
| `OQ-19` search in V1 | `body_plain` is maintained regardless; the search index is added only if search ships |
| `OQ-21` is a featured image mandatory | Column is nullable; "required before submitting" is enforced with `BR-09`-style validation, like every other completeness rule |
| `OQ-12` permanent deletion | `deleted_at` everywhere. Whether hard deletion is ever permitted is an operational policy, not a schema change |
| `OQ-16` withdrawn: 404 or notice | `WITHDRAWN` is already a distinct status; the reader-facing choice is UI only |
| `OQ-13` what archive means | Resolved structurally by §1.6 |
| `OQ-03`, `OQ-04`, `OQ-05`, `OQ-02` | Authorisation rules only. No schema impact |
| `P2-22` one review state or two | Phase 1's single `IN_REVIEW` is implemented, per `11` §9 |
| `P2-25` admin edits during review | Behavioural. The revision model already records who changed what |
| `OQ-31` expected scale | Affects sizing and indexing strategy, not table shape |

### 5.3 Still needed before launch — but not before the database

`OQ-30` performance targets · `OQ-32` privacy law · `OQ-33` accessibility standard ·
`OQ-34` analytics · `OQ-42`/`P2-28` timezone · `OQ-36` how many admins *(now more
pointed — see §2.4)* · `P2-07` preview addressing.

---

## 6. Decision record

| ID | Decision | Supersedes | Status |
|---|---|---|---|
| **DM-01** | Article identity + ArticleRevision carrying workflow state | `OQ-08`(c), `P2-26` | **FINAL** |
| **DM-02** | Immutable snapshot at every transition; kept permanently; autosave excluded | `OQ-26`(b) | **FINAL** |
| **DM-03** | Public visibility is `current_published_revision_id`, one predicate | `BR-01` implementation | **FINAL** |
| **DM-04** | `publication_status`: never published / live / withdrawn | `P2-19` (modelling half) | **FINAL** |
| **DM-05** | Superseded revisions become `ARCHIVED`; no eighth state invented | `04` §2, `11` §1 | **FINAL** |
| **DM-06** | ~~Admin cannot approve or publish their own or their own last-revised article~~ | `BR-13` over `OQ-29`; `P2-01`, `C-1` | **SUPERSEDED 2026-09-11** — moot, admin cannot author at all (§2 banner) |
| **DM-07** | Article body is structured blocks as validated JSON | `OQ-22`(c) | **FINAL** |
| **DM-08** | No contributor HTML is ever rendered; no `dangerouslySetInnerHTML` in the article renderer | `SEC-07` | **FINAL** |
| **DM-09** | Ten entities as listed in §4.1; tags deferred but additive | `SCL-04` | **FINAL** |
| **DM-10** | Audit table restricted to `INSERT`/`SELECT` at the database privilege level | `SEC-11` | **FINAL** |

---

**PHASE 4B DATABASE IMPLEMENTATION READY**
