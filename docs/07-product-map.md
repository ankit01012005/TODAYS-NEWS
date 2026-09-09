# 07 — Product Map

**Stage:** Phase 2 — product mapping (still pre-development)
**Last updated:** 2026-09-08
**Audience:** everyone, including non-technical readers

This document explains **what the product is made of, who uses each part, and how
a news story travels through the newsroom**. It contains no technical jargon. If
you read only one document in this set, read this one.

---

## A note on what is decided and what is not

Phase 1 ended with **42 open questions**, and none of them have been answered yet.
Fourteen were marked as needing an answer before the foundations are designed.

Phase 2 cannot wait for those answers to draw a map — but it must not pretend
they were answered either. So everywhere a page or a step depends on an open
question, you will see one of these:

| Label | Meaning |
|---|---|
| **[CONFIRMED]** | Decided in Phase 1. Fixed. |
| **[PROVISIONAL]** | Drawn using the Phase 1 *recommendation*, which you have not yet approved. If you decide differently, this part of the map changes. The open question is named each time. |
| **[FUTURE]** | Not part of the first release. |
| **[NEW ISSUE]** | Something Phase 2 uncovered that Phase 1 did not cover. Recorded in `phase-2-open-issues.md`. |

Nothing here overrides Phase 1. Where the two appear to disagree, Phase 1 wins
and the disagreement is recorded as an issue.

---

# Part 1 — The three parts of the product

The platform is one product with three faces. They share the same articles but
serve completely different people.

```
                    +---------------------------+
                    |     THE SAME ARTICLES     |
                    +---------------------------+
                     /            |             \
                    /             |              \
     +-------------------+ +--------------+ +--------------------+
     |  PUBLIC WEBSITE   | |  EDITOR CMS  | |     ADMIN CMS      |
     |                   | |              | |                    |
     |  Anyone           | |  Staff       | |  Newsroom leaders  |
     |  Reads news       | |  Write news  | |  Decide what runs  |
     |  No login         | |  Login       | |  Login             |
     +-------------------+ +--------------+ +--------------------+
```

---

## 1. Public website

### Purpose
The publication itself — the part the world sees. Everything else in the product
exists to make this part correct and trustworthy.

### Who uses it
Anyone. Members of the public arriving from a search engine, a shared link, or
by typing the address. **[CONFIRMED]** They do not log in, do not have accounts,
and cannot submit anything.

A second, invisible audience matters just as much: **search engines and link
previews**. For most news sites they bring in more readers than the homepage
does, so their needs are treated as product requirements, not technical detail.

### What it can do

| Capability | Status |
|---|---|
| Show the latest published news | [CONFIRMED] |
| Show a full article — headline, summary, story, author, date, picture | [CONFIRMED] |
| Group articles into sections such as Politics or Business | [PROVISIONAL — OQ-18] |
| Show where an article's information came from | [PROVISIONAL — OQ-24] |
| Let readers search for a story | [PROVISIONAL — OQ-19, may be dropped from V1] |
| Work properly on phones | [CONFIRMED] |
| Be usable by people with disabilities | [CONFIRMED] |
| Be found and correctly displayed by search engines and social apps | [CONFIRMED] |
| Explain who we are and how we handle corrections | [PROVISIONAL] |

**It cannot:** show anything unpublished, accept comments, collect sign-ups, or
identify who is reading.

### How you move around it

```
Home
├── Section pages ......... Politics, Business, Technology, and so on
│     └── Article
├── Article ............... the story itself
│     ├── Section it belongs to
│     └── Other stories in that section
├── Search ................ if included in V1
├── About / Contact / Editorial policy / Privacy
└── "Page not found" ...... for wrong or removed addresses
```

### The main things that happen here
A reader arrives, reads a story, and either leaves or reads another one. That is
the whole workflow. Its simplicity is exactly why the public site must be fast
and reliable — there is nothing else to hold a reader's attention.

Detailed journeys: `08-reader-flow.md`.

---

## 2. Editor CMS

*"CMS" simply means the private area where staff manage content.*

### Purpose
The writer's desk. A private workspace where journalists write stories and hand
them to an admin for a decision.

### Who uses it
**[CONFIRMED]** Newsroom staff with an Editor account, created for them by an
admin. Often working at speed and under deadline. Not technical people.

### What it can do

