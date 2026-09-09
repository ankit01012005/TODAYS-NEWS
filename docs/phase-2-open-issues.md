# Phase 2 — Consistency Check and Open Issues

**Stage:** end of Phase 2 — product mapping
**Last updated:** 2026-09-08
**Purpose:** compare Phase 1 against Phase 2 and record every contradiction, gap and new decision that Phase 2 uncovered — without resolving any of them

---

## 1. The headline finding

**None of the 42 open questions from Phase 1 have been answered.**

The documents in `/docs` are byte-for-byte identical to how Phase 1 left them.
That includes the **14 questions marked 🔴 blocking** — the ones Phase 1 stated
must be answered before foundations are designed.

Phase 2 could still be done, because a map can be drawn with parts of it marked
"provisional". But it means:

> **Phase 2's page inventory and workflows rest on 20+ unapproved recommendations.**
> Every one is labelled **[PROVISIONAL]** at the point of use, with the question
> named. If you answer a question differently, the affected pages and flows change.

**The largest dependencies:** OQ-08 *(correcting published stories)*, OQ-18
*(sections)*, OQ-20 *(addresses)*, OQ-22 *(article body format)*, OQ-24
*(sources)* and OQ-26 *(revisions)*. Between them these shape roughly a third of
the page inventory.

---

## 2. Contradictions found

Ranked by how much damage they do if left unresolved.

### ✅ C-1 — Phase 1 contradicts itself about self-approval — **RESOLVED 2026-09-09**

| | |
|---|---|
| **Where** | `02-requirements.md` `BR-13` says *"An admin may not approve their own article"* — marked `[OPEN]`. `05-open-questions.md` OQ-29 **recommends allowing it**, recorded as a self-approval. |
| **Why it matters** | These are opposite instructions for the same action, and it is a state transition the system must either permit or refuse. The state machine in `11-article-workflows.md` cannot be finalised while both stand. |
| **Status** | **RESOLVED 2026-09-09.** Settled in favour of `BR-13`: **an admin may not approve or publish an article they wrote or last revised.** `OQ-29` is closed (option (b)); `BR-13` is now **[CONFIRMED]**; the state machine in `11` §4 is finalised. Rationale and accepted costs: `03` §6.1. Model impact: `26-data-model-decisions.md` §2. |

### 🔴 C-2 — The Phase 2 brief describes states that Phase 1 does not have

| | |
|---|---|
| **Where** | The Phase 2 brief's example shows `SUBMITTED` and `UNDER_REVIEW` as separate states, with an admin moving a story between them. `04-article-lifecycle.md` defines a single `IN_REVIEW`. |
| **Why it matters** | Splitting them would let an admin "claim" a story, showing colleagues who is reviewing what and preventing two admins duplicating work — see P2-23. It also adds a state, a transition and a permission. |
| **What Phase 2 did** | Followed **Phase 1**, as instructed, and recorded the difference. |
| **Status** | Recorded as **P2-22**. Not resolved. |

### 🟠 C-3 — Editors have rights that no editor page provides

| | |
|---|---|
| **Where** | `03-user-roles-and-permissions.md` §3.2 grants editors *"browse the source list"* and *"create a source"*. §3.1 grants editors *"view an article's history — own only"*. Phase 2 placed both Sources *(PG-ADM-08/09)* and Article history *(PG-ADM-05)* in the **admin** area, admin-only. |
| **Why it matters** | Either the permission matrix is wrong, or two pages are missing from the editor area, or editor access is meant to be limited to the source picker inside the article editor. All three are plausible; guessing produces either a missing feature or an accidental permission. |
| **Status** | Recorded as **P2-30** *(sources)* and **P2-31** *(history)*. Not resolved. |

### 🟠 C-4 — Phase 2 deferred two requirements that Phase 1 left open

| | |
|---|---|
| **Where** | `ADM-15` *(homepage curation)* and `ADM-16` *(scheduled publishing)* are marked `[OPEN]` in Phase 1 — undecided, not deferred. Phase 2 placed both in **FUTURE**. |
| **Why it matters** | That is a scope decision, and it is not mine to make. Phase 1's own recommendations support deferring both, but "recommended" is not "approved". |
| **Status** | Recorded as **P2-32**. Flagged rather than assumed. |

### 🟡 C-5 — A contact page on a site that accepts nothing

