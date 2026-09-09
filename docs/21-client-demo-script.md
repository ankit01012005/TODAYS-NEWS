# 21 — Client Demo Script

**Stage:** Phase 3 — visual design
**Last updated:** 2026-09-09
**Audience:** the client. Non-technical.
**Length:** 20–25 minutes presenting, plus questions
**Rule:** the words *database*, *API*, *server*, *framework* and *stack* do not appear until section 10 — and barely then.

---

## 0. Before you start

**Have open, in this order:**

| Tab | What |
|---|---|
| 1 | Figma — section `00 — Overview` |
| 2 | Figma — presentation mode, starting at **Journey 1** |
| 3 | Eraser — diagram **7. How a story reaches the public** |
| 4 | Eraser — diagram **1. Product ecosystem** |
| 5 | Eraser — diagram **6. High-level system boundary** *(only if asked)* |

> ### ⚠️ Read this before you present
>
> **The prototype cannot click from the sign-in screen into the Admin CMS.**
> Verified 2026-09-09 — see `22-design-audit.md` `D-06`. Everything inside the
> admin area works: queue → review → approve, request changes and reject are all
> wired. There is simply no link *in* from sign-in, because the real product
> decides that by role and a static prototype cannot.
>
> **What this means for you at section 7:** when you finish Journey 1 and say
> *"now we switch to the admin"*, do not try to click there. **Navigate to
> `PG-ADM-01 · Admin dashboard` directly** and carry on. Rehearse that jump —
> it is the one seam in an otherwise continuous story, and it lands squarely on
> the most important part of the demo.
>
> Say it plainly if anyone notices: *"the prototype starts each role separately;
> the product decides that from who you signed in as."* That is true, and it is a
> better answer than fumbling.

**The one sentence to open and close with:**

> **“A newsroom with a door — and only admins hold the key to that door.”**

**Two things to say out loud in the first minute**, so nobody feels misled later:

1. The **visual direction is agreed** — Direction A, Broadsheet, signed off
   2026-09-09. What is still a placeholder is narrower: the **name** *Today News*
   and the **masthead red**. If a real brand exists, those two things change and
   almost nothing else does (`OQ-38`).
2. Phase 1 left **42 open questions** and Phase 2 added 29 more. None have been
   answered. Where a screen depends on one, the screen says so on its face.

---

## 1. What the platform is  *(90 seconds)*

**Show:** Figma `00 — Overview`.

> “Today News is a news publishing platform. It has three parts that share one
> body of content.
>
> There is a **public website** — the newspaper itself, the part the world sees.
>
> There is a **private writing tool** where journalists write their stories.
>
> And there is an **admin area** where someone decides what the publication puts
> its name to.
>
> The single most important rule in the whole product is this: **a journalist
> cannot publish.** Not by accident, not by clicking the wrong thing, not by
> knowing a secret web address. Only an administrator can put a story in front of
> the public, and only by deliberately choosing to.”

**Pause here.** This is the idea everything else hangs off. If they only remember
one thing, it should be this.

---

## 2. Who uses it  *(90 seconds)*

**Show:** Eraser diagram **1 — Product ecosystem**.

> “Three kinds of people, plus one that isn’t a person.
>
> **Readers.** Members of the public. They don’t log in, don’t have accounts,
> can’t comment. They read, and that’s all.
>
> **Editors.** Your journalists. They write stories, save drafts, send them for
> review, and respond to feedback. They have accounts you create for them.
>
> **Admins.** Your editor-in-chief or desk heads. They read what’s been
> submitted and make one of three decisions. They also run the newsroom — staff,
> sections, sources.
>
> And the fourth: **search engines and the link previews** behind WhatsApp and
> LinkedIn. For most news sites those bring in more readers than the homepage
> does, so we treat them as a real audience with real requirements — not as
> technical housekeeping.”

---

## 3. The reader’s experience  *(4 minutes)*

**Show:** Figma `02 — Public Website`. Start on **the article page**, not the homepage.

> “I’m starting on an article rather than the front page deliberately, because
> that is how most people actually arrive — from a Google result or a link
> someone sent them. They may never have heard of the publication.
>
> So this page has to do two jobs at once: tell the story, and tell you where you
> are.”

**Walk down the page, naming what each thing is for:**

| Point at | Say |
|---|---|
| Masthead + red rule | “Identity. You know instantly whose journalism this is.” |
| Headline | “Nothing ever appears above the headline. No banner, no pop-up, no advert.” |
| Standfirst | “One sentence that also becomes the Google description and the WhatsApp preview.” |
| Byline row | “Who wrote it, which section, when it was published — and when it was last updated.” |
| Photograph + credit | “Caption and credit sit under the picture. We never put text over a photograph.” |
| The body column | “This column stays the same comfortable width no matter how wide your screen is. Reading is the product.” |
| Sources block | “Where the information came from. This is a credibility feature — it’s what separates a publication from a blog.” |
| Correction notice | “When we materially change a published story, we say so, with a date.” |
| More in Politics | “The best moment to offer a second story is when someone has finished the first one.” |