| Capability | Status |
|---|---|
| Sign in privately | [CONFIRMED] |
| See all of their own stories and what is happening to each | [CONFIRMED] |
| Write a new story | [CONFIRMED] |
| Save it privately as often as they like | [CONFIRMED] |
| Have work saved automatically so it cannot be lost | [PROVISIONAL — OQ-26] |
| Attach a picture and list the sources used | [PROVISIONAL — OQ-21, OQ-24] |
| See exactly how it will look to a reader before sending it | [PROVISIONAL] |
| Send it to an admin for review | [CONFIRMED] |
| Take it back if it was sent by mistake | [PROVISIONAL — OQ-04] |
| Read the admin's feedback, fix the story, and send it again | [CONFIRMED] |
| See when a story is published or rejected | [CONFIRMED] |

**It absolutely cannot: publish anything.** **[CONFIRMED]** This is the single
most important rule in the product, and there is no screen, button, or address in
the editor's world that leads to publication.

### How you move around it

```
Dashboard ................. what needs my attention today
├── My Articles ........... everything I have written
│     ├── Drafts
│     ├── Waiting for review
│     ├── Changes requested   <- the ones needing my attention
│     ├── Published
│     └── Rejected
├── Write a new article
└── My profile
```

**[PROVISIONAL — NEW ISSUE P2-05]** The five groupings above are recommended as
*filters on one "My Articles" page* rather than five separate pages. Same
capability, far fewer screens to build, learn and maintain.

### The main things that happen here
Write → save → send for review → wait → respond to feedback → send again → see
it published. Detailed journeys: `09-editor-flow.md`.

---

## 3. Admin CMS

### Purpose
The editor-in-chief's desk. Where someone decides what the publication puts its
name to — and where the newsroom itself is managed.

### Who uses it
**[CONFIRMED]** Newsroom leadership. This is an accountability role: whoever
publishes is answerable for what the public reads, sometimes professionally and
occasionally legally.

### What it can do

| Capability | Status |
|---|---|
| See everything waiting for a decision, in one queue | [CONFIRMED] |
| Read a submitted story exactly as a reader would see it | [CONFIRMED] |
| **Publish it** | [CONFIRMED] |
| Send it back with written feedback | [CONFIRMED] |
| Reject it with a reason | [CONFIRMED] |
| See every story in the newsroom, in any state | [PROVISIONAL] |
| Edit an editor's story directly | [PROVISIONAL — OQ-02] |
| Take a published story back down | [PROVISIONAL — OQ-16] |
| See the history of who did what to a story | [PROVISIONAL — OQ-11] |
| Add and remove staff, and set who is an editor or admin | [CONFIRMED] |
| Manage the list of sections | [PROVISIONAL — OQ-18] |
| Manage the list of sources | [CONFIRMED] |

### How you move around it

```
Dashboard ................. what needs a decision right now
├── Review Queue .......... stories waiting for me       <- the main workspace
│     └── Review a story
├── All Articles .......... everything, filterable by state, author, section
│     ├── Article history
│     └── Article editor
├── Users ................. staff accounts and their roles
├── Sources ............... the shared list of sources
├── Categories ............ the sections of the site
├── Settings .............. publication-wide options
└── My profile
```

### The main things that happen here
Open the queue → read a story → make one of three decisions → move to the next
one. Plus periodic housekeeping of staff, sections and sources. Detailed
journeys: `10-admin-flow.md`.

---

# Part 2 — Every page in the product

The full detail for each page — what data it needs, what can go wrong, who may
open it — is in `12-page-specification.md`. This is the overview.

Each page has a permanent reference number so it can be discussed and traced
later.

## Public website

| Ref | Page | V1? | Notes |
|---|---|---|---|
| PG-PUB-01 | Homepage | **V1** | Latest published stories, newest first |
| PG-PUB-02 | Section page | **V1** | Depends on OQ-18 |
| PG-PUB-03 | Article page | **V1** | The core page of the product |
| PG-PUB-04 | Search results | **V1?** | Only if simple — OQ-19 |
| PG-PUB-05 | About | **V1** | |
| PG-PUB-06 | Contact | **V1** | Information only, no form — see P2-03 |
| PG-PUB-07 | Editorial policy & corrections | **V1** | Credibility page; relates to OQ-41 |
| PG-PUB-08 | Privacy policy | **V1** | Likely legally required — OQ-32 |
| PG-PUB-09 | Page not found | **V1** | |
| PG-PUB-10 | Something went wrong | **V1** | |
| PG-PUB-11 | Story withdrawn notice | **V1?** | Only under one option of OQ-16 |
| PG-PUB-M1 | Sitemap *(for search engines)* | **V1** | Not a page people visit |
| PG-PUB-M2 | Crawler rules *(for search engines)* | **V1** | Not a page people visit |
| PG-PUB-M3 | News feed / RSS | **V1** | Not a page people visit |
| PG-PUB-F1 | Author page | FUTURE | Needs OQ-23 answered first |
| PG-PUB-F2 | Topic/tag page | FUTURE | Tags are future |
| PG-PUB-F3 | "Latest news" page | FUTURE | Duplicates the homepage today — see P2-02 |
| PG-PUB-F4 | Archive by date | FUTURE | |
| PG-PUB-F5 | Newsletter signup | FUTURE | |
| PG-PUB-F6 | Comments | FUTURE | A product of its own |

