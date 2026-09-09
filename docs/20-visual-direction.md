# 20 — Visual Direction

**Stage:** Phase 3 — visual design
**Last updated:** 2026-09-09
**Covers:** the directions explored, how each was judged, and which one is recommended

---

## 0. What actually happened in Stitch — stated plainly

Honesty about tooling first, because it changes how much weight the
recommendation below can carry.

| Artefact | Status | Evidence |
|---|---|---|
| Stitch project **“Today News — V1 Visual Design (Phase 3)”** | ✅ **Created** | `projects/18276979792746509337` |
| Design system **A — Broadsheet** | ✅ **Created** | `assets/14208616288541575300` |
| Design system **B — Dispatch** | ✅ **Created** | `assets/18173827643951736094` |
| Design system **C — Register** | ✅ **Created** | `assets/7590503834231912600` |
| **Rendered exploration screens** | ✅ **Created** — *see correction below* | `screens/19ba…` A, `screens/db79…` B, `screens/9848…` C, plus two Broadsheet article-page renders |

### Correction — 2026-09-09

**The original version of this section said the Stitch renders had failed and
that nothing was persisted. That is no longer true, and it was already becoming
untrue as it was written.**

At the time of writing, five generation calls had timed out server-side and
`list_screens` returned empty over ~20 minutes of checking. The generations were
in fact still running; they completed asynchronously and **persisted**. Verified
on 2026-09-09, the project contains five rendered desktop screens at 2560px:

| Screen | Stitch ID |
|---|---|
| Exploration A — Broadsheet Article | `19ba1939f9b54069a40f7f939c23805d` |
| Exploration B — Modern Digital Article | `db798d4854194983ad2c7868016a1f82` |
| Exploration C — Wire-service Article Page | `9848cfef82bf4211aebb4ea280f01753` |
| Today News — Broadsheet Article Page | `8d2c950d8d6549d8bfde8d405796629a` |
| Today News — Broadsheet Article Page | `87693fffa5754f1ca10d9b1a0cf3d8da` |

**What this changes:** the three directions **can** now be compared as rendered
pictures, which is the evidence §3 said was missing. The recommendation in §4 was
not revised in light of them — it still rests on the written criteria — so if the
renders and the reasoning disagree, that is a real disagreement worth looking at
before Direction A is approved.

**The lesson worth keeping:** a timed-out generation call is not the same thing as
a failed one. Re-check before recording a failure.

**Also true:** the chosen direction was built out properly in Figma, where it can
be seen and clicked. That file remains the primary visual deliverable for this
phase — it is a fuller artefact than any Stitch render.

### ✅ P3-03 — RESOLVED 2026-09-09. Which Stitch project is canonical

**[CONFIRMED — client decision, 2026-09-09]**

| | |
|---|---|
| **Canonical visual source of truth** | Stitch project **“Today News — V1 Visual Design (Phase 3)”** — `projects/18276979792746509337`, and its selected **Direction A — Broadsheet** |
| **NOT canonical** | Stitch project **“TODAY NEWS”** / *Veritas Gazette* — `projects/11776752516184334334` |
| **Handling of the canonical project** | **Do not modify it during this phase.** Read-only reference. |

The secondary project — created 2026-09-09, four mobile screens, built on a
different design system (*“Modern Editorial & Publishing System”*, wordmark
*Veritas Gazette*, **Public Sans** interface type, **0px** radii, a different
palette) — **must not be used as the basis for implementation**. It was not
produced by the documented Phase 3 work and it disagrees with Direction A on
typeface, radius and palette.

**It has deliberately not been deleted.** The decision recorded above was to
de-canonicalise it, not to destroy it, and deleting someone's work is not a
conclusion this document may draw on its own. If it should be removed, say so and
it will be. Until then it stays, marked non-canonical everywhere it appears.

**One instruction for Phase 4:** "the Stitch project" is now an ambiguous phrase
in this account. Always cite `projects/18276979792746509337` by ID.

---

## 1. The three directions

All three obey the same non-negotiables from `18` and `19`: nothing above the
headline, a 680px reading measure that never stretches, text never over an image,
status always carrying a text label, and no publish control in the editor area.
They differ in *character*, not in rules.

### Direction A — **Broadsheet**

> Print authority translated to screen.

| | |
|---|---|
| Headlines | Newsreader (serif), 56/60 |
| Article body | **Newsreader (serif), 19/32** |
| Interface | Inter |
| Separation | 1px hairline rules |
| Radius | 4px · photography square |
| Neutrals | Warm off-white (`#F7F6F3`) |
| Identity | Masthead red rule (`#9B2C1E`) |
| Density | Moderate — more stories visible per screen than B |