| | |
|---|---|
| **Where** | `01-product-vision.md` states the public site is read-only and *"readers submit nothing — no comments, no tips form"*. `PUB-14` proposes a Contact page. |
| **Why it matters** | A contact *form* would contradict the read-only assumption and brings spam, abuse and personal-data handling with it. Phase 2 specified the page as **information only**. |
| **Status** | Recorded as **P2-03**. If a form is wanted, it is a scope change. |

### 🟡 C-6 — "Newest first" versus curating the homepage

| | |
|---|---|
| **Where** | `PUB-01` is `[CONFIRMED]` as *"latest published articles, newest first"*. `ADM-15` `[OPEN]` proposes letting admins feature stories. |
| **Why it matters** | These can coexist only if curation never overrides ordering. If it does, a confirmed requirement stops being true. |
| **Status** | Tracked by OQ-17. No new issue raised. |

### 🟡 C-7 — A page nobody asked for

| | |
|---|---|
| **Where** | `PG-ADM-11 Settings` traces back to **no Phase 1 requirement at all.** |
| **Why it matters** | Every other page in the inventory answers to a requirement. This one exists because products usually need one — which is exactly the reasoning Phase 1 forbids. |
| **Status** | Recorded as **P2-08**. Either a requirement is missing, or the page is. |

---

## 3. Coverage analysis

Phase 1 defines **149 numbered requirements**. Phase 2's page and flow documents
cite **97** of them directly. The remaining 52 break down as follows — and the
distinction matters:

| Category | Count | Assessment |
|---|---|---|
| **Cross-cutting, correctly not tied to a page** — `OPS-01..05`, `SCL-01..07`, `PRF-02/03/05/06/07/09`, `SEC-04/07/08/10/12/13/14`, `A11Y-02..05`, `SEO-02/06/07/12` | 34 | Correct. These describe how everything behaves, not what any one page does. They become architecture and test criteria in Phase 3. |
| **Covered in substance, not cited by reference number** — `CAP-02/08/09/10/12`, `BR-03/11`, `SRC-02..07`, `USR-06/07`, `PUB-14`, `ADM-17` | 16 | A citation gap, not a coverage gap. Each is visibly present in the pages and flows; the ID simply is not quoted. Worth tightening before Phase 3 so traceability is mechanical rather than a matter of reading comprehension. |
| **Genuine scope decisions Phase 2 made** — `ADM-15`, `ADM-16` | 2 | **Needs your confirmation** — see C-4 / P2-32. |

**Conclusion:** no Phase 1 requirement was dropped. Two were deferred, and that
deferral is flagged rather than assumed.

---

## 4. Consistency matrices

### Requirements ↔ Pages

| Check | Result |
|---|---|
| Every V1 page traces to at least one requirement | ✅ except `PG-ADM-11 Settings` — **P2-08** |
| Every confirmed capability `CAP-01..CAP-17` has a page | ✅ |
| Every public requirement `PUB-*` has a page or is FUTURE | ✅ |
| Every editor requirement `EDT-*` has a page | ✅ |
| Every admin requirement `ADM-*` has a page, is FUTURE, or is flagged | ✅ — `ADM-15/16` flagged as **P2-32** |

### Roles ↔ Permissions ↔ Pages

| Check | Result |
|---|---|
| No page grants an editor a capability the matrix denies | ✅ |
| No page denies an editor a capability the matrix grants | ❌ **P2-30** *(sources)*, **P2-31** *(history)* |
| Publish appears on exactly one page, admin-only | ✅ — `PG-ADM-03` only |
| No publish path exists anywhere in the editor area | ✅ |
| Every admin-only page states that it is admin-only | ✅ |

### States ↔ Pages

| State | Where it is created | Where it is seen | Where it is acted on |
|---|---|---|---|
| `DRAFT` | PG-EDT-07 | PG-EDT-05/06, PG-ADM-04 | PG-EDT-07 |
| `IN_REVIEW` | PG-EDT-07 | PG-EDT-06/09, PG-ADM-02 | PG-ADM-03 |
| `CHANGES_REQUESTED` | PG-ADM-03 | PG-EDT-05/06, PG-ADM-04 | PG-EDT-07 |
| `APPROVED` | PG-ADM-03 | **nowhere** | **nowhere** — see P2-24 |
| `PUBLISHED` | PG-ADM-03 | PG-PUB-01/02/03, PG-ADM-04 | PG-ADM-03/04 |
| `REJECTED` | PG-ADM-03 | PG-EDT-06, PG-ADM-04 | PG-ADM-04 |
| `ARCHIVED` | PG-ADM-03/04 | PG-ADM-04 | PG-ADM-04 |

