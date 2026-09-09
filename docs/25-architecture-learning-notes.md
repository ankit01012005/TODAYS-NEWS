# 25 — Architecture Learning Notes

**Stage:** Phase 4A — architecture discovery
**Last updated:** 2026-09-09
**Audience:** the developer building this project
**Companion to:** `23-architecture-discovery.md`

---

## 0. How to use this

Every concept below is explained **using Today News itself**, not a generic
shopping-cart example. Each follows the same four questions:

**WHAT IS IT? · WHY DO WE NEED IT? · HOW DOES IT WORK? · DO WE NEED IT IN V1?**

You already know JavaScript and Node.js. This document does not re-teach those. It
covers the concepts that sit *around* them in a production system.

**Read in this order if you are starting cold:** §1-6 (the backend shape), then
§10-15 (data), then §16-21 (auth), then the rest as they come up.

**A note on the V1 answers.** Several concepts below get "no, not in V1". That is
not a suggestion to learn them later out of interest — it is the architecture
deliberately keeping the system small. Knowing *why* something is excluded is as
useful as knowing how it works.

---

## 1. REST API

**WHAT IS IT?**
A convention for letting one program ask another program to do something over
HTTP. Things are named as *resources* (articles, users, sources), and standard
HTTP verbs act on them.

**WHY DO WE NEED IT?**
The Next.js front end and the NestJS backend are two separate programs. They need
an agreed way to talk. REST is that agreement.

**HOW DOES IT WORK?**
A request names a resource and a verb; the response carries data and a status
code. In this project, roughly:

```
GET  /articles?state=DRAFT     "list my drafts"
POST /articles                 "create an article"
PATCH /articles/{id}           "change this article's text"
POST /articles/{id}/submit     "submit this article for review"
```

**Notice the last one.** It is not `PATCH /articles/{id}` with `{state:
"IN_REVIEW"}`. This project deliberately exposes workflow changes as **named
actions**, because `BR-10` says only the seventeen defined transitions are legal.
If the API accepted "set state to PUBLISHED", then every bug and every malformed
request becomes a potential publication. A named `publish` action has one code
path, one permission check and one audit write. **This is the most important
API-design decision in the project** — `23` §8.2.

**DO WE NEED IT IN V1?** Yes. It is how the two halves communicate.

---

## 2. API layers

**WHAT IS IT?**
Splitting backend code into layers, each with one job, so that a request passes
through them in order rather than everything living in one function.

**WHY DO WE NEED IT?**
Because of `SEC-01`: *every permission check happens on the server, on every
request*. If permission logic, business rules and database queries are mixed in
one place, the check that gets forgotten is the one that lets an editor publish.

**HOW DOES IT WORK?**
For Today News:

```
Controller    "POST /articles/123/publish arrived"      HTTP only
Guard         "May this user publish?"                  permission only
Service       "Is PUBLISHED legal from IN_REVIEW?"      business rules only
Repository    "Write the row"                           database only
```

Each layer knows only about the one below it. The service that implements the
state machine has no idea HTTP exists — which is exactly why it is easy to test.

**DO WE NEED IT IN V1?** Yes. This is the structure that makes the sixteen
business rules testable and the permission checks reliable.

---

## 3. Controllers

**WHAT IS IT?**
The layer that receives an HTTP request and returns an HTTP response. Nothing
else.

**WHY DO WE NEED IT?**
To keep HTTP concerns — URLs, status codes, headers — out of your business logic.

**HOW DOES IT WORK?**
The `ArticlesController` receives `POST /articles/123/submit`, reads the ID,
hands off to the service, and turns the result into a status code: `200` for
success, `422` if `BR-09` failed because the body was empty, `403` if the user
lacks the capability, `404` if revealing the article's existence would leak an
unpublished story (`SEC-03`).

**The rule:** a controller should have almost no `if` statements about business
rules. If you see the word "publish" in a decision inside a controller, the logic
is in the wrong layer.

**DO WE NEED IT IN V1?** Yes.

---

## 4. Services

**WHAT IS IT?**
The layer holding the actual rules of your product — what is allowed, what happens
in what order.

**WHY DO WE NEED IT?**
This is where Today News actually lives. The state machine in `11` §4 is a
service. The sixteen business rules are services.

**HOW DOES IT WORK?**
`ArticleTransitionService.publish(articleId, actor, expectedVersion)` does, in
one transaction:

1. load the article;
2. check the actor has the publish capability (`BR-02`);
3. check `PUBLISHED` is reachable from the current state (`BR-10`);
4. check nobody else has moved it (`P2-23`);
5. write the new state;
6. record who published it and when (`BR-06`);
7. write the audit entry (`CAP-15`);
8. commit.

Because this is a plain class with its dependencies passed in, you can test
"an editor cannot publish" without starting a web server.

**DO WE NEED IT IN V1?** Yes — it is the product.

---

## 5. Repositories / data access

**WHAT IS IT?**
The only layer that talks to the database. Everything else asks it for data.

**WHY DO WE NEED IT?**
`BR-01` says an article is publicly visible **only** when `PUBLISHED`. If fifteen
different places write their own query, one of them will eventually forget
`WHERE state = 'PUBLISHED'` — and that one leaks embargoed journalism.

**HOW DOES IT WORK?**
A method like `findPublishedBySlug(slug)` contains that filter once. Public code
cannot fetch an unpublished article because there is no method that returns one.

**This is a security control, not a tidiness preference.** Risk `R-06` in `23`
§26 is exactly this mistake.

**DO WE NEED IT IN V1?** Yes.

---

## 6. ORM (Object-Relational Mapper)

**WHAT IS IT?**
A library that lets you work with database rows as JavaScript objects instead of
writing SQL by hand. We recommend **Prisma**.

**WHY DO WE NEED IT?**
Most of this project's queries are ordinary — fetch an article by slug, list
articles by state. Writing that as raw SQL is repetitive and easy to get subtly
wrong. An ORM also protects against SQL injection by default (`SEC-06`).

**HOW DOES IT WORK?**
You describe your data once in a schema file:

```
model Article {
  id          String   @id @default(cuid())
  slug        String   @unique
  headline    String
  state       ArticleState
  authorId    String
  publishedAt DateTime?
}
```

Prisma generates a typed client, so `prisma.article.findUnique({ where: { slug }})`
returns an object your editor knows the shape of. Typos become errors before the
code runs.

**Its weakness, honestly:** an ORM can generate less efficient queries than
hand-written SQL for complex reads. For this project's simple queries — and with
public pages cached anyway — that does not bite. Prisma also lets you drop to raw
SQL for a specific query without abandoning it.

**DO WE NEED IT IN V1?** Yes.

---

## 7. Relational database

**WHAT IS IT?**
A database storing data in tables with defined columns, where tables reference
each other. **PostgreSQL** is our recommendation.

**WHY DO WE NEED IT?**
Today News's data is deeply interconnected: an article has an author, a category,
several sources, many revisions and many audit entries. `SRC-04` wants sources
*reusable across articles* — that is a relationship, not a copy.

**HOW DOES IT WORK?**
Each thing gets a table. Relationships are stored as references:

```
articles.author_id      -> users.id
articles.category_id    -> categories.id
article_sources         -> joins articles and sources (many-to-many)
article_revisions.article_id -> articles.id
audit_log.article_id    -> articles.id
```

The database enforces these. You cannot create an article pointing at a user who
does not exist. That is a safety net beneath your application code.

**Why not a document database?** Those suit self-contained documents with few
relationships. Ours are highly relational, and — more decisively — we need
several rows written atomically (§8) and a genuinely uneditable audit table (§27).

**DO WE NEED IT IN V1?** Yes.

---

## 8. Transactions

**WHAT IS IT?**
A way to group several database writes so that either **all** succeed or **none**
do. There is no in-between.

**WHY DO WE NEED IT?**
This is one of the most important concepts for this project. When an admin
publishes, three things must happen: the state changes, the publisher and time are
recorded (`BR-06`), and an audit entry is written (`CAP-15`).

Without a transaction, the state could change and then the audit write could fail.
You would have a published article with no record of who published it — and "who
approved this?" is precisely the question asked when a story becomes a legal
problem.

**HOW DOES IT WORK?**

```
BEGIN
  state -> PUBLISHED
  published_by = actor, published_at = now
  INSERT INTO audit_log ...
COMMIT          <- all three become real together
                   any failure = none of them happened
```

**A related rule:** cache invalidation happens **after** commit, never inside the
transaction. Otherwise a slow cache call could roll back a publication.

**DO WE NEED IT IN V1?** Yes. Every state transition is transactional.

---

## 9. Migrations