**Then show the mobile frame beside it.**

> “Same story on a phone. Same priority order — headline, picture, story. Most of
> your readers will be here.”

**Then the homepage.**

> “Latest first, newest at the top. I want to flag one thing honestly: in this
> first version there is **no way to feature or pin a story**. Two stories
> published a minute apart appear in that order, not in order of importance. That
> is a deliberate simplification, and it is one of the decisions we need from
> you.”

---

## 4. The editor’s experience  *(4 minutes)*

**Show:** Figma `03 — Editor CMS`, starting at the **dashboard**.

> “This is what a journalist sees when they sign in. It answers one question:
> *what needs me today?*
>
> The gold panel at the top is a story an admin has sent back with notes. It is
> the first thing on the page because it is the thing that will otherwise sit
> forgotten.”

**Move to the article editor.**

> “This is where they write. Headline, summary, the story itself. On the right:
> the section, the picture — and note that **alt text is a required field**, not
> an optional one, because a picture without a description is unusable for a blind
> reader and invisible to Google. Then the sources, and the search-engine title.
>
> Down here: Save draft. Preview. And **Submit for review**.”

**Point deliberately at the action bar.**

> “Look at what is *not* there. There is no Publish button. Not greyed out — not
> present. It does not exist on this screen, in any state. That is the rule from
> the first slide, made visible.”

**Show the preview screen.**

> “Before sending it, they can see exactly how a reader will see it. This
> prevents a whole category of pointless review rounds.”

---

## 5. The admin’s experience  *(4 minutes)*

**Show:** Figma `04 — Admin CMS`, starting at the **dashboard**.

> “The admin does two very different jobs, and we’ve kept them apart.
>
> Job one is **deciding**, which happens many times a day, often under pressure.
> Job two is **running the newsroom** — staff, sources, sections — which happens
> occasionally.
>
> The biggest number on this page isn’t how many stories are waiting. It’s **how
> long the oldest one has been waiting.** Three hours and forty minutes. An editor
> sitting waiting for a decision is the failure this screen exists to prevent.”

**Move to the review queue.**

> “Everything waiting for a decision, **oldest first** — so the journalist who has
> been waiting longest gets served first, not the most recent submission. And this
> column marks a story that’s been sent back before; a second-round story deserves
> a closer look.”

**Move to the article review page.**

> “This is the most important screen in the product. It’s the only place in the
> entire system where publishing can happen.
>
> On the left, the whole story exactly as a reader would see it — plus the things
> a reader doesn’t get: who wrote it, when it arrived, the sources, and the
> feedback from last time. This green band shows **what changed since the last
> submission**, so a second review doesn’t mean re-reading nine hundred words.
>
> On the right, three decisions. Three, and only three.”

---

## 6. Follow one story from creation to publication  *(5 minutes — the centrepiece)*

**Show:** Eraser diagram **7 — How a story reaches the public**, then run the
Figma prototype.

> “Let’s follow one real story all the way through. It’s the same story on every
> screen you’ve seen — the council budget.”

**Run the prototype, narrating:**

| Step | Say |
|---|---|
| Sign in → dashboard | “Jane, a reporter, signs in.” |
| → Article editor | “She writes the budget story.” |
| → Preview | “She checks how it will look.” |
| → Submit for review | “She sends it. **Nothing is public yet.**” |
| → In review, locked | “And now she can’t edit it. That’s deliberate — an admin must never approve text that changed while they were reading it. If she sent it by mistake she can withdraw it, which isn’t a rejection.” |
| Switch to admin | “Ravi, the editor-in-chief, opens the queue.” |
| → Article review | “He reads it.” |
| → Request changes | “He’s not happy with one figure. He sends it back — and notice **he cannot send it back empty**. A written explanation is required by the system, not by good manners. ‘Sent back with no explanation’ is the single most common source of newsroom friction, and the product simply prevents it.” |

**Now switch back to the editor.**

| Step | Say |
|---|---|
| Dashboard → changes requested | “Jane sees it flagged the moment she signs in.” |
| → Article editor with feedback | “And Ravi’s comment appears **with the story**, not in a separate inbox she has to go hunting through.” |
| → Resubmit | “She fixes it and sends it again.” |

---

## 7. The approval  *(2 minutes)*

**Continue the prototype.**

| Step | Say |
|---|---|
| Review queue → article review | “Back to Ravi. The green band shows him only what changed.” |
| → Approve & publish | “He approves.” |
| → Confirmation | “And here is the one moment in the product where we deliberately slow someone down. It doesn’t say ‘Are you sure?’. It says **‘This will be live on the public site immediately.’** Because it will be — and his name and the time are recorded against it permanently.” |

> “That record matters more than it looks. If a published story is ever disputed
> — legally, professionally, or publicly — the only defensible answer to ‘who
> approved this, and when?’ is a record made at the time. It cannot be
> reconstructed afterwards.”

---

## 8. The published story  *(1 minute)*

**The prototype lands on the public article page.**