Serif throughout the editorial surface. The design is carried by type and rules;
colour does almost no work. Closest to a traditional newspaper's digital edition.

### Direction B — **Dispatch**

> A modern digital-native publication.

| | |
|---|---|
| Headlines | Source Serif 4 (serif), 52/58 |
| Article body | **Inter (sans), 18/32** |
| Interface | Inter |
| Separation | Whitespace first, very light rules |
| Radius | 8px · photography square |
| Neutrals | Near-white (`#FAFAF8`) |
| Identity | Wordmark red, softer chrome |
| Density | Lower — bigger images, more air |

Serif headline for authority, sans body for screen clarity. Larger lead imagery,
generous section breaks. Approachable and contemporary.

### Direction C — **Register**

> Wire-service efficiency.

| | |
|---|---|
| Headlines | Public Sans (sans), 700, 44/50 |
| Article body | **Inter (sans), 17/29** |
| Interface | Inter |
| Separation | Hairlines and background tints, flat |
| Radius | 4px |
| Neutrals | Cool grey (`#F4F5F6`) |
| Identity | Colour-coded states carry most of the identity |
| Density | High — compact rhythm, 40px table rows |

Sans-dominant and systematic. Optimised for scanning many stories and running a
busy newsroom quickly.

---

## 2. Evaluation

Nine criteria from the Phase 3 brief. **5 = strongest**. Scored against
`18-design-brief.md`, not against personal taste.

| Criterion | A — Broadsheet | B — Dispatch | C — Register |
|---|:--:|:--:|:--:|
| **Readability** (long-form, phone, ten minutes) | **5** | 4 | 3 |
| **Editorial credibility** | **5** | 4 | 2 |
| **Visual hierarchy** | **5** | 4 | 4 |
| **Navigation** | 4 | 4 | **5** |
| **Information density** | 4 | 2 | **5** |
| **Mobile UX** | 4 | 3 | **5** |
| **CMS usability** | 4 | 3 | **5** |
| **Accessibility** | **5** | 4 | 4 |
| **Implementation practicality** | 4 | 4 | **5** |
| **Total** | **40** | 32 | 38 |

### Where each direction actually wins and loses

**A — Broadsheet**
*Wins:* it is the only direction that passes `18` §4 **G1** outright — strip every
colour from the article page and the hierarchy still reads, because serif type and
hairline rules are doing the work. It is also the only one that unambiguously
answers "is this a real publication?" for a reader arriving cold from a search
engine, which `08` §0 identifies as the most important journey in the product.
*Loses:* a serif body at 19/32 costs vertical space, so slightly fewer stories fit
on a listing screen than in C. Serif body text is also less forgiving of poor
rendering on low-DPI screens.

**B — Dispatch**
*Wins:* the most immediately likeable, and the sans body is the safest choice for
uneven rendering.
*Loses on the criteria that matter most.* Its whitespace-first separation and 8px
radii read as *product* rather than *publication* — which walks straight into the
brief's anti-goal list. Its larger lead imagery is the real problem: on a phone it
pushes the beginning of the story further down, and `08` §4 fixes the priority
order as headline → picture → story with nothing competing. B is a good design for
a different brief.

**C — Register**
*Wins:* comfortably the best CMS. Dense tables, compact rows, colour-coded states —
exactly what an admin clearing a queue at 11pm wants, and it scores highest on
mobile and on implementation cost.
*Loses:* it fails the one-sentence test in `18` §1. A sans-serif, cool-grey,
tightly-tracked news site reads as an aggregator or an internal tool, not as a
publication that puts its name to a story. Editorial credibility is trait #1 in
the brief's priority order, and where traits conflict the earlier one wins. That
is decisive, not a matter of degree.

---

## 3. What the scores do *not* say

Two honest caveats:

1. **The totals are close between A and C (40 vs 38), and they are close for a
   reason.** C is genuinely better at half the criteria. If this product were
   mainly a newsroom tool with a website attached, C would win. It is the other
   way round: `01` §2.1 states the public site is the part everything else exists
   to serve.

2. **These scores were reasoned, not observed — and that is now a fixable gap.**
   The scores were awarded against the written criteria in `18-design-brief.md`
   before any render existed. As recorded in §0, the three exploration renders
   **do** now exist. Nobody has yet re-scored the directions against them.
   The scores remain defensible as reasoning; they are still not the same
   evidence as three pictures compared side by side. **Recommended: look at the
   three renders before approving Direction A.** That is now a ten-minute task
   rather than a blocked one.

