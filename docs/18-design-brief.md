# 18 — Design Brief

**Stage:** Phase 3 — visual design
**Last updated:** 2026-09-09
**Covers:** what this product should feel like, and the rules any visual proposal must satisfy

Labels carried forward from Phase 1 and 2:
**[CONFIRMED]** decided · **[PROVISIONAL]** drawn from an unapproved recommendation ·
**[FUTURE]** not V1 · **[NEW ISSUE]** uncovered here

---

## 0. What this document is, and what it is not

This brief does **not** restate the product. `01`–`12` remain the source of truth
and nothing here overrides them. Its job is narrower: to convert requirements
that were written in words into criteria a **design** can be judged against.

**[NEW ISSUE P3-01 — narrowed 2026-09-09]** `OQ-38` — *"is there an existing
brand, design direction, or site to migrate?"* — has still never been answered.

**What changed:** **Direction A — Broadsheet is now approved** and Stitch
`projects/18276979792746509337` is the canonical visual reference (`P3-03`). The
visual *system* — type pairing, warm neutrals, spacing scale, rules-not-shadows,
density model — is therefore **[CONFIRMED]**, not provisional.

**What is still open** is the **identity layer** only: the name **Today News**
and the masthead red `#9B2C1E`, both placeholders chosen by us. If a masthead,
wordmark or palette already exists, say so — but this is no longer a phase-wide
risk. `19` §1.1 keeps that red off every interactive element, so replacing it
touches the wordmark and the masthead rule and nothing else.

---

## 1. Product personality

**[PROPOSED]** Five adjectives, in priority order. Where two conflict, the
earlier one wins.

| # | Trait | What it means in practice | What it rules out |
|---|---|---|---|
| 1 | **Credible** | The page looks like something a person put their name to. Bylines, timestamps, sources and corrections are visible, not buried. | Anonymous content farms; "sponsored" blocks that mimic articles; engagement bait |
| 2 | **Legible** | Reading a 900-word story on a phone is comfortable for ten minutes. | Low-contrast greys; tight line-height; text over images |
| 3 | **Quiet** | The interface gets out of the way of the story. Chrome is minimal, the words are large. | Gradients, glass, drop shadows as decoration, animated accents |
| 4 | **Immediate** | The reader sees the headline first, always. The admin sees what is waiting first, always. | Hero carousels; splash screens; skeleton loaders on the public site |
| 5 | **Accountable** | Every consequential action names who did it and when. | Silent state changes; "someone" or "system" as an actor |

### The one-sentence test

> **A serious regional or national digital newspaper — not a blog, not a
> content farm, not a SaaS dashboard with articles in it.**

**[CONFIRMED constraint restated]** The CMS is a *newsroom tool*, so it inherits
the publication's identity rather than adopting generic admin-panel styling. Same
typeface family, same spacing scale, same colour reasoning. Different density.

---

## 2. Target users, and what each one needs from the design

Drawn from `01` §3, `08` §0, `09` §0, `10` §0. No new users are introduced.

### 2.1 Reader — anonymous, mostly on a phone — [CONFIRMED]

**Arrives on an article, not the homepage** (`08` §0). Design consequences:

- The article page must stand alone and answer *"what is this site?"* without the
  reader ever seeing the homepage.
- Masthead, section, date and byline are orientation, not decoration.
- The most valuable moment for a second story is **at the end of the article**,
  never before it.
- **[CONFIRMED]** Nothing precedes the headline. No banner, no promotion, no
  interstitial.

### 2.2 Editor — staff, deadline-driven, non-technical — [CONFIRMED]

Thinks about exactly two things (`09` §0): *what am I working on* and *what is
waiting for me*. Design consequences:

- **State is the most important data point on every editor screen.** It outranks
  headline, date and section in visual weight on list views.
- **[CONFIRMED]** There is no publish control anywhere in the editor's world —
  not hidden, not disabled, not conditional. It does not exist. This is a design
  constraint as much as a permission (`BR-05`, `09` §0).
- *Rejected* and *Changes requested* must be impossible to confuse (`09` §6).
  They get different colours, different words and different available actions.
- Admin feedback appears **with the story**, never in a separate inbox (`09` §5).

### 2.3 Admin — accountable for what goes public — [CONFIRMED]

Does two different jobs and the product must keep them apart (`10` §0):
**deciding** (many times a day, under pressure) and **running the newsroom**
(occasionally). Design consequences:

- The review queue and the review page are the product's primary workspace.
  Users, sources and categories live behind them and must never compete for
  attention.
- **[CONFIRMED]** Publishing is the one act with immediate public consequence. It
  is styled as deliberate — confirmation, distinct colour, plain language — not
  as a primary call-to-action to be clicked quickly.
- **[PROVISIONAL]** The single most useful number on the dashboard is *how long
  the oldest submission has been waiting* (`10` §2). It gets the largest type on
  the page.

### 2.4 Search engines and link-preview fetchers — [CONFIRMED]

A real user class (`01` §3.3) with design consequences, not just technical ones:

- One `<h1>` per page; a heading structure that survives being read out of order.
- The article must be present in the delivered page, so the design cannot depend
  on anything that only exists after scripts run (`SEO-01`).
- Every article needs an image that works as a 1200×630 preview card, and a
  summary that reads as a standalone sentence (`SEO-04`).

---

## 3. Editorial tone

**[PROPOSED]** The words in the interface are part of the design.

| Situation | Say | Never say |
|---|---|---|
| Empty review queue | "Nothing is waiting for review." | "No data" · "0 results" |
| Empty section page | "No stories published in Business yet." | A blank area · an endless spinner |
| Article not found | "We can't find that page." + recent stories | "404" · "Error" · a stack trace |
| Sign-in failure | One generic message for every cause (`P2-11`) | "No such user" · "Account disabled" |
| Server fault | "Something went wrong at our end." | Any technical detail (`SEC-06`) |
| Submit for review | "Submit for review" | "Publish" · "Send live" · "Go live" |
| Admin approval | "Approve & publish" | "Save" · "Accept" · "Confirm" |
| Rejection | "We're not running this" tone, with the reason | "Denied" · "Failed" |

**Voice rules — [PROPOSED]**

1. British English throughout, matching the existing documentation set.
2. Plain nouns over product jargon: *story*, *section*, *sources*, *review*.
   The word "content" does not appear in the interface.
3. Empty states state a fact and offer one next step. They are never apologies.
4. **[CONFIRMED]** Error text never reveals how the system is built (`SEC-06`).
5. Times are shown as both relative and absolute where it matters
   ("2 hours ago · 08 Sep 2026, 14:12") — **[PROVISIONAL]** pending `OQ-42`
   (timezone) and `P2-28`.

---

## 4. Visual goals

**[PROPOSED]** Six goals, each with a test that a screen either passes or fails.

| Goal | Test |
|---|---|
| **G1 — Typography carries the design** | Remove all colour from an article page. It should still be clearly hierarchical and pleasant to read. |
| **G2 — The story is the largest thing on the page** | On any article page at any width, body text is the visually dominant element after the headline. |
| **G3 — Colour means something** | Every non-neutral colour on screen either indicates an article state, marks an interactive element, or signals danger. No colour is decorative. |
| **G4 — One system, three densities** | Public, editor and admin screens are recognisably the same product; they differ in information density, not in visual language. |
| **G5 — State is unmissable** | Given a screenshot of any CMS list at thumbnail size, an article's state is still readable. |
| **G6 — Nothing moves without a reason** | Motion is limited to state feedback under 200 ms. No parallax, no entrance animation, no carousel. |

### Explicit anti-goals — [PROPOSED]

Stated so a direction can be rejected against them:

- ✕ SaaS dashboard chrome: sidebar-with-gradient, pill-shaped stat cards, purple accents
- ✕ Card grids for the sake of card grids on the public site
- ✕ Full-bleed hero images that push the headline below the fold
- ✕ Icon-only controls in the CMS where a destructive or public action is involved
- ✕ Dark-by-default reading surfaces (a preference, not the publication's voice)
- ✕ Decorative illustration in empty states — a sentence does the job better

---

## 5. UX goals

| ID | Goal | Traces to |
|---|---|---|
| UX-01 | A reader landing cold on an article knows what the publication is within one screen | `08` §0 |
| UX-02 | An editor can tell the state of every one of their stories without opening any of them | `09` §0, `EDT-02` |
| UX-03 | An editor reading requested changes on a phone fully understands what is being asked | `12` Part D |
| UX-04 | An admin can go from signing in to publishing a clean story in under two minutes | `01` §4 |
| UX-05 | An admin can approve, request changes, or reject entirely from a phone | `12` Part D |
| UX-06 | No screen in the editor area contains, implies, or hints at a publish action | `BR-05` |
| UX-07 | Every consequential action is confirmable, and every confirmation states the public consequence in plain words | `10` §3 |
| UX-08 | Empty states are never blank and never a spinner | `12` §0 |
| UX-09 | Losing work is impossible through any normal interaction | `EDT-06`, `P2-15` |
| UX-10 | Nothing in the interface reveals the existence of an unpublished story to anyone not entitled to see it | `SEC-03`, `P2-10` |

---

## 6. Information hierarchy

### 6.1 Public article page — the most important page in the product

**[CONFIRMED priority order]** (`08` §4):

```
1  Headline
2  Standfirst / summary
3  Byline + publication time + section
4  Featured image (+ caption, credit)
5  Body
6  Correction notice, if any        [PROVISIONAL — OQ-09]
7  Sources                          [PROVISIONAL — OQ-24]
8  More in this section
9  Masthead nav / footer
```

**[CONFIRMED]** Nothing may be inserted above 1. **[NEW ISSUE P3-02]** The
correction notice is placed at position 6, *after* the body, on the reasoning
that a reader arriving cold should read the story before the amendment history.
An argument exists for placing it directly under the byline where it cannot be
missed. This is an editorial-policy decision (`OQ-09`, `OQ-41`), not a visual one.

### 6.2 Homepage / section page

```
1  Masthead + section navigation
2  Lead story (largest card — newest, not "featured")   [PROVISIONAL — OQ-17]
3  Subsequent stories, strictly newest-first
4  More / pagination
5  Footer
```

**[PROVISIONAL — OQ-17]** V1 has no curation. The lead position is *whatever is
newest*, and the design must not imply editorial selection where none exists.
Two stories published a minute apart appear in that order (`08` §R-01).

### 6.3 Editor screens

```
1  What needs my attention  (changes requested)
2  What I am working on     (drafts)
3  What is waiting          (in review)
4  What went out            (published)
5  Navigation, profile
```

### 6.4 Admin screens

```
1  How many are waiting, and how long has the oldest waited
2  The queue itself
3  Recently published, and by whom
4  Newsroom management  (users, sources, categories)
5  Navigation, profile
```

---

## 7. Responsive requirements

**[CONFIRMED]** All three areas work on phone, tablet and desktop (`PUB-13`,
`12` Part D). This brief adds no new requirements; it fixes the priorities.

### Non-negotiables

| Requirement | Source |
|---|---|
| The article page keeps one comfortable reading column at every width; it never stretches to fill a wide screen | `08` §4 |
| Headline and the start of the story come first at every size | `08` §4 |
| Smaller images are sent to smaller screens | `PRF-04` |
| Space is reserved for images before they load — the page never jumps | `PRF-08` |
| Nothing depends on hover | `08` §4 |
| Tap targets are comfortably hittable on a phone | `08` §4 |
| **Article review works completely on a phone** — read, approve, request changes, reject, no zooming | `12` Part D |
| **Reading requested changes works perfectly on a phone** | `12` Part D |

### Deliberate non-priorities — [PROVISIONAL]

- Writing a long story on a phone is **not** optimised for (`12` Part D). Short
  edits and responding to feedback are.
- Users, sources and categories management is *possible* on a phone, not
  optimised.

---

## 8. Accessibility requirements

**[CONFIRMED]** The platform must be accessible.
**[PROVISIONAL — OQ-33]** Target is WCAG 2.1 Level AA for the public site.
**[CONFIRMED — A11Y-07]** The back-office is in scope too; staff may also have
disabilities.

### Design-time obligations

| Rule | Requirement |
|---|---|
| Contrast | Body text ≥ 4.5:1; large text and UI boundaries ≥ 3:1 (`A11Y-02`) |
| Colour is never the only signal | Every article state carries a **label**, not just a colour (`A11Y-02`) — this is why status badges are text-first |
| Focus | Every interactive element has a visible focus ring that is not the browser default alone (`A11Y-05`) |
| Keyboard | Every action, including approve / request changes / reject, is reachable and operable by keyboard (`A11Y-01`, `A11Y-07`) |
| Structure | One `<h1>`; headings descend without skipping; landmarks present (`A11Y-04`, `SEO-02`) |
| Images | Alt text is a **required field** in the article editor, not an optional one (`A11Y-03`, `SEO-12`) |
| Resize | Layout survives 200% text zoom without loss of content or function (`A11Y-06`) |
| Motion | Respect reduced-motion preferences; nothing essential is conveyed by movement |
| Targets | Minimum 44×44 px interactive targets on touch |

**[PROPOSED]** Accessibility is a *review criterion for each direction* in
`20-visual-direction.md`, not a pass applied at the end.

---

## 9. Public website principles

**[PROPOSED]** Ten rules. A public screen that breaks one is wrong regardless of
how it looks.

1. **The story is the product.** Every pixel not serving the story is justified
   or removed.
2. **The article page is the front door.** It must work for someone who has never
   heard of the publication.
3. **Nothing precedes the headline.**
4. **Only published stories appear, anywhere** — listings, search, feed, sitemap
   (`BR-01`).
5. **Speed is a visual decision.** Image count and weight per screen are design
   choices with performance consequences (`PRF-04`, `PRF-05`).
6. **No layout shift.** Space is reserved for every image and embed (`PRF-08`).
7. **Ordering is honest.** Newest-first is shown as newest-first; nothing implies
   curation that does not exist (`OQ-17`).
8. **Attribution is visible.** Byline, time, section and sources are part of the
   page's credibility, not metadata to be minimised.
9. **Corrections are shown, not hidden** (`PUB-09`, `OQ-09`).
10. **Failure is dignified.** Not-found and error pages carry the full masthead
    and offer a route onward (`PG-PUB-09`, `PG-PUB-10`).

---

## 10. CMS principles

**[PROPOSED]** Ten rules for the editor and admin areas.

1. **Same publication, different density.** The CMS uses the publication's
   typography and colour reasoning. It is not a separate visual product.
2. **State before everything.** On any list, an article's state is the first
   thing read.
3. **The publish boundary is visible in the design.** Editors see no publish
   control; admins see it in exactly one place, `PG-ADM-03` (`BR-02`, `BR-05`).
4. **Hiding a control is courtesy, not security** (`SEC-02`). The design never
   implies that a hidden button is the protection.
5. **Consequential actions state their consequence.** "This will be live on the
   public site immediately."
6. **Mandatory feedback is enforced in the interface as well as the server.**
   Request-changes and reject cannot be submitted empty (`BR-07`, `BR-08`).
7. **Feedback lives with the story** (`09` §5). Earlier rounds stay visible.
8. **Destructive and public actions are never icon-only.**
9. **Saving is never ambiguous.** Saved / saving / failed-to-save are always
   distinguishable, and a failure is loud (`EDT-06`, `OQ-26`).
10. **Nothing in the CMS confirms the existence of a story the viewer may not
    see** (`SEC-03`, `P2-10`).

---

## 11. What this brief deliberately does not decide

Stated so the boundary is auditable:

- It selects no typeface, palette or grid — that is `19-design-system.md`.
- It chooses no visual direction — that is `20-visual-direction.md`.
- It answers **no open question**. Every `[PROVISIONAL]` marker names the
  question it waits on.
- It introduces no feature, page or state that `07` and `12` do not already
  contain.

### New issues raised by this document

| Ref | Issue | Why it matters |
|---|---|---|
| **P3-01** 🟠 | `OQ-38` unanswered — no confirmed brand. **Narrowed 2026-09-09:** Direction A is approved, so this now affects the **identity layer only** — the name *“Today News”* and the masthead red `#9B2C1E` | Replacing them is contained to the wordmark and masthead, not a rework of the phase. Answer before Phase 4 writes code |
| **P3-02** 🟡 | Placement of the correction notice (before or after the body) | It is an editorial-credibility decision that looks like a layout choice — ties to `OQ-09` / `OQ-41` |
| **P3-03** ✅ | ~~Two competing Stitch projects existed under near-identical names~~ — **RESOLVED 2026-09-09** | Stitch `projects/18276979792746509337`, **Direction A**, is canonical and read-only this phase. *Veritas Gazette* (`…334334`) is **not** to be implemented from. See `20` §0 |

---

## 12. Related documents

| Document | What it adds |
|---|---|
| `19-design-system.md` | Typography, colour, spacing, components |
| `20-visual-direction.md` | The explored directions and the recommendation |
| `21-client-demo-script.md` | How this is presented |
| `22-design-audit.md` | Whether the design actually matches the requirements |
