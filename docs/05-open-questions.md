# 05 — Open Questions

**Stage:** Product discovery (pre-development)
**Last updated:** 2026-09-08

These are decisions I have **not** made for you. Each one changes what gets built.
Answering them is the main thing standing between discovery and design.

Each question has:

- **Why it matters** — the real consequence of getting it wrong
- **Options** — the realistic choices
- **Recommendation** — what I would do, and why (still needs your approval)
- **Urgency** — when the answer is needed

**Urgency levels**

| Level | Meaning |
|---|---|
| 🔴 **Blocking** | Needed before the data model and architecture can be designed. Answering these late means rework, not adjustment. |
| 🟠 **Pre-build** | Needed before that specific feature is built, not before design starts. |
| 🟡 **Pre-launch** | Needed before going live, but does not affect the shape of the system. |

---

## Priority summary

**✅ Answered 2026-09-09 (Phase 4B-0 — see `26-data-model-decisions.md`):**
OQ-08, OQ-22, OQ-26, OQ-29

**🔴 Answer these first — they change the foundations:**
OQ-02, OQ-03, OQ-05, OQ-06, OQ-11, OQ-12, OQ-18, OQ-20, OQ-23, OQ-24, OQ-31

**🟠 Answer before the relevant feature is built:**
OQ-01, OQ-04, OQ-07, OQ-09, OQ-10, OQ-13, OQ-14, OQ-15, OQ-16, OQ-17, OQ-19,
OQ-21, OQ-25, OQ-27, OQ-28, OQ-35, OQ-36

**🟡 Answer before launch:**
OQ-30, OQ-32, OQ-33, OQ-34, OQ-37, OQ-38, OQ-39, OQ-40, OQ-41, OQ-42

---

# A. Editorial permissions and collaboration

### OQ-01 — Do readers need accounts? 🟠
**Why it matters:** Reader accounts add login, password resets, personal data,
privacy obligations, and an entire class of security surface. Building them
"just in case" is one of the most expensive unnecessary decisions available.
**Options:** (a) Anonymous readers only in V1. (b) Reader accounts from day one.
**Recommendation:** (a). Nothing in the confirmed V1 scope needs a reader
identity. Add accounts when a feature actually requires one (comments, saved
articles, newsletters, personalisation).

### OQ-02 — Can admins edit articles written by editors? 🔴
**Why it matters:** This is normal newsroom practice — sub-editing is the job.
But if an admin edits and publishes in one motion, the "review" step is really
"rewrite", and the byline may no longer reflect the text. It also determines
whether the editor is told their words changed.
**Options:** (a) Admins can edit freely. (b) Admins can only comment and send
back. (c) Admins can edit, but the change is recorded and the editor is notified.
**Recommendation:** (c). Matches how newsrooms actually work while keeping
authorship honest.

### OQ-03 — Can an editor edit an article after submitting it? 🔴
**Why it matters:** If text can change while an admin is reading it, the admin
may approve something different from what they read. That is a correctness
problem, not a UX preference.
**Options:** (a) Locked while `IN_REVIEW`. (b) Editable, and any edit
automatically returns it to `DRAFT`. (c) Freely editable.
**Recommendation:** (a), paired with OQ-04 (withdraw). Predictable, and the
admin's review always refers to a fixed text.

### OQ-04 — Can an editor withdraw a submission before it is reviewed? 🟠
**Why it matters:** Without this, an editor who spots their own mistake must ask
an admin to reject their article — wasting the admin's time and cluttering the
record with false rejections.
**Options:** (a) Yes, while still `IN_REVIEW`. (b) No.
**Recommendation:** (a). Small feature, removes a recurring annoyance.

### OQ-05 — Can multiple editors collaborate on one article? 🔴
**Why it matters:** This is the difference between "an article belongs to one
person" and "an article has a team". It affects permissions, the data model, and
whether we need to handle two people editing at once. Retrofitting shared
ownership later is a significant change.
**Options:** (a) Single owner; only they and admins can edit. (b) Any editor can
edit any article. (c) Named collaborators per article.
**Recommendation:** (a) for V1, with the data shaped so (c) can be added without
a rebuild. Real-time co-editing is a large project of its own and is not implied
by anything in the brief.

### OQ-06 — Can an article have multiple authors? 🔴
**Why it matters:** "By A and B" is common in news. It also affects author pages,
bylines, structured data for search engines, and the data model. Cheap to allow
now, awkward to add later — every place that shows "the author" has to change.
**Options:** (a) Exactly one author. (b) One primary author plus contributors.
(c) Several equal authors.
**Recommendation:** Model it as a list from the start (which supports all three),
but keep V1's interface to a single author unless you say otherwise.