**WHAT IS IT?**
Version control for your database structure. Each change to the schema is a file,
applied in order.

**WHY DO WE NEED IT?**
Your database structure will change — nine open questions guarantee it. You need
the same change applied identically to your machine, staging and production,
without anyone editing tables by hand.

**HOW DOES IT WORK?**
Change the Prisma schema, generate a migration, review the SQL it produced, commit
it. Deployment applies pending migrations in order.

**The production rule (`OPS-03` — no downtime):** make changes **additive** first.
To rename a column: add the new one, write to both, backfill, switch reads, then
remove the old one in a later release. A single rename breaks every running copy
of the old code the instant it runs.

**DO WE NEED IT IN V1?** Yes, from the first schema.

---

## 10. Database indexes

**WHAT IS IT?**
A lookup structure that lets the database find rows without scanning the whole
table — like an index at the back of a book.

**WHY DO WE NEED IT?**
`SCL-01` says the article count grows indefinitely. Without an index, finding one
article by slug means reading every article. Fine at 100, painful at 100,000.

**HOW DOES IT WORK?**
Index the columns you filter and sort by:

| Index | Serves |
|---|---|
| `slug` (unique) | Article page lookup — the most common query in the product |
| `(state, published_at DESC)` | Homepage, RSS, sitemap |
| `(category_id, state, published_at)` | Section pages |
| `(state, submitted_at)` | The admin review queue |
| Full-text index on published content | Search (§24) |

**The trade-off:** indexes make reads faster and writes slightly slower, and use
disk. For this product — overwhelmingly reads — that is a very good trade.

**DO WE NEED IT IN V1?** Yes. Add them with the schema, not after complaints.

---

## 11. Authentication

**WHAT IS IT?**
Establishing **who someone is**.

**WHY DO WE NEED IT?**
`CAP-01` — staff sign in to a private back-office the public cannot reach.

**HOW DOES IT WORK?**

```
email + password -> rate-limit check -> verify against stored hash
  -> create a session -> set a cookie
  -> every later request: cookie -> session -> user
```

**One subtlety worth internalising (`P2-11`):** when sign-in fails, show **one
generic message** regardless of cause. "No such account" versus "wrong password"
tells an attacker which email addresses belong to your staff — a list worth having
if your goal is to publish on someone's masthead.

**DO WE NEED IT IN V1?** Yes.

---

## 12. Authorization

**WHAT IS IT?**
Establishing **what someone is allowed to do**. Different from authentication, and
the difference matters.

> **Authentication:** *who are you?* — **Authorization:** *may you do this?*

**WHY DO WE NEED IT?**
It is the entire product. `BR-05`: an editor may never publish, through any route.

**HOW DOES IT WORK?**
Three checks, all of which must pass:

```
1. CAPABILITY  May a user of this kind publish at all?    -> no, if editor
2. OWNERSHIP   Is this their article?                     -> for editing
3. STATE       Is this move legal from where it is?       -> 11 section 4
```

Most authorisation bugs come from checking one and forgetting the others. An
editor who owns an article still cannot publish it. An admin can publish, but not
an article still in draft.

**Write capability checks, not role checks.** `03` §4.5 is explicit: ask *may this
user publish?*, never *is this an admin?*. Same behaviour today; the difference is
that adding a "Senior Editor" role later becomes a configuration change instead of
a hunt through the codebase.

**DO WE NEED IT IN V1?** Yes. This is the product's integrity.

---

## 13. Sessions

**WHAT IS IT?**
A record on the **server** that someone is signed in. The browser holds only an ID
pointing at it.

**WHY DO WE NEED IT?**
`SEC-05` requires that sessions end when an account is deactivated, and that
sign-out works everywhere. Both need something the server controls.

**HOW DOES IT WORK?**
On sign-in, insert a row: `{ id, userId, createdAt, expiresAt }`. The cookie holds
the ID. Each request looks it up. Sign-out, deactivation, or a role change deletes
the row — and access ends on the very next request.

**DO WE NEED IT IN V1?** Yes.

---

## 14. Cookies

**WHAT IS IT?**
A small value the server asks the browser to store and send back with each
request.

**WHY DO WE NEED IT?**
It is how the session ID travels without the user signing in on every page.

**HOW DOES IT WORK?**
The flags matter more than the mechanism:

| Flag | Effect | Why here |
|---|---|---|
| `httpOnly` | JavaScript cannot read it | If an XSS bug ever appears, it cannot steal sessions |
| `Secure` | HTTPS only | `SEC-08` |
| `SameSite=Lax` | Not sent from other sites' requests | Most of your CSRF protection |
| Expiry | Session ends | `SEC-05` |

**`httpOnly` is the one to remember.** Storing a token in `localStorage` — a
common tutorial pattern — means any script on the page can read it. For a system
where a stolen admin session means publishing on your masthead, that is not an
acceptable trade.

**DO WE NEED IT IN V1?** Yes.

---

## 15. JWT (JSON Web Token)

**WHAT IS IT?**
A signed token containing user information. The server can verify it without
looking anything up — that is the whole point, and here it is the problem.

**WHY IS IT RELEVANT?**
Because it is the default answer in most tutorials, and **we are deliberately not
using it.** You should know why, so you do not "fix" this later.

**HOW DOES IT WORK, AND WHY WE SAY NO?**
A JWT is valid until it expires because nothing is consulted. So:

> An admin account is compromised. You deactivate it. **With a JWT, they keep
> publishing until the token expires.**

You can fix this with a revocation list checked on every request — at which point
you have built a session store, with more moving parts and worse guarantees.
`SEC-05` demands revocation, so sessions are simply the right tool.

JWTs are excellent for stateless service-to-service calls. That is not this
problem.

**DO WE NEED IT IN V1?** **No.** Sessions instead — `23` §11.2.

---

## 16. Hashing

**WHAT IS IT?**
A one-way transformation. You can turn a password into a hash; you cannot turn the
hash back into the password.

**WHY DO WE NEED IT?**
`SEC-04` — passwords must never be recoverable. If your database is ever exposed,
the attacker must not walk away with usable passwords, because people reuse them.

**HOW DOES IT WORK?**
Store `hash(password + salt)`. To verify, hash what they typed and compare.

Use **Argon2id** (or bcrypt at a suitable cost). These are deliberately *slow* and
memory-hard — which is the feature. A fast hash like SHA-256 lets an attacker try
billions of guesses per second; Argon2id makes that economically painful.

**Never** invent your own scheme, and never log a password — even in a debug line
you intend to remove.

**DO WE NEED IT IN V1?** Yes.

---

## 17. SSR (Server-Side Rendering)

**WHAT IS IT?**
Building the HTML on the server so the browser receives a finished page.

**WHY DO WE NEED IT?**
`SEO-01` requires article content to be *present in the HTML the server sends, not
assembled later in the browser*. This is the single most consequential technical
requirement in the product: for a news site, search and social are where readers
come from, and a crawler must see the story in the page.

**HOW DOES IT WORK?**
Next.js runs your React components on the server, produces HTML, sends it. The
reader sees the headline immediately — no loading spinner, no layout jump. That
also satisfies `18` §1 trait 4 (*Immediate*) and helps `PRF-08` (layout
stability).

**DO WE NEED IT IN V1?** Yes, for every public page.

---

## 18. CSR (Client-Side Rendering)

**WHAT IS IT?**
The browser downloads JavaScript and builds the page itself.

**WHY IS IT RELEVANT?**
It is wrong for the public site and right for parts of the CMS.

**HOW DOES IT WORK?**
The article editor (`PG-EDT-07`) needs autosave, dirty-state tracking, live
validation and an unsaved-changes warning. That is genuine interactivity and
belongs in the browser. Nobody needs to search-engine-index the article editor.

**The split for this project:**

| Surface | Rendering | Why |
|---|---|---|
| Public pages | Server, cached | `SEO-01`, `PRF-02` |
| CMS lists and dashboards | Server, per request | Always fresh, per-user |
| **Article editor** | **Client** | Genuinely interactive |

**DO WE NEED IT IN V1?** Yes, but only where interactivity earns it.

---

## 19. Caching

**WHAT IS IT?**
Keeping a copy of a result so you do not have to compute it again.

**WHY DO WE NEED IT?**
`02` §P: *the public site is overwhelmingly reads of content that changes rarely —
that is the easiest performance profile there is.* A published article is
identical for every reader. Building it ten thousand times is pure waste.

**HOW DOES IT WORK?**
Build the page once, keep the result, serve it to everyone. When the article
changes, throw the copy away and rebuild.

**The rules for this project:**

| Cache | Never cache |
|---|---|
| Homepage, article and section pages | **Anything under `/staff`** |
| Sitemap, RSS, images | **Preview pages** |

