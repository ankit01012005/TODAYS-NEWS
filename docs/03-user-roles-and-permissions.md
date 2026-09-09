# 03 — User Roles and Permissions

**Stage:** Product discovery (pre-development)
**Last updated:** 2026-09-08

**[CONFIRMED]** Three primary roles exist: **ADMIN**, **EDITOR**, **READER**.
**[CONFIRMED]** Their permissions are *not* final. What follows is a proposal.

---

## 1. The roles at a glance

| Role | Logs in? | One-line description |
|---|---|---|
| **Reader** | No (V1) | Any member of the public visiting the news site |
| **Editor** | Yes | Newsroom staff who write and submit articles; cannot publish |
| **Admin** | Yes | Newsroom leadership who review, publish, and run the platform |

**[PROPOSED]** "Reader" is best understood as *the absence of a staff account*
rather than as an account type. In V1, a reader is an anonymous visitor. Treating
it as a real role in the permission system now would add a login system,
accounts, and privacy obligations that nothing in V1 requires.
**[OPEN]** — if readers ever need accounts (comments, saved articles,
newsletters, personalisation), this changes. See OQ-01.

---

## 2. Role responsibilities

### 2.1 Reader — [CONFIRMED]

**Responsible for:** nothing. Readers consume; they contribute nothing to the
system.

**Can do:**
- Browse the homepage and listing pages
- Read any published article
- Share links

**Cannot do:**
- See drafts, submitted articles, rejected articles, or anything unpublished
- See or reach the back-office in any way
- Create or modify anything

### 2.2 Editor — [CONFIRMED]

**Responsible for:** producing accurate, complete, publishable articles and
responding to editorial feedback.

**Can do:**
- Sign in to the editor back-office
- Create articles
- Save drafts, repeatedly
- Submit an article for review
- Read admin feedback
- Revise and resubmit
- Reference sources on their articles

**Cannot do — [CONFIRMED]:**
- Publish anything, by any route
- Approve or reject any article, including their own
- Manage users or roles
- Change platform configuration

**[OPEN]** Whether an editor can see or edit *other editors'* articles is
undecided — OQ-05. The rest of this document assumes the narrow answer
("own articles only") because widening a permission later is easy and safe,
while narrowing one after people have relied on it is disruptive.

### 2.3 Admin — [CONFIRMED]

**Responsible for:** everything that reaches the public. This is an accountability
role, not just a technical one.

**Can do:**
- Everything an editor can do
- See every article in every state
- Approve and publish
- Request changes with written feedback
- Reject with a reason
- Manage staff accounts and roles
- Manage categories and sources
- **[PROPOSED]** Unpublish and archive
- **[PROPOSED]** View article history and the audit trail

**Cannot do — [PROPOSED]:**
- Edit or delete the audit trail (SEC-11). A record that can be rewritten is not
  a record.
- **[CONFIRMED — resolved 2026-09-09]** Approve or publish an article they wrote
  or last revised. A second admin must review it. See section 6 below and `BR-13`.

---

## 3. Proposed permission matrix

**[PROPOSED]** ✅ = allowed, ❌ = not allowed, ⚠️ = allowed but subject to an open
question.

### 3.1 Articles

| Action | Reader | Editor | Admin |
|---|---|---|---|
| View published articles | ✅ | ✅ | ✅ |
| View any unpublished article | ❌ | ⚠️ own only (OQ-05) | ✅ |
| Create an article | ❌ | ✅ | ✅ |
| Edit own draft | ❌ | ✅ | ✅ |
| Edit another user's draft | ❌ | ❌ (OQ-05) | ⚠️ (OQ-02) |
| Edit own article while under review | ❌ | ⚠️ (OQ-03) | ✅ |
| Withdraw own submission before review | ❌ | ⚠️ (OQ-04) | ✅ |
| Submit for review | ❌ | ✅ | ✅ |
| Approve | ❌ | ❌ | ✅ |
| **Publish** | ❌ | ❌ | ✅ |
| Request changes | ❌ | ❌ | ✅ |
| Reject | ❌ | ❌ | ✅ |
| Edit a published article | ❌ | ⚠️ (OQ-08) | ⚠️ (OQ-08) |
| Unpublish | ❌ | ❌ | ⚠️ (OQ-16) |
| Schedule publication | ❌ | ❌ | ⚠️ (OQ-07) |
| Archive | ❌ | ❌ | ⚠️ (OQ-13) |
| Delete permanently | ❌ | ❌ | ⚠️ (OQ-12) |
| View an article's history | ❌ | ⚠️ own only | ✅ |

### 3.2 Sources

| Action | Reader | Editor | Admin |
|---|---|---|---|
| See sources on a published article | ⚠️ (OQ-24) | ✅ | ✅ |
| Browse the source list in the back-office | ❌ | ✅ | ✅ |
| Create a source | ❌ | ⚠️ (OQ-14) | ✅ |
| Edit / delete a source | ❌ | ❌ | ✅ |
| Attach a source to own article | ❌ | ✅ | ✅ |
| Set a source's verification status | ❌ | ❌ | ⚠️ (OQ-14) |

### 3.3 Users and configuration