### OQ-10 — Do we need more role levels — senior editors, admin tiers? 🟠
**Why it matters:** Each extra role multiplies permission combinations, screens
to test, and ways to get it wrong. But too few roles forces people to share
accounts, which destroys accountability.
**Options:** (a) Three roles, flat. (b) Add Senior Editor (can review, cannot
publish). (c) Add a super-admin above admins.
**Recommendation:** (a) for V1. Write permission checks against capabilities, not
role names, so adding a role later is contained (see `03` §4.5).

### OQ-29 — Can an admin approve and publish their own article? ✅ **ANSWERED 2026-09-09**
**ANSWER: (b) Forbidden.** An admin may not approve or publish an article they
wrote or last revised; a second admin must review it. `BR-13` now states this as
**[CONFIRMED]** and the `BR-13`/OQ-29 contradiction (`P2-01`) is closed.
**Rationale and accepted costs:** `03` §6.1. **Model impact:** `26` §2.
**Consequence to note:** the newsroom now needs at least two admins to publish
admin-written stories — answer `OQ-36` with that in mind.

### OQ-36 — How many admins will there be in practice? 🟠
**Why it matters:** The answer to OQ-29 depends on it, and so does what happens
when the only admin is unavailable, ill, or leaves. A one-admin newsroom has a
single point of failure that no software can fix.
**Recommendation:** At least two active admins from day one.

---

# B. Article lifecycle

### OQ-07 — Can admins schedule publication? 🟠
**Why it matters:** Embargoed stories and morning-slot publishing are routine in
news. It also introduces the platform's first background process — something that
acts with nobody logged in — which is a genuine architectural addition.
**Options:** (a) No scheduling in V1. (b) Scheduling in V1. (c) Not in V1, but
keep the `APPROVED` state so it can be added cleanly.
**Recommendation:** (c). Real need, but it can wait, and (c) costs almost nothing
now while making the later addition simple.

### OQ-08 — Can published articles be edited, and does that need re-approval? ✅ **ANSWERED 2026-09-09**
**ANSWER: (c)** — the live version stays published and untouched while a correction
is drafted and reviewed as a new revision; on approval it replaces the live one.
See `26-data-model-decisions.md` §1. *(Original analysis retained below.)*

**Why it matters:** The single most important workflow question after "who can
publish". If published articles can be edited without review, the approval rule
has a hole in it. If they cannot be edited quickly, factual errors stay live.
See `04-article-lifecycle.md` §6 for the full analysis.
**Options:** (a) Edit live, instantly public. (b) Every edit re-enters review and
the article goes offline meanwhile. (c) Live version stays up; edits become a new
revision that goes through review and replaces it on approval.
**Recommendation:** (c), possibly with an admin-only fast path for typo-level
fixes, recorded in the audit trail.

### OQ-09 — Should material corrections be visible to readers? 🟠
**Why it matters:** Credibility. Silently changing a published story is, in
journalism, a serious matter. It also affects trust signals for search engines.
**Options:** (a) No visible notice. (b) "Updated on <date>" timestamp. (c) An
explicit correction note describing what changed.
**Recommendation:** (b) for all material edits and (c) for factual corrections.
Requires deciding who judges "material" — probably the publishing admin.

### OQ-12 — Can articles ever be permanently deleted? 🔴
**Why it matters:** Permanent deletion conflicts with audit trails and with any
legal obligation to retain records; but there are real cases (defamatory content,
legal takedown, personal data) where deletion is required, not optional. This
decision reaches into every part of the data model.
**Options:** (a) Never — only hide/archive. (b) Admins can permanently delete.
(c) Soft delete by default, with a rare, deliberate, recorded hard delete.
**Recommendation:** (c). Retain by default; make true deletion possible,
deliberate, and logged.

### OQ-13 — Should articles be archived, and what does archived mean? 🟠
**Why it matters:** "Archived" can mean three different things — removed from the
public site, hidden from the working list, or kept public but excluded from
listings. Each behaves differently for readers and search engines.
**Options:** (a) No archive concept. (b) Archive = hidden from staff lists only.
(c) Archive = removed from public view and retained.
**Recommendation:** (c), used as the destination for unpublished and abandoned
articles.