A cached CMS page is a data leak — it could serve one editor's dashboard to
another. A cached preview page could put an unpublished story in a shared cache.
Both violate `SEC-03`.

**Invalidation** happens on publish, correction-approval and withdrawal: the
article page, homepage, section page, sitemap and feed are all refreshed
(`PRF-03`).

**DO WE NEED IT IN V1?** Yes — it is the cheapest reliability and performance win
available.

---

## 20. CDN (Content Delivery Network)

**WHAT IS IT?**
A network of servers around the world that keep copies of your pages close to
readers.

**WHY DO WE NEED IT?**
`SCL-02` — *traffic spikes on a single story must not take the site down.* This is
the most likely stressful moment your system will face, and the CDN is the main
defence.

**HOW DOES IT WORK?**
A reader's request reaches the nearest CDN location. If it has the page, it
returns it — your application is never contacted. Ten thousand readers of one
story become roughly one request to your system.

It also makes the site faster for everyone, because the page travels a shorter
distance.

**DO WE NEED IT IN V1?** Yes. Not an optimisation — it is how `SCL-02` is met.

---

## 21. Redis

**WHAT IS IT?**
An in-memory data store, very fast, commonly used for caching, sessions, rate
limiting and job queues.

**WHY IS IT RELEVANT?**
Because it appears in almost every "production architecture" article, and **we are
deliberately not using it in V1.**

**HOW DOES IT WORK, AND WHY NOT YET?**
Redis holds data in memory, so lookups are extremely fast. But at one API
instance:

- **Sessions** work fine in PostgreSQL at this scale.
- **Page caching** is already handled by the CDN and Next.js.
- **Rate limiting** only needs to be shared once you run more than one instance.
- **Queues** need a queue first — and V1 has no background jobs (§25).

Adding it now means another service to run, secure, monitor and back up, for no
measured benefit — exactly what `01` §5.6 warns against.

**When it becomes justified** (`23` §16.5): more than one API instance needing
shared rate limiting; session lookups measurably becoming a bottleneck; or a job
queue that requires it.

**DO WE NEED IT IN V1?** **No.** Know the trigger, not the fear of missing out.

---

## 22. Object storage

**WHAT IS IT?**
A service for storing files — images, in our case — addressed by a key rather than
a filesystem path. S3 and compatible services.

**WHY DO WE NEED IT?**
`SCL-06`: *media storage grows continuously and must not be bound to one machine's
disk.* Images in the database bloat backups and slow restores (`OPS-01`); images
on the server's disk vanish when you redeploy or add a second instance.

**HOW DOES IT WORK?**
Upload the file, get a key, store the key in the database with the alt text and
credit. Serve through a CDN.

**The security parts (`SEC-10`) are the ones to get right:**

1. Validate the type by **file content** (magic bytes), never the extension. A
   file named `photo.jpg` can contain anything.
2. **Re-encode** the image. This strips embedded payloads and EXIF data.
3. Use a **generated key**, never the user's filename — prevents path traversal
   and overwriting.
4. Serve from a **separate domain**, so an uploaded file can never execute in your
   application's origin.
5. Enforce a size cap.

**DO WE NEED IT IN V1?** Yes.

---

## 23. Queues and workers

**WHAT IS IT?**
A **queue** is a list of jobs waiting to be done. A **worker** is a separate
process that picks them up and does them, outside the request.

**WHY IS IT RELEVANT?**
Because V1 does not need either, and knowing why prevents adding them reflexively.

**HOW DOES IT WORK?**
Instead of making a user wait, you add a job to a queue and return immediately; a
worker processes it later.

**Why not in V1** — each candidate examined:

| Candidate | Verdict |
|---|---|
| Image processing | Fast enough inline at tens of articles a day |
| Search indexing | Happens in the same transaction as publication — no lag, no sync |
| In-app notifications | A database query, not a job |
| Email notifications | **The one that could change this** — depends on `OQ-25` |
| Scheduled publishing | **`[FUTURE]`. This is the feature that forces a scheduler** (`OQ-07`) |
| Analytics | Third-party script; no backend work |

**When you do need one:** use a queue backed by the PostgreSQL you already run
(such as pg-boss) rather than adding Redis. Same component count, and jobs stay
transactional with the data they act on.

**DO WE NEED IT IN V1?** **No.**

---

## 24. Search indexing