| Action | Reader | Editor | Admin |
|---|---|---|---|
| Sign in to the back-office | ❌ | ✅ | ✅ |
| Edit own profile / password | ❌ | ✅ | ✅ |
| Create a staff account | ❌ | ❌ | ✅ |
| Change someone's role | ❌ | ❌ | ✅ |
| Deactivate an account | ❌ | ❌ | ✅ |
| Manage categories | ❌ | ❌ | ✅ |
| Curate the homepage | ❌ | ❌ | ⚠️ (OQ-17) |
| View the audit trail | ❌ | ❌ | ✅ |
| Modify the audit trail | ❌ | ❌ | ❌ |

---

## 4. Principles behind this model

**[PROPOSED]**

1. **Least privilege.** Each role gets the minimum needed to do its job. Start
   narrow; widen later based on real complaints from real users.

2. **One hard boundary.** The single most important line in this product is
   *editors cannot publish*. Every other permission is a convenience question;
   this one is the product's integrity.

3. **Enforce at the source of truth.** Permission checks live on the server, next
   to the data, and run on every request. A user who guesses a web address, or
   sends a request without using the interface at all, hits the same check.

4. **Interface reflects permissions, it does not define them.** Not showing a
   "Publish" button to editors is good design; it is not the reason editors
   cannot publish.

5. **Write checks against capabilities, not role names.** Ask "may this user
   publish?", not "is this user an admin?". Same behaviour in V1, but adding a
   fourth role later becomes a configuration change instead of a hunt through the
   whole codebase. This is cheap now and expensive to retrofit.

6. **Roles are assigned by admins only.** No self-service escalation, ever.

7. **Deactivation over deletion.** Removing an account must not orphan or erase
   the articles that person wrote, or the record of decisions they made.

---

## 5. Assumptions in this model

- **[ASSUMPTION]** One role per user. A person is either an editor or an admin,
  not both. Simpler to reason about and to display. If someone needs both, they
  get the higher role.
- **[ASSUMPTION]** Roles are global, not per-section. There is no "Sports editor
  who can only touch Sports". If the newsroom is organised by desk with real
  boundaries, say so now — it changes the permission model substantially.
- **[ASSUMPTION]** Staff accounts are created by admins. No public sign-up page
  exists. See OQ-27.
- **[ASSUMPTION]** There is no separate "super admin" or platform-owner role in
  V1. All admins are equal. See OQ-10.

---

## 6. Two role questions that deserve special attention

### 6.1 Can an admin approve their own article? — **[CONFIRMED — NO]**, resolved 2026-09-09

**Decision: an admin may not approve or publish an article they wrote or last
revised.** A second admin must review it. `BR-13` now states this, and `OQ-29` is
closed.

Admins can also write. If an admin writes an article and then approves it, the
review step disappears for exactly the people with the most power to cause harm.

- **Preventing it** gives real separation of duties, but breaks the newsroom
  whenever only one admin is available — which, in a small team at 11pm, is
  most of the time.
- **Allowing it** keeps the newsroom working, and relies on the audit trail
  ("published by X, written by X") rather than prevention.

**Why prevention was chosen over recording.** Phase 1 originally proposed allowing
it. That was reversed deliberately: `01` §5.1 states that *publication is a
privileged act* and `01` §5.5 that *correctness beats cleverness in news*. An
audit trail records what happened; it does not stop it. For the one action in this
product with immediate, irreversible public consequence, prevention is worth more
than a good record of the failure.

**The cost is real and is accepted.** A lone admin cannot publish their own
writing. Two consequences follow, and both are deliberate:

1. **The newsroom needs at least two admins to function** for admin-written
   stories. This raises the practical minimum staffing, and `OQ-36` (how many
   admins in practice) should be answered with that in mind.
2. **An admin-written story can be blocked at 11pm** when no second admin is
   reachable. The workaround is editorial, not technical: an admin who needs
   something published tonight either reaches a colleague or writes it under an
   editor account and has it reviewed normally.

**What must not happen as a workaround:** a shared admin login. That would destroy
`BR-06` (every publish records which admin performed it) far more thoroughly than
self-approval ever would. If the two-admin rule proves unworkable in practice,
**reopen this decision rather than working around it.**

### 6.2 Do we need more than one editor level? — [OPEN], OQ-10

Real newsrooms often have junior reporters, senior reporters, sub-editors and a
chief editor. Our model has one flat "Editor".

**[PROPOSED]** Keep three roles in V1. Two roles handle the confirmed workflow
completely, and every extra role multiplies the permission matrix, the test
matrix and the number of ways things can go wrong. Because permissions will be
written as capabilities (principle 5), adding a "Senior Editor" later is a
contained change rather than a rewrite.

---

## 7. Future role candidates — [PROPOSED], not V1

| Role | Why it might be needed later |
|---|---|
| Senior Editor / Sub-editor | Can review others' work but still cannot publish |
| Contributor / Freelancer | Can draft and submit but sees nothing else |
| Publisher | Can publish but not manage users — splits editorial from administration |
| Photo / Media editor | Manages images and rights |
| Analyst | Read-only access to analytics, no content access |
| Reader account | Needed if comments, newsletters or personalisation arrive |