### Transitions ↔ Pages

All 17 transitions have a page that triggers them, **except**:

- **T11** *(`APPROVED` → `CHANGES_REQUESTED`)* is **unreachable in V1**, because
  approve-and-publish is a single action and no page ever displays an approved
  story. Recorded under **P2-24**.
- **T17** *(schedule)* is FUTURE, as intended.

---

## 5. The Phase 2 issue register

29 new issues. None are resolved here.

**Urgency:** 🔴 needed before the data model is designed · 🟠 needed before that
feature is built · 🟡 needed before launch.

### Contradictions and state-machine issues

| Ref | Issue | Why it matters | Recommendation |
|---|---|---|---|
| **P2-01** ✅ | ~~`BR-13` forbids self-approval; OQ-29 recommends allowing it~~ — **RESOLVED 2026-09-09** | Was: opposite rules for the same transition | **Settled: self-approval is forbidden.** `BR-13` **[CONFIRMED]**, `OQ-29` closed in favour of option (b). See `03` §6.1 and `26-data-model-decisions.md` §2 |
| **P2-22** 🔴 | `SUBMITTED` vs `UNDER_REVIEW` as separate states | Would let admins claim a story and prevent duplicate review; adds a state | Keep one `IN_REVIEW` unless two or more admins commonly review at once |
| **P2-23** 🟠 | Two admins can decide the same story simultaneously | The second action must be refused cleanly, not corrupt the state | Refuse stale actions; consider showing "being reviewed by…" |
| **P2-24** 🟠 | `APPROVED` is never visible, and T11 is unreachable in V1 | Carrying an invisible state is either cheap foresight or dead weight | Keep it — the cost of adding it later is far higher |
| **P2-25** 🔴 | Effect of an admin editing a story that is `IN_REVIEW` | Determines whether the queue can hold half-changed stories | Admin edits keep it in review, recorded |
| **P2-26** 🔴 | A published story with a correction in review is in two situations at once | Must be settled before the data model exists | Model the live version and the working revision as separate records |
| **P2-19** 🟠 | `ARCHIVED` means both "taken down" and "abandoned" | Only one affects readers, listings and search engines | Distinguish them |

### Permissions and security

| Ref | Issue | Why it matters | Recommendation |
|---|---|---|---|
| **P2-30** 🟠 | Editors are granted source access, but Sources is an admin page | A missing page or an accidental permission | Editors reach sources through the picker in the article editor; the management page stays admin-only |
| **P2-31** 🟠 | Editors are granted "own article history", but History is admin-only | Same | Show a simple history on the editor's own story view |
| **P2-07** 🔴 | How preview addresses work is undefined | A guessable or shareable preview address is a route to reading unpublished stories — exactly what `SEC-03` forbids | Previews require a signed-in, entitled user; no shareable link |
| **P2-09** 🟠 | Link previews for unpublished or withdrawn stories | A preview card can leak a headline even when the page will not | Unpublished stories return nothing to preview fetchers |
| **P2-10** 🟠 | Should "forbidden" ever be distinguishable from "not found"? | Saying "forbidden" confirms something exists | Back-office: say forbidden. Anything revealing an unpublished story: behave as not found |
| **P2-11** 🟠 | Sign-in failure messages | Differing messages reveal which addresses are staff | One generic message for every failure |
| **P2-17** 🟠 | Can an admin edit and publish in one motion? | If so, review becomes "rewrite and publish", and the byline may not match the text | Allowed, recorded, editor notified |
| **P2-20** 🟠 | A deactivated editor's drafts and submissions | Work does not stop existing when someone leaves | Admins can reassign or publish it |

### Product decisions Phase 2 could not make