**WHAT IS IT?**
Preparing text so it can be searched quickly — splitting into words, reducing them
to stems (so "running" matches "run"), and building a structure mapping words to
documents.

**WHY DO WE NEED IT?**
`PUB-10`, if `OQ-19` puts search in V1. Searching by scanning every article's body
does not scale past a few thousand.

**HOW DOES IT WORK?**
PostgreSQL does this natively. You store a searchable representation of headline,
summary and body, index it, and query it — with headline matches weighted highest.

**Two project-specific points:**

1. **Index only published articles.** This makes it structurally impossible to
   leak an unpublished story through search (`BR-01`, `SEC-03`). It is a security
   decision as much as a performance one.
2. **Update it in the same transaction as publication**, so there is no
   synchronisation lag and no second system to fall behind.

**Why not Elasticsearch?** `SCL-07` and `06` §2.4 both name a dedicated search
cluster as premature. It is a cluster to run, secure, back up and keep in sync —
for a feature that may not even be in V1.

**DO WE NEED IT IN V1?** Postgres full-text search, **conditional on `OQ-19`**.

---

## 25. Rate limiting

**WHAT IS IT?**
Capping how many requests someone can make in a period.

**WHY DO WE NEED IT?**
`SEC-09` — brute-force protection on sign-in. Without it, an attacker can try
passwords as fast as your server responds. A compromised admin account can publish
on your masthead.

**HOW DOES IT WORK?**
Count attempts per key over a window; refuse past the limit. Limit **both** by IP
address and by account — IP-only is defeated by rotating addresses; account-only
lets an attacker spray one password across many accounts.

Apply to: sign-in, password reset, uploads.

**Pair it with `P2-11`:** the generic failure message. Rate limiting stops the
guessing; the generic message stops the reconnaissance.

**DO WE NEED IT IN V1?** Yes.

---

## 26. Observability

**WHAT IS IT?**
Being able to tell what your system is doing from the outside — logs, error
tracking, uptime monitoring, health checks.

**WHY DO WE NEED IT?**
`OPS-02`. Without it, as `06` puts it, *you will learn about outages from readers*.

**HOW DOES IT WORK?**

| Signal | Purpose |
|---|---|
| **Structured logs** | JSON, not free text, so they can be searched |
| **Correlation ID** | One ID per request, carried through Next.js and the API, so you can trace one reader's problem end to end |
| **Error tracking** | Alerts you when something breaks, with a stack trace |
| **Uptime monitoring** | External check that the site actually responds |
| **Health endpoints** | Let the platform know an instance is ready before sending traffic |
| **Refused authorisation attempts** | Project-specific: repeated refused publish attempts from an editor account is a signal worth alerting on (`11` §5.1) |

**Never log:** passwords, session IDs, or unpublished article bodies. The last is
easy to overlook and would put embargoed journalism into a third-party service.

**DO WE NEED IT IN V1?** Yes.

---

## 27. The audit log — and why it is not a log

**WHAT IS IT?**
A permanent record of every editorial action: who submitted, who approved, who
published, when, and what they said.

**WHY DO WE NEED IT?**
`CAP-15`, `ADM-14`, `BR-06`. For a publisher, *"who approved this and when"* is
sometimes a legal question. And `OQ-11` warns: it **cannot be reconstructed
later** — if it is not recorded from day one, the first months of publishing have
no history at all.

**HOW DOES IT WORK, AND WHY IT DIFFERS FROM §26?**

| | Technical log | **Audit log** |
|---|---|---|
| Example | `POST /articles/123/publish -> 500` | `Ravi Menon published article 123 at 14:12` |
| Lives in | Logging service | **The database** |
| Kept for | Weeks | **Indefinitely** |
| Editable | Rotates and expires | **Never, by anyone** |
| Is it a product feature? | No | **Yes** — `PG-ADM-05` |

**The part developers get wrong:** `SEC-11` says the audit trail cannot be edited
*by any role*. Enforce that **at the database level** — grant the application's
database user `INSERT` and `SELECT` on that table, and **not** `UPDATE` or
`DELETE`. Then even a bug in your code cannot rewrite history. An audit trail the
application can silently modify is not evidence.

**DO WE NEED IT IN V1?** Yes — from the very first transition.

---

## 28. Vertical scaling

**WHAT IS IT?**
Making one machine bigger — more CPU, more memory.

**WHY IS IT RELEVANT?**
It is usually the right first answer, and it is unfashionable to say so.