## Editor CMS

| Ref | Page | V1? | Notes |
|---|---|---|---|
| PG-EDT-01 | Staff sign-in | **V1** | Shared with admins — see P2-04 |
| PG-EDT-02 | Two-step verification | **V1?** | OQ-28 |
| PG-EDT-03 | Forgot password | **V1** | |
| PG-EDT-04 | Set password / accept invitation | **V1** | |
| PG-EDT-05 | Editor dashboard | **V1** | Content not specified in Phase 1 — P2-06 |
| PG-EDT-06 | My Articles | **V1** | With state filters |
| PG-EDT-07 | Article editor | **V1** | Used for both writing and editing |
| PG-EDT-08 | Article preview | **V1** | Must not be publicly reachable — P2-07 |
| PG-EDT-09 | Article read-only view | **V1?** | Needed if OQ-03 locks articles during review |
| PG-EDT-10 | My profile | **V1** | |
| PG-EDT-11 | Access denied | **V1** | |
| PG-EDT-F1 | Notifications centre | FUTURE | In-app badges suffice for V1 — OQ-25 |
| PG-EDT-F2 | Media library | FUTURE | OQ-21 |

## Admin CMS

Admins reuse the editor's sign-in, article editor, preview and profile pages.

| Ref | Page | V1? | Notes |
|---|---|---|---|
| PG-ADM-01 | Admin dashboard | **V1** | Content not specified in Phase 1 — P2-06 |
| PG-ADM-02 | Review queue | **V1** | The admin's main workspace |
| PG-ADM-03 | Article review | **V1** | Where publish/reject/send-back happens |
| PG-ADM-04 | All articles | **V1** | Also serves "manage published articles" |
| PG-ADM-05 | Article history | **V1?** | OQ-11 |
| PG-ADM-06 | Users | **V1** | One page for all staff — see P2-04 |
| PG-ADM-07 | User detail / invite | **V1** | |
| PG-ADM-08 | Sources | **V1** | |
| PG-ADM-09 | Source detail | **V1** | |
| PG-ADM-10 | Categories | **V1** | OQ-18 |
| PG-ADM-11 | Settings | **V1?** | Nobody has defined what is in it — P2-08 |
| PG-ADM-F1 | Tags | FUTURE | Requested in the Phase 2 brief, but tags are future work |
| PG-ADM-F2 | Media library | FUTURE | Requested in the brief; images attach to articles directly in V1 |
| PG-ADM-F3 | Scheduling | FUTURE | OQ-07 |
| PG-ADM-F4 | Homepage curation | FUTURE | OQ-17 |
| PG-ADM-F5 | Analytics | FUTURE | |
| PG-ADM-F6 | Full activity log | FUTURE | Per-article history is the V1 version |

**Totals for V1:** 11 public pages + 3 machine-facing files + 11 editor pages +
11 admin pages ≈ **36 things to build**, of which 6 are conditional on an open
question.

---

# Part 3 — Navigation structure

## Public website

```
Home  [PG-PUB-01]
├── Section  [PG-PUB-02]              (Politics, Business, Technology, ...)
│    └── Article  [PG-PUB-03]
├── Article  [PG-PUB-03]
│    ├── its Section  [PG-PUB-02]
│    ├── more stories in that section
│    └── its Sources                  (shown on the page itself)
├── Search  [PG-PUB-04]               (if included in V1)
└── Footer
     ├── About  [PG-PUB-05]
     ├── Contact  [PG-PUB-06]
     ├── Editorial policy  [PG-PUB-07]
     └── Privacy  [PG-PUB-08]

Reached only by accident or by machines:
     Page not found  [PG-PUB-09]
     Something went wrong  [PG-PUB-10]
     Sitemap / crawler rules / news feed  [PG-PUB-M1..M3]
```