### OQ-15 — What does "rejected" actually mean? 🟠
**Why it matters:** If rejection is terminal, killed stories can never be revived
when facts change — and stories genuinely do come back. If it is not terminal, it
is barely different from "changes requested", and editors will be confused about
which one they are looking at.
**Options:** (a) Terminal; article is dead and archived. (b) Reopenable by an
admin. (c) Reopenable by the editor as a new draft.
**Recommendation:** (b), with a mandatory reason. Keep the distinction sharp in
the interface: *changes requested* = "fix this"; *rejected* = "we are not running
this".

### OQ-16 — Can a published article be unpublished, and what do readers see? 🟠
**Why it matters:** Legal demands and serious errors make this necessary. But the
article's address is already indexed by search engines and shared on social media
— what happens to those links determines whether the site looks broken.
**Options:** (a) Cannot unpublish. (b) Unpublish → address returns "not found".
(c) Unpublish → a short page explaining the story was withdrawn.
**Recommendation:** (b) as the default, with (c) available for high-profile
retractions. Either way it must be removed from the sitemap and listings.

### OQ-11 — Do we need a full audit trail? 🔴
**Why it matters:** For a publisher, "who approved this and when" is sometimes a
legal question. Audit data cannot be reconstructed after the fact — if it is not
recorded from day one, the first months of publishing simply have no history.
**Options:** (a) None. (b) Article state changes only. (c) All state changes plus
user management, source changes, and configuration changes.
**Recommendation:** (b) as a minimum for V1, designed so (c) is an extension.
Append-only, editable by nobody.

### OQ-26 — Should every revision of an article be preserved? ✅ **ANSWERED 2026-09-09**
**ANSWER: (b), retained permanently** — an immutable snapshot is written at every
workflow transition, and no snapshot is ever deleted or overwritten. Autosave
writes to the open revision's working copy and creates no snapshot.
See `26-data-model-decisions.md` §1. *(Original analysis retained below.)*

**Why it matters:** Versioning underpins "what changed since last review", the
correction model in OQ-08, and any recovery from a bad edit. It has a real
storage and complexity cost, and it is one of the hardest things to add later,
because the history you did not keep is gone forever.
**Options:** (a) No history; current text only. (b) A snapshot at each workflow
transition (submitted, approved, published). (c) Full version history of every
save.
**Recommendation:** (b) for V1 — the cheapest option that still supports review
comparison and the published-edit model, without storing every keystroke.
Autosave (EDT-06) is a separate matter and can overwrite freely.

### OQ-25 — How does workflow feedback and notification work? 🟠
**Why it matters:** You confirmed "request changes", but not what the editor
actually receives. Workflow only functions if the next person knows it is their
turn — otherwise editors refresh pages and admins forget submissions exist. It
also decides whether editorial feedback lives inside the product or leaks into
chat and email, where it cannot be traced against the article.
**Options for feedback:** (a) A single note per review round. (b) An ongoing
comment thread on the article. (c) Comments anchored to specific parts of the
text.
**Options for delivery:** in-app indicators only / in-app plus email / email only.
**Recommendation:** (a) plus in-app indicators for V1, with the history of past
rounds visible on the article. Threads (b) and email are strong Phase 2
candidates; inline comments (c) are a much larger piece of work.

### OQ-35 — What happens if two editors submit the same story? 🟠
**Why it matters:** Duplicate coverage is a newsroom-coordination problem, but
software can either help or make it worse.
**Recommendation:** Treat as a human problem in V1. A shared view of what is in
progress (ADM-07) is enough.

---

# C. Content model

### OQ-18 — Do we need categories/sections, and how do they work? 🔴
**Why it matters:** Categories drive site navigation, addresses, listing pages
and the whole information architecture. Adding them after launch means changing
every article's address, which is exactly the kind of change search engines
punish.
**Options:** (a) No categories in V1. (b) A fixed list managed by admins.
(c) Free-form tags. (d) Both categories and tags.
**Recommendation:** (b). One category per article, managed by admins. Tags later.
Also needs an answer for: what happens to articles when a category is deleted?

### OQ-14 — How are sources governed? 🟠
**Why it matters:** You confirmed sources are managed manually by "authorised
newsroom users" — but not who counts as authorised. If any editor can add
sources, the list becomes messy and duplicated within weeks. If only admins can,
editors are blocked mid-story waiting for someone to add an entry. Verification
status is a further question: marking a source as "verified" is an editorial
judgement with real credibility weight, and it should not be self-assigned by
whoever happens to be writing.
**Sub-questions:** Who may create a source? Who may mark one verified? What
happens to already-published citations if a source is later deleted or
downgraded?
**Recommendation:** Editors may create sources; only admins may verify, edit or
delete them. Sources cited by published articles are never hard-deleted — the
citation must keep making sense years later.

