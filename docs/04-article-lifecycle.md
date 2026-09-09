# 04 — Article Lifecycle and Editorial Workflow

**Stage:** Product discovery (pre-development)
**Last updated:** 2026-09-08

This document describes the journey of a single article from first keystroke to
the public website — and afterwards.

---

## 1. The confirmed workflow

**[CONFIRMED]** This is the workflow you specified. It is fixed.

```
EDITOR
  |
  v
Create article
  |
  v
Save draft
  |
  v
Submit for review
  |
  v
ADMIN REVIEW
  |
  +------------------------+
  |                        |
  v                        v
APPROVE              REQUEST CHANGES
  |                        |
  v                        v
PUBLISH                 EDITOR
                           |
                           v
                       RESUBMIT
                           |
                           v
                     ADMIN REVIEW
```

**[CONFIRMED]** Two absolute rules:

1. An article never becomes public merely because an editor saved or submitted it.
2. Only an authorised admin can approve and publish.

---

## 2. Proposed states

**[PROPOSED]** A "state" is the article's current situation. Every article is in
exactly one state at any moment. The state alone decides whether the public can
see it.

| State | Plain meaning | Public? | Who can act |
|---|---|---|---|
| `DRAFT` | Being written. Belongs to the editor. | No | Owner, Admin |
| `IN_REVIEW` | Submitted, waiting for an admin. | No | Admin (Owner ⚠️ OQ-03/OQ-04) |
| `CHANGES_REQUESTED` | Admin sent it back with notes. | No | Owner, Admin |
| `APPROVED` | Admin accepted it; not yet live. | No | Admin |
| `PUBLISHED` | Live on the public site. | **Yes** | Admin |
| `REJECTED` | Admin declined it. | No | Admin |
| `ARCHIVED` | Retired from public view and active work; retained. | No | Admin |

**[PROPOSED] Why `APPROVED` exists as a separate state**, even though in V1 the
admin will approve and publish in a single click: it is the natural home for
scheduled publishing, and for any future second check before going live.
Introducing it now costs one extra value; introducing it later means changing
every rule that currently assumes "approved means live". If you would rather have
the absolute minimum, approve and publish can collapse into one state — but I
recommend against it. **[OPEN]** — OQ-07 decides whether scheduling exists at all.

**[PROPOSED]** `UNPUBLISHED` is deliberately *not* a separate state. Taking a
live article down returns it to `ARCHIVED` (retired) or `DRAFT` (being fixed),
depending on intent — see section 6. **[OPEN]** — OQ-16.

---

## 3. Full state diagram — [PROPOSED]

```
                    +---------+
       create  -->  |  DRAFT  |  <---------------------+
                    +----+----+                        |
                         |                             |
            submit for review                          | edit / revise
                         |                             |
                         v                             |
                  +-------------+           +----------+----------+
                  |  IN_REVIEW  | --------> | CHANGES_REQUESTED   |
                  +------+------+  request  +---------------------+
                     |      |      changes            ^
                     |      |                         |
            approve  |      | reject                  | (resubmit goes back
                     |      |                         |  to IN_REVIEW)
                     v      v                         |
              +----------+  +------------+            |
              | APPROVED |  |  REJECTED  |            |
              +-----+----+  +-----+------+            |
                    |             |                   |
            publish |             | reopen -----------+
                    v             |
             +-------------+      v
             |  PUBLISHED  |   (ARCHIVED)
             +------+------+
                    |
        unpublish   |   correct / update
          +---------+---------+
          v                   v
     (ARCHIVED)          new revision -> IN_REVIEW -> republish
```

---

## 4. Transition table — [PROPOSED]

The complete list of legal moves. **[PROPOSED]** Anything not in this table is
refused by the server (BR-10).