**[PROVISIONAL — OQ-18/OQ-20]** Web addresses would look like
`/politics/council-approves-budget`. Once a story is published, its address never
changes — even if the headline is later corrected. Addresses are public promises;
breaking them breaks every link ever shared.

## Editor CMS

```
Sign in  [PG-EDT-01]
   |
   v
Dashboard  [PG-EDT-05]
├── My Articles  [PG-EDT-06]
│    ├── filter: Drafts
│    ├── filter: Waiting for review
│    ├── filter: Changes requested
│    ├── filter: Published
│    └── filter: Rejected
│         └── Article editor  [PG-EDT-07]
│              └── Preview  [PG-EDT-08]
├── Write a new article  →  Article editor  [PG-EDT-07]
└── My profile  [PG-EDT-10]
```

## Admin CMS

```
Sign in  [PG-EDT-01]           (same door, different destination)
   |
   v
Dashboard  [PG-ADM-01]
├── Review Queue  [PG-ADM-02]
│    └── Article review  [PG-ADM-03]
│         ├── Article history  [PG-ADM-05]
│         └── Article editor  [PG-EDT-07]
├── All Articles  [PG-ADM-04]
│    └── Article review / editor / history
├── Users  [PG-ADM-06]
│    └── User detail or invite  [PG-ADM-07]
├── Sources  [PG-ADM-08]
│    └── Source detail  [PG-ADM-09]
├── Categories  [PG-ADM-10]
├── Settings  [PG-ADM-11]
└── My profile  [PG-EDT-10]
```

---

# Part 4 — How a story travels through the newsroom

In plain language, with no software terms.

```
   THE WRITER                    THE DECISION                  THE PUBLIC
   ---------                     ------------                  ----------

   Starts a story
        |
        v
   Saves it privately  ..................................  Sees nothing
        |
        v
   Sends it for review
        |
        +----------------->  An admin reads it
                                     |
              +----------------------+----------------------+
              |                      |                      |
              v                      v                      v
       "Publish it"          "Fix these things"        "We're not
              |                      |                  running this"
              |                      v                      |
              |              Back to the writer,             v
              |              with written notes         Story is closed,
              |                      |                  kept on record
              |                      v
              |              Writer revises and
              |              sends it again
              |                      |
              |                      +---> back to the admin
              v
      Story goes live  ......................................  Can read it
```

**Three things are always true:**

1. **[CONFIRMED]** Saving a story does not publish it.
2. **[CONFIRMED]** Sending a story for review does not publish it.
3. **[CONFIRMED]** Only an admin can publish, and only by deliberately choosing to.

### After publication

**[PROVISIONAL — OQ-08]** If a published story needs correcting, the version the
public is reading **stays up and untouched** while the correction is written and
reviewed. When the admin approves it, the corrected version replaces the live one
instantly. Readers never see a missing or half-finished story.

**[PROVISIONAL — OQ-16]** If a story must come down entirely, an admin can
withdraw it. It disappears from the site and from search engine listings, but is
kept on record — nothing is destroyed.

---

# Part 5 — What we are deliberately *not* building

The Phase 2 brief mentioned several pages that Phase 1 placed in the future.
Rather than quietly include them, here they are with the reason:

| Page mentioned | Why it is not in V1 |
|---|---|
| Tags management | Tags are future work. Nothing in V1 uses them. |
| Media library | V1 attaches one picture to a story directly. A library is worth building once there are enough pictures to lose track of. |
| Author pages | Requires deciding whether a byline is the same thing as a login — still open (OQ-23). |
| Scheduled publishing | Would introduce the first process that acts while nobody is logged in. Deferred deliberately (OQ-07). |
| Separate "Latest news" page | Identical to the homepage today. Two addresses showing the same list confuses search engines. It becomes worthwhile only when the homepage is hand-curated (OQ-17). |
| Separate "Editors" page | The Users page with a filter does the same job. |
| Comments, newsletter, reader accounts | Each is a separate product with its own moderation, consent and privacy obligations. |

---

## Related documents

| Document | What it covers |
|---|---|
| `08-reader-flow.md` | Every way a reader can arrive and move through the site |
| `09-editor-flow.md` | The writer's journey, step by step |
| `10-admin-flow.md` | The decision-maker's journey, step by step |
| `11-article-workflows.md` | The precise rules for what a story can do next, and who may do it |
| `12-page-specification.md` | Full detail of every page |
| `phase-2-open-issues.md` | Contradictions and new questions found during Phase 2 |