> “And there it is. Same story, now public. It’s on the homepage, on the Politics
> page, in the news feed, and available to Google.
>
> That is the full circle: written by a journalist, checked by an editor,
> corrected once, approved, published, read.”

**Click through as a reader:** article → another story → section → homepage.

> “And a reader can now move around it exactly as they would on any newspaper
> site.”

---

## 9. How the three areas connect  *(2 minutes)*

**Show:** Eraser diagram **1 — Product ecosystem** again.

> “So — three areas, one shared set of stories.
>
> The **public website** shows published stories and nothing else.
>
> The **editor tool** can create and submit, and there is no route from it to
> publication. None. Not a hidden one.
>
> The **admin area** is the only bridge between the newsroom and the public.
>
> If you remember the shape of this diagram, you understand the product.”

---

## 10. Only now — the technical picture  *(2 minutes, and only if wanted)*

**Show:** Eraser diagram **6 — High-level system boundary**.

> “I’ve deliberately left this until last, because it’s the least interesting part
> to you and the least decided part for us.
>
> **No technology has been chosen.** No database, no hosting, nothing. That is
> the *next* phase, and it happens after you’ve agreed what the product does —
> not before.
>
> What this diagram shows is only where the lines are. There’s a public zone
> anyone can reach. There’s a private zone that needs a sign-in. There’s the
> information the product has to remember — the stories, the staff, the sources,
> and the record of who did what. And there are a few things outside our control:
> search engines, link previews, and the email that carries an invitation.
>
> The four rules in red are the ones every technical decision later will have to
> satisfy.”

---

## 11. Closing — what we need from you  *(2 minutes)*

Do not end on a demo. End on decisions.

> “Three things, in order of how much they cost us if they go unanswered.”

### 1. Is there a brand? — `OQ-38`

> “Everything you’ve seen is a proposal. If a masthead, palette, typeface or
> existing website already exists, tell us now. Retro-fitting an identity after
> this point is the most expensive rework in the project.”

### 2. Fourteen blocking questions

> “Phase 1 flagged fourteen questions as needing answers before foundations are
> designed. The most consequential are: what happens when a **published** story
> needs correcting; whether we have **sections** like Politics and Business; and
> whether we keep a **history** of every version. Each one changes the shape of
> what we build, not just the look.”

### 3. One contradiction only you can settle — `P2-01`

> “The documentation currently says two opposite things about whether an admin can
> approve their **own** story. One place forbids it; another recommends allowing
> it and simply recording it. Both cannot be true. You saw a note about it on the
> review screen — that note is the most we can design until you decide.”

**Close on the opening line:**

> **“A newsroom with a door — and only admins hold the key.”**

---

## 12. Questions you should expect, and honest answers

| They ask | Answer |
|---|---|
| “Can we schedule stories to go out at 7am?” | Not in V1. It’s the first thing that would run while nobody is logged in, and we want the everyday path proven first. The design already carries an `Approved` state so it slots in cleanly later. |
| “Can we feature a story on the front page?” | Not in V1 — it’s strictly newest-first. This is on the decision list (`OQ-17`), and it’s often wanted sooner than people expect. |
| “Can readers comment?” | No. Comments bring accounts, moderation and abuse handling — that’s a second product, not a feature. |
| “What if we publish something wrong?” | Two answers. A correction is written and reviewed while the live story **stays up untouched**, then replaces it instantly. Or an admin withdraws it entirely — it leaves the site, the listings and the search engines, but is never destroyed. |
| “Can an admin fix a typo without the whole review process?” | That’s an open question (`P2-18`). The line between ‘a typo’ and ‘a change of meaning’ is a judgement no software can make, so it needs to be your editorial policy, not our code. |
| “Can editors see each other’s work?” | Currently designed as no — own stories only. Widening that later is easy and safe; narrowing it after people rely on it is disruptive. Open question `OQ-05`. |
| “How many admins do we need?” | At least two. The system will refuse to let you deactivate the last one — an admin-less newsroom can’t publish and can’t fix itself. |
| “Is it accessible?” | It’s designed to WCAG 2.1 AA. Practically: every status has a word as well as a colour, everything works by keyboard, and picture descriptions are compulsory rather than optional. |
| “When can we see it working?” | This is design, not software. Nothing here runs. The next phase chooses the technology; the one after builds it. |
| “Why does it look like a newspaper rather than an app?” | Because that is the point. It’s the fastest signal to a stranger that this is journalism someone put their name to. That choice is written up in `20-visual-direction.md` with the two alternatives we rejected and why. |

---

## 13. What NOT to do in this presentation

- Do not open the Figma design-system section. Nobody outside the project wants
  to see colour swatches, and it makes the work look decorative.
- Do not read requirement codes aloud. `BR-05` means nothing to them; *“a
  journalist cannot publish”* means everything.
- Do not demonstrate every screen. The states board and the management screens
  are there to be *found*, not shown.
- Do not describe open questions as gaps. They are decisions waiting for the
  person who is allowed to make them — which is them, not us.
- Do not promise a date. No technology has been chosen.