### OQ-17 — Who decides what appears on the homepage? 🟠
**Why it matters:** In a real publication the front page is an editorial product,
not a sorted list. "Newest first" works on day one and stops working the moment
two stories are published within a minute of each other and the more important
one drops out of sight. This affects the data model (an article needs a notion of
prominence) and the admin interface.
**Options:** (a) Purely reverse-chronological. (b) Admins can pin or feature a
limited number of stories. (c) Full manual layout control over the front page.
**Recommendation:** (a) for V1, with (b) as the first Phase 2 addition. (c) is a
large piece of work and rarely worth it early.

### OQ-19 — Does the public site need search in V1? 🟠
**Why it matters:** Readers expect it, but search quality expectations escalate
quickly, and this is the most common route to prematurely adopting heavy
infrastructure — exactly what the brief warns against.
**Options:** (a) No search in V1. (b) Simple headline/summary keyword search.
(c) Full search over article bodies.
**Recommendation:** (b) if it is cheap with whatever storage we choose;
otherwise (a). Advanced and semantic search are explicitly future work.

### OQ-20 — What do article addresses look like, and can they change? 🔴
**Why it matters:** Article addresses are permanent public contracts. Once shared
and indexed, changing one breaks every existing link unless redirects are handled.
The format also encodes decisions about categories and dates that are painful to
undo.
**Options:** (a) `/article-headline`. (b) `/category/article-headline`.
(c) `/2026/09/article-headline`. (d) An ID plus the headline.
**Recommendation:** (b), with the address fixed at publication and never changed
automatically — even if the headline is later edited. If a change is ever needed,
the old address must permanently redirect.

### OQ-21 — How are images handled? 🟠
**Why it matters:** Images are the second-largest part of a news product after
text, and they carry costs almost every plan underestimates: storage, resizing,
delivery speed, alt text, photo credit, and licensing/rights. Publishing an image
you do not have rights to is a legal risk, not a technical one.
**Options for source:** upload / external link / a media library.
**Also needs deciding:** is a featured image mandatory? Are images allowed inside
the body? Who is accountable for rights and credit?
**Recommendation:** V1 = upload, one required featured image with mandatory alt
text and a credit field; images inside the body deferred if the body format
allows it to be deferred (see OQ-22).

### OQ-22 — What format is the article body? ✅ **ANSWERED 2026-09-09**
**ANSWER: (c) structured blocks**, stored as validated JSON. Chosen over sanitised
rich text on security grounds — the renderer never emits contributor-supplied
HTML. See `26-data-model-decisions.md` §3. *(Original analysis retained below.)*

**Why it matters:** This is the most far-reaching content decision. It determines
the writing experience, whether editors can embed images/video/quotes, how the
public page is rendered, and — importantly — the security surface, since rich
content is the classic route for injecting malicious code into a public site.
**Options:** (a) Plain text/paragraphs only. (b) Limited rich text (bold, italic,
links, headings, quotes, lists). (c) Structured blocks (paragraph, image, quote,
embed). (d) Markdown.
**Recommendation:** (b) for V1 with strict sanitisation, unless embedded media
(video, social posts, galleries) is a launch requirement — in which case (c),
which is more work now but avoids a painful migration later.

