# 01 — Product Vision

**Project:** Today_news (working name)
**Document status:** Draft for review
**Stage:** Product discovery (pre-development)
**Last updated:** 2026-09-08

---

## How to read this document

Every statement in this documentation set carries a label so nobody has to guess
what has been decided and what has not:

| Label | Meaning |
|---|---|
| **[CONFIRMED]** | You stated this in the project brief. It is a fixed requirement. |
| **[PROPOSED]** | A design recommendation from me. It needs your explicit approval before it becomes real. |
| **[ASSUMPTION]** | Something I filled in to keep the picture coherent. If it is wrong, correct it — it costs nothing now and a lot later. |
| **[OPEN]** | A genuine unanswered question. It must be answered before the related part is built. Tracked in `05-open-questions.md`. |

Nothing labelled **[PROPOSED]**, **[ASSUMPTION]** or **[OPEN]** should be treated
as a decision.

---

## 1. The vision in one paragraph

**[CONFIRMED]** Today_news is a modern news publishing platform. Journalists and
editors write articles inside a private editorial tool; an editor cannot put
anything in front of the public on their own. An administrator reviews every
submission and decides whether it is published, sent back for changes, or
rejected. Readers get a fast, clean, mobile-friendly public news site that search
engines can index well and that people with disabilities can actually use.

In plain terms: **a newsroom with a door, and only admins hold the key to that door.**

---

## 2. What the platform is made of

There are three distinct products sharing one body of content.

### 2.1 Public news website — [CONFIRMED]

The part the world sees. Anyone can visit it. It shows only articles that an
admin has published. It must be fast, work well on phones, be readable by screen
readers, and be structured so search engines can index and rank it properly.

### 2.2 Editor CMS — [CONFIRMED]

*CMS = "Content Management System" — the private back-office where staff write
and manage articles.*

Where editors do their work: write an article, save it as a draft, submit it for
review, respond to change requests, resubmit.
**Editors can never publish.** This is a hard boundary, not a preference.

### 2.3 Admin CMS — [CONFIRMED]

Where admins run the newsroom: review the queue of submitted articles, approve
and publish, reject, request changes, and manage users and editorial settings
(such as categories and sources).

### 2.4 Manually managed sources — [CONFIRMED]

A "source" is where information in an article came from — an agency report, an
official statement, another publication, a person. Authorised newsroom users
enter and maintain these by hand.

**[CONFIRMED]** We are **not** building automated news scraping or aggregation in
this project. Nothing crawls the internet and creates articles.

---

## 3. Who this is for

### 3.1 Primary users (people who log in)

**Editor / Reporter**
Writes the news. Cares about: writing without friction, not losing work, knowing
where a submission stands, understanding exactly what an admin wants changed.
Often working fast, often against a deadline, sometimes on a phone or tablet.
Not a technical person. **[ASSUMPTION]** Editors are employed or contracted staff,
not the general public — accounts are created for them, they do not self-register.

**Admin / Editor-in-chief / Desk head**
Accountable for what goes live. Cares about: seeing what is waiting for review,
judging quality and accuracy quickly, publishing without ceremony, correcting
mistakes fast, and knowing who did what. Publication accountability is
professional and sometimes legal, so this person needs certainty and a record.

### 3.2 Primary user (does not log in)

**Reader**
A member of the public arriving from a search engine, a shared link, or the
homepage. Cares about: the story loading instantly, being readable on a phone,
and being able to find related news. **[ASSUMPTION]** In V1 readers are anonymous
— no reader accounts, no login, no comments, no personalisation.
See `05-open-questions.md` → OQ-01.

### 3.3 Non-human "user"

**Search engines and social platforms**
Search crawlers, and the link-preview fetchers behind WhatsApp / X / LinkedIn,
are effectively a user class. For a news site they are often the *largest* source
of traffic, so their needs (clean HTML, correct metadata, fast response, stable
URLs) are product requirements, not technical polish.

---

## 4. What success looks like

**[PROPOSED]** V1 is successful if all of the following are true:

1. An editor can write and submit an article without asking anyone for help.
2. An admin can go from "notified of a submission" to "live on the site" in under
   two minutes for a clean article.
3. No article has ever appeared publicly without an admin's explicit action.
4. A published article is visible to a reader within seconds of publication.
5. A published article is indexable by search engines and renders correctly as a
   link preview when shared.
6. The public site loads a full article quickly on a mid-range phone on a normal
   mobile connection.
7. For any published article we can answer: who wrote it, who approved it, when,
   and what changed.

**[OPEN]** Concrete numeric targets (page-load budget, expected articles per day,
expected monthly readers) are not yet known — see OQ-30 and OQ-31. Without them,
"fast" and "scalable" can be asserted but not verified.

---

## 5. Product principles

These are the rules we will use to settle arguments later.

1. **Publication is a privileged act.** Publishing is not "saving with a flag on".
   It is a deliberate, permission-checked, recorded decision made by an admin.

2. **The public site shows published content and nothing else.** Visibility is
   derived from the article's state on the server. It is never derived from
   anything the reader's browser sends.

3. **Trust the server, never the screen.** Hiding a button is a courtesy to the
   user, not a security control. Every rule is enforced where the data lives.

4. **The newsroom's job is writing, not fighting software.** If a workflow step
   exists it must earn its place. Extra approval stages, extra fields and extra
   clicks are costs paid by every article forever.

5. **Correctness beats cleverness in news.** Being able to fix, correct, or pull a
   story quickly matters more than any feature on the roadmap.

6. **Every technology must justify itself.** **[CONFIRMED]** No component gets
   added because it is popular. Each one must trace back to a requirement in this
   documentation set.

7. **Build the small thing that is genuinely production-ready**, not the large
   thing that is nearly ready.

---

## 6. Explicit non-goals for V1

**[CONFIRMED]** Deliberately out of scope for the first release. These may become
goals later; they are not goals now.

- Automated news scraping, crawling, or aggregation
- AI-generated articles or AI-assisted editing
- Reader accounts, comments, or personalisation
- Paywall, subscriptions, or advertising systems
- Native mobile applications
- Multi-language / multi-region editions
- A public API for third parties
- Microservices, message queues, search clusters, or container orchestration
  adopted in advance of a demonstrated need

---

## 7. Where technology decisions stand

**[CONFIRMED]** No technology stack has been chosen. No database schema exists.
No API endpoints exist. No UI has been designed. This is intentional and correct
at this stage.

Technology selection happens **after** requirements, workflow and data
relationships are agreed, and each choice will be recorded together with the
requirement that justifies it.

---

## 8. Glossary (plain language)

| Term | Meaning |
|---|---|
| **CMS** | The private back-office where staff write and manage articles. |
| **Draft** | An article being written. Not visible to the public. |
| **Submit for review** | The editor says "I'm done, please look at this". Still not public. |
| **Approve** | An admin accepts the article. |
| **Publish** | The article becomes visible on the public website. |
| **Request changes** | An admin sends the article back to the editor with notes. |
| **Reject** | An admin declines the article outright. |
| **Unpublish** | Remove a live article from public view without deleting it. |
| **Archive** | Retire an article from active work; keep it for the record. |
| **Revision / version** | A saved snapshot of an article at a point in time. |
| **Audit trail** | An append-only log of who did what, and when. |
| **Slug** | The human-readable part of a web address, e.g. `/city-council-approves-budget`. |
| **Metadata** | Information *about* the article — search-result title, summary, image, author, publish time. |
| **SEO** | Making the site understandable to search engines so stories can be found. |
| **Accessibility (a11y)** | Making the site usable by people using screen readers, keyboards, or with low vision. |
| **Server-side rendering** | The site sends finished HTML, so the story is present even before scripts run — what search engines and slow phones need. |

---

## 9. Related documents

- `02-requirements.md` — what the product must do, as numbered requirements
- `03-user-roles-and-permissions.md` — who may do what
- `04-article-lifecycle.md` — the states an article moves through
- `05-open-questions.md` — what we must decide before building
- `06-v1-vs-future.md` — the scope line for the first release