**HOW DOES IT WORK?**
Change the instance size. No code changes, no new failure modes.

**Its limit:** you eventually run out of bigger machines, and one machine is one
thing that can fail.

**DO WE NEED IT IN V1?** Yes, implicitly — start with one appropriately sized
instance of each thing and grow it before adding complexity.

---

## 29. Horizontal scaling

**WHAT IS IT?**
Running more copies of the same program instead of one bigger copy.

**WHY IS IT RELEVANT?**
`SCL-05` — *serve more readers by adding capacity, not by rewriting.*

**HOW DOES IT WORK?**
Run several API instances behind a load balancer. This requires your application
to be **stateless** — no user data held in a variable in memory, because the next
request may hit a different instance.

**This is why sessions live in the database rather than in memory.** It costs
nothing now and means adding a second instance is a configuration change, not a
rewrite. Note also that this is the point at which Redis becomes justified, for
shared rate limiting (§21).

**DO WE NEED IT IN V1?** No — one instance is enough. But **build statelessly from
day one**, because retrofitting it is painful.

---

## 30. Load balancing

**WHAT IS IT?**
A component distributing incoming requests across several instances.

**WHY IS IT RELEVANT?**
It is what makes horizontal scaling work, and it also removes a single point of
failure.

**HOW DOES IT WORK?**
Requests arrive at the load balancer, which forwards each to a healthy instance.
It uses the **health checks** from §26 to know which instances are healthy, and
stops sending traffic to one that is failing — which is also what makes
zero-downtime deploys possible (`OPS-03`).

**DO WE NEED IT IN V1?** Not explicitly — a managed platform provides this when
you scale past one instance.

---

## 31. Quick reference

| Concept | V1? | Note |
|---|---|---|
| REST API | **Yes** | Transitions as named actions, not a state field |
| API layers | **Yes** | Controller / Guard / Service / Repository |
| Controllers | **Yes** | HTTP only, no business rules |
| Services | **Yes** | Where the state machine lives |
| Repositories | **Yes** | The `PUBLISHED` filter lives here, once |
| ORM (Prisma) | **Yes** | Readable schema, safe migrations |
| Relational DB (Postgres) | **Yes** | Relational data, transactions, FTS |
| Transactions | **Yes** | State + record + audit commit together |
| Migrations | **Yes** | Additive changes for zero-downtime deploys |
| Database indexes | **Yes** | Add with the schema, not after complaints |
| Authentication | **Yes** | Generic failure message |
| Authorization | **Yes** | Capability + ownership + state |
| Sessions | **Yes** | Revocable — required by `SEC-05` |
| Cookies | **Yes** | `httpOnly`, `Secure`, `SameSite` |
| **JWT** | **No** | Cannot be revoked; sessions instead |
| Hashing | **Yes** | Argon2id |
| SSR | **Yes** | Required by `SEO-01` |
| CSR | **Yes, selectively** | The article editor only |
| Caching | **Yes** | Never `/staff`, never previews |
| CDN | **Yes** | How `SCL-02` is actually met |
| **Redis** | **No** | Know the trigger (§21) |
| Object storage | **Yes** | Validate by content, re-encode, separate domain |
| **Queues / workers** | **No** | Scheduling is what will force this |
| Search indexing | **Conditional** | Postgres FTS, published only, `OQ-19` |
| Rate limiting | **Yes** | By IP **and** by account |
| Observability | **Yes** | Never log unpublished bodies |
| Audit log | **Yes** | Enforce immutability with DB privileges |
| Vertical scaling | **Yes** | The right first answer |
| Horizontal scaling | **Not yet** | But build statelessly now |
| Load balancing | **Not yet** | Comes with the platform |

---

## 32. If you learn only three things

1. **The `PUBLISHED` filter belongs in one place.** Every read path that could
   return an article must go through code that cannot return an unpublished one.
   This is `BR-01`, and it is the failure that would matter most.

2. **State changes are transactions, not updates.** The new state, the record of
   who did it, and the audit entry are one indivisible act. If they can come
   apart, the record is unreliable exactly when someone is asking who published a
   disputed story.

3. **The interface is not the security.** Hiding the publish button from editors
   is good design. The reason editors cannot publish is that the API refuses —
   every time, for every route, including requests that never touched your
   website. That is `SEC-02`, and it is the difference between a product that
   looks safe and one that is.