| Ref | Issue | Why it matters | Recommendation |
|---|---|---|---|
| **P2-32** 🟠 | Phase 2 deferred `ADM-15` and `ADM-16`, both marked OPEN | A scope decision, not mine to make | Confirm both as FUTURE |
| **P2-06** 🟠 | Dashboard content is nowhere specified — for either role | Both dashboards are the first screen every user sees, every day | Adopt the minimums proposed in `09` §3 and `10` §2 |
| **P2-08** 🟠 | No requirement defines what Settings contains | A page with no requirement behind it | Define the minimum, or drop the page from V1 |
| **P2-03** 🟡 | Contact page: information or a form? | A form contradicts the read-only public site and adds spam and privacy work | Information only in V1 |
| **P2-29** 🟡 | Can staff edit About / Contact / Privacy themselves? | Otherwise every wording change needs a developer | Fixed at build for V1; editable later |
| **P2-02** 🟡 | A separate "Latest news" page duplicates the homepage | Two addresses showing one list confuses search engines *(SEO-07)* | Do not build it until the homepage is curated |
| **P2-27** 🟡 | Should search result pages be indexed? | They generate unlimited low-value pages | Exclude them |
| **P2-28** 🟡 | Publication timezone is reader-facing, not administrative | It appears on every article, feed entry and search result | Decide with OQ-42 |

### Editorial workflow gaps

| Ref | Issue | Why it matters | Recommendation |
|---|---|---|---|
| **P2-12** 🟠 | Can an editor see who has their story and for how long? | "Who has my story?" is asked constantly in a newsroom | Show waiting time; showing the named admin depends on P2-22 |
| **P2-13** 🟠 | Is there any path to contest a rejection? | Currently the answer is "talk to your editor", which may be fine — but should be chosen | Out of product for V1, stated explicitly |
| **P2-14** 🟠 | Is the editor told why their published story was withdrawn? | For anything beyond a typo, they almost certainly should be | Notify with the reason |
| **P2-16** 🟠 | Can an editor see *what* an admin changed? | Depends on whether revisions are kept (OQ-26) | Yes, if revisions are kept |
| **P2-18** 🟠 | Where is the line between a "typo fix" and a change of meaning? | The fast path for corrections rests entirely on this line | State it in editorial policy, not in software |
| **P2-21** 🟠 | Deleting a section that contains published stories | Public addresses are built from section names — deletion can break every link inside it | Prevent deletion; allow deactivation |
| **P2-15** 🟠 | Losing unsaved work when a session expires | The fastest way to lose a newsroom's trust in a tool | Preserve unsaved text across re-authentication |

### Structural simplifications proposed

| Ref | Proposal | Reasoning |
|---|---|---|
| **P2-04** 🟡 | One sign-in page and one Users page, not separate ones per role | Half the screens, one thing to secure, and no page advertising where the valuable accounts are |
| **P2-05** 🟡 | Drafts / Waiting / Changes requested / Published / Rejected as **filters** on My Articles, not five pages | Identical capability, far fewer screens to build, learn and maintain |

---

## 6. What must be answered before Phase 3

Phase 3 is technology selection and data modelling. It cannot honestly start
while the shape of the data is unknown.

**Must be answered — these define the data model:**

| From Phase 1 | From Phase 2 |
|---|---|
| ~~OQ-08 correcting published stories~~ ✅ | ~~P2-26 how a live version and a working revision relate~~ ✅ |
| ~~OQ-22 article body format~~ ✅ | P2-25 admin edits during review |
| ~~OQ-26 are revisions kept~~ ✅ | ~~P2-01 self-approval~~ ✅ |
| OQ-23 byline versus account | P2-22 one review state or two |
| OQ-24 how sources attach | P2-07 how previews are addressed |
| OQ-18 sections · OQ-20 addresses | |
| OQ-05 / OQ-06 ownership and authorship | |
| OQ-11 audit trail · OQ-12 deletion | |
| OQ-31 expected scale | |

**Should be answered — these affect what gets built, not how it is shaped:**
OQ-02, OQ-03, OQ-04, OQ-07, OQ-14, OQ-15, OQ-16, OQ-17, OQ-19, OQ-21, OQ-25,
OQ-28, ~~OQ-29~~ ✅ · P2-06, P2-08, P2-30, P2-31, P2-32

**Can wait until launch:** everything marked 🟡 in both registers.

---

## 7. What Phase 2 did *not* do

Stated plainly, so the boundary is auditable:

- Chose no technology, framework, database, or hosting
- Designed no schema and no addressing scheme — only *shapes* of addresses, for discussion
- Defined no interfaces between parts of the system
- Wrote no code
- Designed no screens — no layout, typography, colour, or components
- **Resolved no open question from Phase 1**, and resolved none of its own

Every provisional position in Phase 2 names the question it depends on, so
answering a question tells you exactly which pages and flows to revisit.