### OQ-23 — Is the byline the same as the user account? 🔴
**Why it matters:** Newsrooms publish under pen names, agency credits ("Agency
report"), and guest bylines for people without accounts. If byline and account
are the same thing, none of that is possible without creating fake users.
**Options:** (a) Byline = the account's name. (b) A separate, editable display
byline. (c) Author profiles as their own concept, linked to accounts.
**Recommendation:** (c) — separating "person who logs in" from "name shown to
readers" is what makes author pages, guest authors and agency credits possible
later, and it costs little now.

### OQ-24 — How do sources attach to articles, and are they public? 🔴
**Why it matters:** You confirmed articles reference sources but not what that
means in practice. Whether sources are a shared reusable list or free text per
article is a foundational data decision. Whether they are shown to readers is an
editorial-transparency decision — and sometimes a confidentiality one, since not
every source can be named.
**Options:** (a) Free text per article. (b) A shared source list, articles link to
entries. (c) Both — link to known sources, plus free text for one-offs.
**Also needs deciding:** multiple sources per article (**recommendation: yes**);
public or internal-only; what happens to citations if a source is deleted.
**Recommendation:** (b) with multiple sources per article, and a per-source
choice of whether it is publicly displayed.

---

# D. Users, security and operations

### OQ-27 — How are staff accounts created and removed? 🟠
**Why it matters:** Account creation is how someone gets the ability to write —
and, for admins, to publish. It is also the most commonly overlooked security
boundary. Removal matters just as much: what happens to a departed editor's
drafts and bylines?
**Options:** admin-created accounts / email invitations / self-registration
awaiting approval.
**Recommendation:** Admin-created with an email invitation. Deactivation, never
deletion — past work and audit records must survive.

### OQ-28 — Is two-factor authentication required for admins? 🟠
**Why it matters:** A compromised admin account means an attacker can publish
anything on your masthead. For a news brand, that is a reputational event, not
just a security incident.
**Recommendation:** Required for admins; optional for editors. Even if deferred
past V1, the account system should be designed with it in mind.

### OQ-30 — What are the actual performance targets? 🟡
**Why it matters:** "Fast" cannot be tested. A number can. Without one, nobody
can say whether we have succeeded.
**Recommendation:** Article page usable within ~2.5 seconds on a mid-range phone
on a typical mobile connection; Core Web Vitals in the "good" range.

### OQ-31 — What scale should we design for? 🔴
**Why it matters:** The difference between 50 and 50,000 articles per day, or
10,000 and 10 million monthly readers, changes real decisions. Designing for a
scale you will never reach is the most expensive mistake available here — and the
brief explicitly warns against it.
**Needed:** articles published per day, expected monthly readers, peak traffic on
a big story, number of staff, and any known upcoming spikes (an election, a
launch campaign).
**Assumption if unanswered:** a normal regional/national publication — tens of
articles per day, low millions of monthly readers at peak.

### OQ-32 — Which privacy and content laws apply? 🟡
**Why it matters:** The audience's location determines obligations: cookie
consent, privacy notices, data-subject rights, takedown handling, and where data
may be stored. These affect the public site's layout (consent banners) and
operations, and are cheaper to plan for than to retrofit.
**Needed:** primary audience country, company jurisdiction, any data-residency
requirement.

### OQ-33 — What accessibility standard are we committing to? 🟡
**Why it matters:** Accessibility is confirmed as a goal, but "accessible" is not
testable without a standard. In some jurisdictions this is also a legal
requirement for publishers.
**Recommendation:** WCAG 2.1 Level AA for the public site; keyboard-operable and
screen-reader-sane for the back-office.

### OQ-34 — What analytics do we need, and does that affect privacy? 🟡
**Why it matters:** Editors and admins will ask "how did that story do?" almost
immediately. Analytics choices also carry privacy and consent obligations, and
third-party trackers are a common cause of poor page-speed scores.
**Recommendation:** Privacy-respecting page-view analytics at launch; in-product
editorial dashboards later.

### OQ-37 — What is the timeline, budget and team? 🟡
**Why it matters:** The right V1 for a solo developer over three months is not the
right V1 for a team of five over nine months. Every scope recommendation in
`06-v1-vs-future.md` implicitly assumes an answer here.

### OQ-38 — Is there an existing brand, design direction, or site to migrate? 🟡
**Why it matters:** An existing publication brings brand guidelines, existing
article addresses that must keep working, and content to migrate — all of which
change the plan significantly. Starting truly fresh is simpler.

### OQ-39 — Will there be advertising, sponsorship, or a paywall? 🟡
**Why it matters:** Even if not in V1, monetisation shapes page layout, page
speed, consent handling, and whether "who may read this article" ever becomes a
question. Knowing the intention early prevents a costly redesign.

### OQ-40 — One language, or several? 🟡
**Why it matters:** Multi-language publishing is not a translation feature; it
changes the article model, addresses, navigation and the editorial workflow.
Knowing now whether it is *ever* likely affects how content is structured.
**Recommendation:** Confirm single-language for V1 explicitly.

### OQ-41 — What is the corrections, retraction and takedown policy? 🟡
**Why it matters:** This is an editorial policy question, and the software has to
implement whatever it says. Deciding the policy after building the workflow
usually means rebuilding the workflow.

### OQ-42 — Which timezone do publish times use, and what do readers see? 🟡
**Why it matters:** News is time-sensitive. Publish times appear on the public
page, in search results, and in structured data. Ambiguity here produces stories
that appear to be published tomorrow — or yesterday.
**Recommendation:** Store times unambiguously; display in the publication's local
timezone.

---

## Questions I have deliberately not asked

To keep the list honest, these are things I judged *not* worth deciding now,
because they can be decided later without rework: exact wording of interface
labels, visual design and typography, choice of hosting provider, deployment
process details, and the shape of the analytics dashboard.