---

## 4. Recommendation — **Direction A, Broadsheet**, with two deliberate borrowings

**Adopt Direction A** as the product's visual language.

It wins on the four criteria the brief ranks highest (readability, editorial
credibility, visual hierarchy, accessibility), and its weaknesses — density and
CMS efficiency — are the two things that can be fixed *inside* a direction without
changing its character.

### Borrowed from C — Register (CMS density)

Applied in `19` §4.2 and visible in the Figma Admin screens:

- CMS tables use **48px comfortable / 40px compact** rows, not editorial spacing.
- The **state badge is always the second column**, so it is scannable down a list.
- The review queue is a **table, not a card grid**, at `md`+.

This gives the admin area C's operational speed while keeping A's typography.

### Borrowed from B — Dispatch (one component only)

- **"More in this section"** uses B's larger card treatment at desktop widths,
  because at the *end* of an article there is nothing left to compete with and a
  bigger image genuinely earns the click.

### Explicitly rejected from B and C

| Rejected | Why |
|---|---|
| B's 8px radius on cards and panels | Reads as app chrome. A stays at 3px / 6px, photography square. |
| B's whitespace-first separation | Hairline rules are the publication signal; whitespace alone is not. |
| B's oversized lead imagery | Pushes the story start below the fold on a phone — breaks `08` §4. |
| C's sans-serif headlines | Removes the single strongest credibility signal available. |
| C's cool grey neutrals | Cool greys read as software; warm greys read as print (`19` §1.1). |
| C's 17/29 body | Below the floor `19` §1.2 sets for reading comfort. |

---

## 5. What the decision commits you to

**[CONFIRMED 2026-09-09]** Direction A is **approved and canonical**. It is no
longer a recommendation, and the seven rules below are no longer provisional on
this axis — they are the visual contract Phase 4 builds against.

1. **Newsreader** for all editorial type — headlines, standfirst and article body.
2. **Inter** for the entire interface layer, in all three areas.
3. **Warm** neutrals, never cool grey.
4. **Rules, not shadows** — elevation is reserved for modals and popovers.
5. **Square-cornered photography** everywhere.
6. **`#9B2C1E` is identity, never interactivity** — it appears on the masthead rule
   and the wordmark, and never on a button.
7. **One system, three densities** — public, editor and admin share the language and
   differ only in how much is packed in.

### What the decision does *not* cover

The choice between directions is settled. **One narrower question is not**, and it
is worth keeping visible rather than quietly folding into the approval.

**[OPEN — P3-01 / OQ-38]** Nobody has yet said whether a **pre-existing brand**
exists — a real masthead, wordmark, palette or site to migrate from. Approving
Direction A settles the *system*: the type pairing, the warm neutrals, the rules-
not-shadows treatment, the density model. It does not by itself confirm the
**identity layer** sitting on top of it — the name *"Today News"* and the masthead
red `#9B2C1E`, both of which are still placeholders chosen by us.

**What changes now that Direction A is approved:** this is no longer a blocker.
If a brand turns up later it becomes a **contained change** — the wordmark, the
identity colour, and the masthead — rather than a rework of the whole phase,
precisely because `19` §1.1 keeps `#9B2C1E` off every interactive element. That
was the reason for that rule, and this is where it pays.

**Still worth answering early.** Swapping an identity is cheap in Figma and
expensive once it is in code.

---

## 6. Where to see it

| Artefact | Where | Status |
|---|---|---|
| **⭐ CANONICAL — the visual source of truth** | Stitch `projects/18276979792746509337` — *“Today News — V1 Visual Design (Phase 3)”*, Direction A | **Do not modify this phase** |
| Direction A as a working design system | Stitch `assets/14208616288541575300` | Canonical |
| The three exploration renders, side by side | Same project — screens `19ba…` (A), `db79…` (B), `9848…` (C) | Reference |
| Direction B | Stitch `assets/18173827643951736094` | Not selected |
| Direction C | Stitch `assets/7590503834231912600` | Not selected |
| **Direction A built out across 23 screens** | Figma — `3EFcIazozEC6oVWp14suf7`, sections 01–06 | The buildable deliverable |
| The seven workflow diagrams | Eraser — `LonyMflc9abdabC5Y7rZ` | Current |
| 🚫 *Veritas Gazette* | Stitch `projects/11776752516184334334` | **NOT canonical — do not implement from this** |
| The reasoning behind every rule | `18-design-brief.md`, `19-design-system.md` | Current |