| # | From | Action | To | Who | Requires |
|---|---|---|---|---|---|
| T1 | — | Create | `DRAFT` | Editor, Admin | — |
| T2 | `DRAFT` | Save | `DRAFT` | Owner, Admin | — |
| T3 | `DRAFT` | Submit for review | `IN_REVIEW` | Owner, Admin | Headline, summary, body present (BR-09) |
| T4 | `IN_REVIEW` | Request changes | `CHANGES_REQUESTED` | Admin | Non-empty comment (BR-07) |
| T5 | `IN_REVIEW` | Approve | `APPROVED` | Admin **other than the author/last reviser** | **BR-13** — self-approval refused |
| T6 | `IN_REVIEW` | Reject | `REJECTED` | Admin | Non-empty reason (BR-08) |
| T7 | `IN_REVIEW` | Withdraw | `DRAFT` | Owner | ⚠️ OQ-04 |
| T8 | `CHANGES_REQUESTED` | Save | `CHANGES_REQUESTED` | Owner, Admin | — |
| T9 | `CHANGES_REQUESTED` | Resubmit | `IN_REVIEW` | Owner, Admin | BR-09 |
| T10 | `APPROVED` | Publish | `PUBLISHED` | Admin | — |
| T11 | `APPROVED` | Send back | `CHANGES_REQUESTED` | Admin | Comment |
| T12 | `PUBLISHED` | Unpublish | `ARCHIVED` | Admin | Reason ⚠️ OQ-16 |
| T13 | `PUBLISHED` | Start a correction | new revision in `DRAFT` | Editor, Admin | Live version stays live ⚠️ OQ-08 |
| T14 | `REJECTED` | Reopen | `DRAFT` | Admin | ⚠️ OQ-15 |
| T15 | `REJECTED` | Archive | `ARCHIVED` | Admin | ⚠️ OQ-13 |
| T16 | `ARCHIVED` | Restore | `DRAFT` | Admin | ⚠️ OQ-13 |
| T17 | `APPROVED` | Schedule | `APPROVED` (with publish time) | Admin | ⚠️ OQ-07 |

---

## 5. What each decision means in practice

### 5.1 Save draft — [CONFIRMED]
Private. Visible only to its owner (and admins). Nothing else happens. No
notification. Can be repeated indefinitely.

### 5.2 Submit for review — [CONFIRMED]
The editor declares the article ready. It enters the admin review queue.
**[CONFIRMED]** Still not public.
**[PROPOSED]** The article becomes read-only for the editor while it waits, so
that an admin never reviews text that is changing underneath them — **[OPEN]**,
OQ-03.

### 5.3 Approve — [CONFIRMED]
**[CONFIRMED — BR-13, resolved 2026-09-09]** The approving admin must not be the
person who wrote or last revised the article. Self-approval is refused by the
server, not merely discouraged.

The admin accepts the article. In V1 **[PROPOSED]** this is combined with
publishing into one action labelled "Approve & Publish", because a separate
second click serves no purpose until scheduling exists.

### 5.4 Publish — [CONFIRMED]
The article becomes publicly visible. **[PROPOSED]** At this moment the system
records the publishing admin and the publish time, fixes the article's permanent
web address, and makes it eligible for the sitemap and listing pages.

### 5.5 Request changes — [CONFIRMED]
The article returns to the editor with feedback.
**[PROPOSED]** The comment is mandatory (BR-07) — "sent back with no explanation"
is the single most common source of newsroom friction. **[PROPOSED]** Feedback is
kept with the article so the conversation is visible on resubmission, not lost in
chat or email.
**[OPEN]** Is feedback a single note per round, or an ongoing thread? — OQ-25.

### 5.6 Reject — [CONFIRMED]
The admin declines the article. **[OPEN]** What "rejected" actually means is
undecided and matters: is it *dead* (terminal), or merely *not now* (reopenable)?
See OQ-15. **[PROPOSED]** Reopenable by an admin, with a mandatory reason
recorded — killed stories genuinely do come back when facts change.

### 5.7 Resubmit — [CONFIRMED]
Back into the review queue. **[PROPOSED]** The admin can see what changed since
the previous submission; otherwise every round of review means re-reading the
entire article, and review quality falls as article length grows.

---

## 6. The hardest question: editing a published article — **RESOLVED**

> **[CONFIRMED — `OQ-08`, resolved 2026-09-09]** **Option C was chosen** — live
> version plus working copy. The published version stays live and untouched while
> a correction is drafted and reviewed as a new revision; on approval it replaces
> the live one instantly. The data model implementing this is
> `26-data-model-decisions.md` §1. The analysis below is retained as the record of
> how the decision was reached.

This was the most consequential decision in the whole workflow, so it gets its own
section.

A story is live. A fact is wrong, or a name is misspelled, or there is a major
development. What happens?

**Option A — edit live.**
Changes to a published article go public immediately, no review.
*Fast, and dangerous: it is a hole straight through the approval rule. Anyone who
can edit a published article effectively publishes without approval.*

**Option B — every edit needs re-approval, article goes offline meanwhile.**
*Safe, and unacceptable for news: a typo fix would pull a live story down.*

**Option C — live version plus working copy — [PROPOSED, recommended].**
The published version stays live and untouched. Edits create a new revision
alongside it, which goes through review as usual; on approval it replaces the
live version instantly.
*Readers never see a broken or missing story; the approval rule holds; the price
is that the system stores two versions of an article, which is also exactly what
gives us version history for free.*

**[PROPOSED] Refinement worth considering:** allow admins a fast path for trivial
corrections (typos, formatting) that goes live immediately but is recorded in the
audit trail as a direct edit. This keeps newsroom reality workable without
opening the door to editors. **[OPEN]** — needs your call.

**[PROPOSED]** If a change is *material* (facts, meaning, quotes), the public
article should show an update or correction notice with a timestamp — PUB-09,
SEO-11. This is standard practice for credible publications and is a product
decision, not a technical one. **[OPEN]** — OQ-09.

---

## 7. Edge cases that need answers before building

| Situation | Question | Reference |
|---|---|---|
| Editor edits while admin is reviewing | Locked, or allowed? | OQ-03 |
| Two editors open the same article | Last save wins, or a lock, or a warning? | OQ-05 |
| Editor is deactivated with articles in review | Reassign, or leave in place? | OQ-27 |
| Admin deletes a category still used by articles | Block, or reassign, or orphan? | OQ-18 |
| Scheduled publish time passes while the site is down | Publish late, or skip? | OQ-07 |
| Article is unpublished after being indexed by search engines | What do search engines and existing links see? | OQ-16 |
| Same story submitted twice by two reporters | Duplicate detection, or human problem? | OQ-35 |
| Source is deleted while cited by published articles | Block, or keep a snapshot of the citation? | OQ-14 |

---

## 8. Notifications — [PROPOSED], [OPEN] OQ-25

Workflow only works if the next person knows it is their turn. Without
notifications, editors refresh a page and admins forget submissions exist.

**[PROPOSED]** Minimum viable notification set for V1:

| Event | Who is told |
|---|---|
| Article submitted for review | All admins |
| Changes requested | The article's owner |
| Article approved / published | The article's owner |
| Article rejected | The article's owner |

**[PROPOSED]** In-app indicators (a count on the review queue, a state badge on
the editor's list) are the V1 minimum and require no external service. Email is
the obvious next step. **[OPEN]** — OQ-25 decides whether email is in V1.

---

## 9. Record-keeping — [PROPOSED], [OPEN] OQ-11

**[PROPOSED]** Every transition in section 4 records: what happened, who did it,
when, from which state to which state, and any comment or reason given. The
record is append-only and cannot be edited by anyone, including admins (SEC-11).

**Why this matters for a news platform specifically:** if a published story is
later disputed — legally, professionally, or publicly — the only defensible answer
to "who approved this and when?" is a record made at the time. Adding this after
launch means the first months of publishing have no history at all.

---

## 10. What is deliberately *not* in this workflow — [CONFIRMED]

- No multi-stage approval chains (copy desk → legal → chief editor)
- No parallel or simultaneous reviewers
- No automatic publishing under any condition
- No AI checks, scoring, or automated gates
- No workflow that can be reconfigured by users; the states above are fixed in V1
