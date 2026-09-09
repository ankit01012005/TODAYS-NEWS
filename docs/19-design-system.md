# 19 — Design System

**Stage:** Phase 3 — visual design
**Last updated:** 2026-09-09
**Covers:** the reusable visual language shared by the public website, the Editor CMS and the Admin CMS

**[CONFIRMED 2026-09-09]** This system implements **Direction A — Broadsheet**,
which is now the **approved** visual direction. The canonical reference is Stitch
`projects/18276979792746509337`; the *Veritas Gazette* project
(`…11776752516184334334`) is **not** canonical and must not be implemented from.
See `20-visual-direction.md` §0.

**[OPEN — P3-01 / OQ-38]** One narrower thing is still unanswered: whether a
**pre-existing brand** exists. The type pairing, neutrals, spacing and density
model below are **fixed**. What remains provisional is the **identity layer** —
the name *“Today News”* and the masthead red `#9B2C1E`. Because §1.1 keeps that
red off every interactive element, replacing it touches the wordmark and masthead
rule and nothing else.

**One system, three densities** (`18` §4 G4). There is **no** separate visual
language for the CMS. Public and back-office share the same typefaces, the same
spacing scale and the same colour reasoning; they differ only in how much
information is packed into a given area.

---

## 1. Foundations

### 1.1 Colour

#### Neutrals — the substrate

| Token | Value | Contrast on `paper` | Use |
|---|---|---|---|
| `ink` | `#14161A` | 16.9:1 | Headlines, body text, primary UI text |
| `ink-secondary` | `#3D434B` | 10.2:1 | Standfirst, secondary body |
| `ink-muted` | `#5B6068` | 6.6:1 | Metadata, captions, timestamps, table labels |
| `ink-faint` | `#878C94` | 3.4:1 | Placeholders, disabled text — **never** body copy |
| `rule` | `#E3E1DC` | — | Hairlines, table rows, card edges |
| `rule-strong` | `#C9C6BF` | — | Input borders, focus-adjacent edges |
| `surface` | `#F7F6F3` | — | Page ground in the CMS; inset panels on public |
| `surface-sunken` | `#EFEDE8` | — | Table headers, code/quote blocks |
| `paper` | `#FFFFFF` | — | Article surface, cards, modals |

**[PROPOSED]** The neutrals are *warm* (a hint of yellow), not blue-grey. Cool
greys read as software; warm greys read as print. This single decision does more
than any other to keep the CMS from feeling like a SaaS dashboard.

#### Accent and semantic colours

**[PROPOSED]** The seed values are taken from the colours already used in the
Mermaid diagrams throughout `08`–`11`, so the design continues the documentation
rather than contradicting it.

| Token | Value | Meaning — and *only* this meaning |
|---|---|---|
| `accent` | `#2D5F8A` | Interactive: links, primary buttons, focus |
| `accent-hover` | `#234B6E` | Interactive, pressed/hovered |
| `accent-wash` | `#EAF0F6` | Selected row, active tab background |
| `masthead` | `#9B2C1E` | Publication identity only — the masthead rule and the wordmark. **Not** an interactive colour. |
| `success` | `#3A6F4A` | Published; a completed action |
| `success-wash` | `#EAF2EC` | — |
| `attention` | `#8A6A2D` | Needs a human: changes requested, validation warnings |
| `attention-wash` | `#F6F1E6` | — |
| `danger` | `#9B2C1E` | Rejected; destructive and irreversible actions |
| `danger-wash` | `#F7EBE9` | — |

**[CONFIRMED — `A11Y-02`]** Colour is never the only signal. Every state carries
a **text label**; every semantic colour has a wash variant so badges use dark
text on a tint rather than white text on a mid-tone.

#### Article state palette — the most load-bearing colours in the product

Derived from the seven states in `04` §2 and `11` §1.

| State | Label shown | Dot / badge | Wash | Rationale |
|---|---|---|---|---|
| `DRAFT` | **Draft** | `ink-muted` `#5B6068` | `surface` | Neutral. Nothing is happening yet. |
| `IN_REVIEW` | **In review** | `accent` `#2D5F8A` | `accent-wash` | In flight, with someone else. Not the editor's move. |
| `CHANGES_REQUESTED` | **Changes requested** | `attention` `#8A6A2D` | `attention-wash` | The one state that demands the editor act. |
| `APPROVED` | **Approved** | `#2F5C3E` | `success-wash` | **[P2-24]** Never visible in V1; defined so scheduling can be added without inventing a colour later. |
| `PUBLISHED` | **Published** | `success` `#3A6F4A` | `success-wash` | The only public state. |
| `REJECTED` | **Rejected** | `danger` `#9B2C1E` | `danger-wash` | Red, not amber. **Must not be confusable with Changes requested** (`09` §6). |
| `ARCHIVED` | **Archived** | `ink-faint` `#878C94` | `surface-sunken` | Retired, retained. |

**[CONFIRMED — `09` §6]** *Changes requested* and *Rejected* are separated three
ways, not one: different hue family (gold vs red), different badge treatment
(outline vs solid), and different available actions on the screen. An editor must
never mistake "fix this" for "we are not running this".

#### Dark mode

**[PROPOSED]** Out of scope for V1. The reading surface is paper-white by
deliberate choice (`18` §4 anti-goals). Tokens are named so a dark theme can be
added later without renaming anything.

---

### 1.2 Typography

**[PROPOSED]** Two families. A third (mono) appears in exactly one place.

| Role | Family | Fallback stack | Where |
|---|---|---|---|
| **Editorial** | `Newsreader` (serif) | `"Newsreader", Georgia, "Times New Roman", serif` | Headlines, standfirst, article body |
| **Interface** | `Inter` (sans) | `"Inter", -apple-system, "Segoe UI", Roboto, sans-serif` | Navigation, metadata, labels, all CMS chrome, forms, tables, buttons |
| **Numeric** | `IBM Plex Mono` | `"IBM Plex Mono", ui-monospace, monospace` | Article history timestamps and reference IDs **only** |

**Why a serif for editorial:** it is the fastest, cheapest signal that this is a
publication rather than an app, and it does the work of `18` §4 G1 — the design
survives with all colour removed.

**Why a sans for the interface:** metadata, table columns and form labels need to
read at 12–14px, where a text serif becomes muddy.

#### Type scale

Base `16px`, ratio ≈ 1.25 with editorial sizes stepped up further for display.

| Token | Size / line-height | Weight | Family | Use |
|---|---|---|---|---|
| `display-1` | 56 / 60 | 600 | Editorial | Article headline, desktop |
| `display-2` | 44 / 50 | 600 | Editorial | Lead story on homepage; article headline, tablet |
| `heading-1` | 34 / 42 | 600 | Editorial | Article headline, mobile; section page title |
| `heading-2` | 27 / 36 | 600 | Editorial | Card headline (lead); subheads inside a story |
| `heading-3` | 22 / 30 | 600 | Editorial | Card headline (standard); CMS page title |
| `heading-4` | 18 / 26 | 600 | Interface | CMS panel title, table group heading |
| `standfirst` | 21 / 32 | 400 | Editorial | Article summary; italic optional |
| `body-lg` | 19 / 32 | 400 | Editorial | **Article body.** The most important value in this table. |
| `body` | 16 / 26 | 400 | Interface | CMS body, form values, descriptions |
| `body-sm` | 14 / 22 | 400 | Interface | Table cells, dense CMS lists |
| `meta` | 13 / 18 | 500 | Interface | Byline, timestamp, section label, card metadata |
| `caption` | 13 / 20 | 400 | Interface | Image captions and credits |
| `label` | 12 / 16 | 600, `+0.06em`, uppercase | Interface | Field labels, status badges, table headers, section eyebrows |

**Mobile adjustments — [PROPOSED]**

| Token | Mobile value |
|---|---|
| `display-1` | 34 / 42 |
| `display-2` | 30 / 38 |
| `body-lg` | 18 / 30 — **never smaller**; reading comfort outranks fitting more on screen |

#### Typographic rules

1. **Measure:** article body is capped at **62–70 characters**. This, not the
   viewport, sets the reading column width.
2. **Never** justify text. Ragged-right, hyphenation off.
3. Only two weights per family in V1 (400 / 600). A third weight is a request,
   not a default.
4. Italic is editorial (standfirst, quotes, publication names). It is never a UI
   state.
5. `label` is the only uppercase style anywhere. Headlines are never uppercase.

---

### 1.3 Layout

| Token | Value | Use |
|---|---|---|
| `page-max` | `1280px` | Outer bound of any public page |
| `page-max-cms` | `1440px` | CMS — tables need the width |
| `measure` | `680px` | **Article reading column.** Fixed at every width above it (`08` §4). |
| `measure-wide` | `840px` | Article assets that may exceed the measure: hero image, pull quotes |
| `gutter` | `24px` desktop · `16px` mobile | — |

#### Grid

| Breakpoint | Range | Columns | Behaviour |
|---|---|---|---|
| `xs` | < 600 | 4 | Single-column everywhere. Nav collapses. Lists become cards. |
| `sm` | 600–899 | 8 | Two-up listings. CMS tables become compact. |
| `md` | 900–1199 | 12 | Full nav. CMS gains a persistent side navigation. |
| `lg` | 1200–1439 | 12 | Three-up listings. Article review shows story + decision panel side by side. |
| `xl` | ≥ 1440 | 12 | No further growth on public pages — `page-max` holds. CMS uses the extra width for table columns. |

**[CONFIRMED — `08` §4]** The article page does **not** stretch at `lg`/`xl`. The
measure stays fixed and the extra width becomes margin.

#### Spacing scale

4px base. Only these values are used.

`space-1` 4 · `space-2` 8 · `space-3` 12 · `space-4` 16 · `space-5` 24 ·
`space-6` 32 · `space-7` 48 · `space-8` 64 · `space-9` 96 · `space-10` 128

| Rhythm | Value |
|---|---|
| Paragraph spacing in an article | `space-5` (24) |
| Gap between cards in a listing | `space-5` (24) |
| Section break on a public page | `space-8` (64) desktop · `space-6` (32) mobile |
| CMS panel padding | `space-5` (24) desktop · `space-4` (16) mobile |
| Table row vertical padding | `space-3` (12) comfortable · `space-2` (8) compact |

#### Radius, borders, elevation

| Token | Value | Note |
|---|---|---|
| `radius-sm` | `3px` | Badges, inputs, buttons |
| `radius-md` | `6px` | Cards, panels, modals |
| `radius-full` | `999px` | Avatars only |
| `border` | `1px solid rule` | The default separator everywhere |
| `elevation-0` | none | **The default.** Public pages use rules, not shadows. |
| `elevation-1` | `0 1px 2px rgba(20,22,26,.06)` | Dropdowns, popovers |
| `elevation-2` | `0 8px 24px rgba(20,22,26,.12)` | Modals only |

**[PROPOSED]** Shadow is a *layering* device, never decoration (`18` §4 G3). A
card sitting on the page has a border, not a shadow.

#### Focus

```
focus-ring: 2px solid accent, offset 2px
```

**[CONFIRMED — `A11Y-05`]** Applied to every interactive element, in the CMS as
well as the public site. Never removed, never replaced by a colour change alone.

---

### 1.4 Image treatments

| Treatment | Ratio | Where |
|---|---|---|
| `img-hero` | 3:2 | Article featured image, up to `measure-wide` |
| `img-lead` | 16:9 | Lead story card on the homepage |
| `img-card` | 3:2 | Standard listing card |
| `img-thumb` | 1:1, 64px | CMS list rows, review queue |
| `img-social` | 1.91:1 (1200×630) | Link preview — `SEO-04` |

**Rules**

1. **[CONFIRMED — `PRF-08`]** Every image slot reserves its space before load. No
   layout shift, ever.
2. **[CONFIRMED — `A11Y-03` / `SEO-12`]** Alt text is a required field in the
   article editor. An image cannot be attached without it.
3. Caption and credit sit **below** the image in `caption` style, credit in
   `ink-muted`.
4. No text is ever set over an image.
5. No rounded corners on editorial photography — `radius-0`. Rounded photos read
   as UI; square-cornered photos read as press.
6. Placeholder while loading: flat `surface-sunken`. No shimmer, no spinner
   (`18` §4 G6).

---

## 2. Core components

Every component below is shared across all three areas. Variants change density,
never visual language.

### 2.1 Buttons

| Variant | Appearance | Use |
|---|---|---|
| `primary` | `accent` fill, white text | The single main action on a screen |
| `publish` | `success` fill, white text | **Approve & publish only.** Exists on exactly one screen, `PG-ADM-03`. |
| `secondary` | `paper` fill, `rule-strong` border, `ink` text | Save draft, Preview, Cancel |
| `tertiary` | No fill, no border, `accent` text | Inline, low-weight ("Add a source") |
| `destructive` | `paper` fill, `danger` border and text; fills `danger` on hover | Reject, Withdraw, Deactivate |
| `link` | Underlined `accent` text | Navigation inside prose |

**Sizes:** `sm` 32px · `md` 40px (default) · `lg` 48px (mobile primary actions).
**States:** default · hover · active · focus (ring) · disabled (`ink-faint` on
`surface`, no pointer) · **loading** (spinner replaces label, control is inert —
`12` §0 *Saving/working*).

**Rules**

1. **[CONFIRMED — `BR-05`]** The `publish` variant does not exist in any editor
   screen, in any state, including disabled. It is not a component the editor
   theme can render.
2. **[CONFIRMED — `18` §10.8]** Destructive and public actions are never
   icon-only. They always carry a text label.
3. One `primary` per screen. If two actions compete, one of them is `secondary`.

### 2.2 Inputs and forms

| Component | Notes |
|---|---|
| `text-field` | Label above (`label` style), 40px control, `rule-strong` border, help text below in `meta` |
| `textarea` | Same; auto-grows; used for feedback comments and rejection reasons |
| `select` | Native control styling on mobile; custom listbox at `md`+ |
| `combobox` | Type-ahead — used for section and source pickers |
| `file-upload` | Drop zone + button; shows filename, size, and **a required alt-text field** before the image counts as attached |
| `checkbox` / `radio` | 20px target, 44px hit area |
| `toggle` | Used only for genuinely binary settings; never for a workflow action |

**Validation — [CONFIRMED, `12` §0]**

- Errors appear **next to the field**, in `danger`, with an icon *and* text.
- Everything the person typed is preserved. Always.
- The form-level summary appears above the form and links to each bad field.
- **[CONFIRMED — `BR-07`, `BR-08`]** Request-changes and Reject cannot be
  submitted with an empty comment. The control is disabled *and* the server
  refuses — the interface reflects the rule, it does not implement it (`SEC-02`).

**Required fields** are marked on the label. Optional fields are marked
"(optional)" — never both conventions in one form.

### 2.3 Search

| Context | Treatment |
|---|---|
| Public masthead | Icon at `xs`; expands to full-width overlay with the field focused on open (`08` §4). Visible field at `md`+. |
| CMS list filter | Inline field above the table, `sm` size, with a clear control; filters as a form submission, not as-you-type |

**[CONFIRMED — `SEC-06`]** The search term is always echoed back safely.
**[PROVISIONAL — `OQ-19`]** Public search exists in V1 only if it is simple.

### 2.4 Navigation

| Component | Public | CMS |
|---|---|---|
| **Masthead** | Wordmark centred at `xs`, left at `md`+; `masthead` colour rule beneath; section nav below the rule | Wordmark + area label ("Editor" / "Newsroom"), user menu right |
| **Section nav** | Horizontal, scrollable at `xs`, full at `md`+; current section marked with a 2px `ink` underline | — |
| **Side nav** | — | Persistent at `md`+; collapses to a sheet at `xs`. Items: Dashboard, (Review queue — admin), My Articles / All Articles, and for admins Users, Sources, Categories |
| **Footer** | About · Contact · Editorial policy · Privacy · RSS. Nothing else. | Minimal: version, sign out |
| **Breadcrumbs** | Not used | Used where nesting exceeds one level: `Review queue › Article review`, `Users › Jane Okafor`, `Sources › Reuters` |

**[CONFIRMED — `SEO-09`]** No public-facing element ever links into the
back-office. The masthead carries no "staff sign-in" link.

### 2.5 Cards

| Variant | Composition |
|---|---|
| `card-lead` | 16:9 image · section eyebrow · `heading-2` headline · standfirst · byline + time |
| `card-standard` | 3:2 image · section eyebrow · `heading-3` headline · byline + time |
| `card-compact` | 64px thumbnail left · `heading-4` headline · time. Used in "More in this section" and CMS lists |
| `card-text` | No image · section eyebrow · headline · time. Fallback when a story has no picture |

**Rules:** the whole card is one link target. The headline is the accessible
name. Metadata order is always **section → headline → byline → time**.

### 2.6 Status badges

The single most reused component in the CMS.

```
[ • Changes requested ]
  ^   ^
  |   label, `label` style, ink-secondary on the state wash
  dot, 8px, the state colour
```

- Height 22px, `radius-sm`, wash background, 1px border in the state colour at
  25% opacity.
- `REJECTED` uses a **solid** `danger` fill with white text — the one exception,
  to guarantee it is never read as *Changes requested* (`09` §6).
- **[CONFIRMED — `A11Y-02`]** Always accompanied by its text label. The dot alone
  is never a badge.
- Sizes: `sm` (tables) and `md` (page headers).

### 2.7 Tabs

Used for **filters that partition one list** — never for navigation between
different things.

- Underline style, 2px `ink` on the active tab, `ink-muted` on inactive.
- Each tab carries a count: `Drafts 3`.
- **[PROVISIONAL — `P2-05`]** My Articles uses tabs for Drafts / In review /
  Changes requested / Published / Rejected, rather than five separate pages.
- At `xs` tabs become a horizontally scrollable strip; they never collapse into a
  dropdown, because the counts are the point.

### 2.8 Tables

| Element | Treatment |
|---|---|
| Header | `label` style, `surface-sunken` background, sticky at `md`+ |
| Row | 1px `rule` separator, no zebra striping, 48px comfortable / 40px compact |
| Row hover | `surface` background — **decorative only**, never the sole affordance (`08` §4: nothing depends on hover) |
| Primary cell | The headline, in `body` weight 500, as the link |
| State cell | Status badge, **always the second column** so it is scannable |
| Actions | Right-aligned; at most one inline action plus an overflow menu |
| Sort | Header is a button with an explicit direction indicator |

**[CONFIRMED — `12` Part D]** At `xs` every table becomes a stack of
`card-compact` rows with the state badge shown prominently. Tables never scroll
horizontally on a phone.

### 2.9 Modals and confirmation dialogs

- `radius-md`, `elevation-2`, max width 480px, centred; a bottom sheet at `xs`.
- Structure: title (`heading-4`) · plain-language consequence · actions right,
  confirm last.
- Focus is trapped, Escape closes, focus returns to the trigger on close.

**[CONFIRMED — `10` §3]** The confirmation for publishing states the public
consequence in words: *"This will be live on the public site immediately."*
A confirmation that only says "Are you sure?" is not acceptable for this action.

### 2.10 Dropdowns and menus

Overflow menus (`⋯`) carry secondary actions only. Any action that is public,
destructive or irreversible appears as a real button on the page, not inside a
menu.

### 2.11 Alerts and inline notices

| Variant | Use |
|---|---|
| `info` | Neutral context — "This story is locked while it is in review" |
| `attention` | Admin feedback panel; unsaved-changes warning |
| `success` | Confirmation after an action — "Published. Live on the site." |
| `danger` | Failures — "Autosave failed. Copy your work before leaving." |

Composition: 3px left rule in the semantic colour, wash background, icon + title
+ body. Dismissible only when informational; never when it reports a failure.

### 2.12 Pagination

**[PROVISIONAL — `PUB-06`]** Public listings use a **"More stories"** button
rather than infinite scroll: it keeps the footer reachable, is keyboard-operable,
and bounds what is loaded (`PRF-06`). CMS tables use numbered pagination with a
total count, because admins need to know how much there is.

### 2.13 Breadcrumbs

CMS only. `meta` style, `/` separators, current page not a link, truncated in the
middle at `xs`.

### 2.14 Empty, loading and error states

**[CONFIRMED — `12` §0]** Every list, table and page defines all three.

| State | Composition | Rule |
|---|---|---|
| Empty | `heading-4` fact · one sentence · one action | Never a blank area, never an illustration, never a permanent spinner |
| Loading | CMS: 3-row skeleton in `surface-sunken`. Public: **none** — pages arrive complete (`SEO-01`) | Skeletons never appear on public pages |
| Error | `danger` alert · plain apology · one route out | No technical detail, ever (`SEC-06`) |

---

## 3. Editorial components

Public-facing. These are what make the product read as a publication.

### 3.1 Headline
`display-1` desktop / `heading-1` mobile, Editorial family, weight 600, `ink`,
`-0.015em` tracking. One per page, the `<h1>`. Never uppercase, never over an
image, never below the fold.

### 3.2 Standfirst
`standfirst` style, `ink-secondary`, directly beneath the headline, capped at
`measure`. This is the same text used for listings, search results and the social
preview description — so it must read as a standalone sentence (`SEO-04`).

### 3.3 Article metadata block
One line at `md`+, two lines at `xs`, `meta` style, `ink-muted`:

```
By Jane Okafor  ·  Politics  ·  8 September 2026, 14:12  ·  Updated 16:40
```

- Author name is **plain text, not a link** — **[CONFIRMED]** author pages are
  `[FUTURE]` (`PG-PUB-F1`, `OQ-23`). Linking it would promise a page that does
  not exist.
- Section **is** a link (`PG-PUB-02`).
- "Updated" appears only when the story has been materially changed
  (**[PROVISIONAL — `OQ-09`]**).
- Timestamps are machine-readable as well as human-readable (`SEO-11`).

### 3.4 Author
Byline text only in V1. **[FUTURE]** avatar, bio and author page.

### 3.5 Category / section label
`label` style eyebrow above the headline on cards; a link on the article page.
One section per story (`OQ-18`).

### 3.6 Tags
**[FUTURE]** — not V1 (`06` §2.4). No tag component is designed, and no screen
reserves space for one.

### 3.7 Hero image
`img-hero`, full `measure-wide`, caption and credit beneath. Square corners.
Space reserved before load.

### 3.8 Article body
`body-lg` in the Editorial family, capped at `measure`, `space-5` between
paragraphs.

| Element | Treatment |
|---|---|
| Subhead | `heading-2`, `space-6` above / `space-3` below |
| Blockquote / pull quote | `measure-wide`, `heading-3` size, 3px `masthead` left rule |
| List | Standard markers, `space-2` between items |
| Inline link | `accent`, underlined — underline is not optional |
| Embedded image | Up to `measure-wide`, caption beneath |

**[CONFIRMED — `OQ-22`, resolved 2026-09-09]** The body is **structured blocks**
(`26-data-model-decisions.md` §3). The V1 block set is exactly: paragraph,
heading, image, quote, list, divider — which the components above already cover.
Inline formatting is limited to bold, italic and links. Richer media (video,
social embeds, galleries) is `[FUTURE]` (`06` §2.2); it will arrive as new block
types, so no component is designed for it now.

### 3.9 Sources block — [PROVISIONAL, OQ-24]
Beneath the body, above "More in this section". `label` heading "Sources", then a
list of name + external link, each marked as leaving the site. Collapsed at `xs`,
expanded at `md`+ (`08` §4).

### 3.10 Correction / update notice — [PROVISIONAL, OQ-09]
`attention` inline notice with a date and a link to the editorial policy page.
Placed after the body — **[NEW ISSUE P3-02]**, see `18` §6.1.

### 3.11 Related stories → **"More in this section"**
**[CONFIRMED naming decision]** Algorithmic *related stories* are `[FUTURE]`
(`06` §2.1) — they need tags or content analysis, and V1 has neither. What V1
shows is **other published stories in the same section**, newest first (`07`
Part 3, `08` §R-02). The component is therefore labelled *"More in Politics"*,
never *"Related stories"*, so the interface does not promise relevance it cannot
deliver. Three to four `card-compact` items, after the body.

### 3.12 Share
Native share at `xs` (prominent — most sharing happens on phones), copy-link plus
two or three platform links at `md`+. No counts, no tracking, no reader identity.

### 3.13 Article status
**Not a public component.** Readers only ever see published stories (`BR-01`), so
the public article page has no state indicator. Status badges are a CMS
component only.

---

## 4. CMS components

### 4.1 Dashboard cards

**[PROVISIONAL — `P2-06`]** Dashboard content was never specified in Phase 1;
these follow the minimums proposed in `09` §3 and `10` §2.

| Variant | Composition | Where |
|---|---|---|
| `stat-card` | Large numeral (`display-2`), `label` caption, optional qualifier | Admin: "12 waiting", "**3h 40m** oldest wait" |
| `attention-card` | `attention` left rule, count, and the items themselves — not just a number | Editor: "Changes requested (2)" — the most important thing on the editor's dashboard |
| `list-card` | Panel title + up to 5 `card-compact` rows + "See all" | "In progress", "Recently published" |
| `empty-card` | Fact + one action | "Nothing is waiting for review." |

**[PROVISIONAL — `10` §2]** *Oldest wait* is rendered at `display-2` — larger
than the count itself. An editor waiting three hours is the failure this
dashboard exists to prevent.

### 4.2 Article tables

Column order is fixed so the eye learns one pattern:

| Editor — My Articles | Admin — Review queue | Admin — All articles |
|---|---|---|
| Headline | Headline | Headline |
| **State** | **Waiting for** | **State** |
| Section | Author | Author |
| Last updated | Section | Section |
| — | Submitted | Updated / Published |
| — | Round *(2nd, 3rd…)* | Publisher |

**[PROVISIONAL — `10` §3]** The review queue is sorted **oldest first**, and that
ordering is stated on the page, not merely applied. *"Round"* flags a story sent
back before, which `10` §3 notes deserves a closer look.

### 4.3 Review queue item
`card-compact` plus: waiting-time chip (turns `attention` past a threshold),
author, section, and a round indicator. The whole row opens the review page —
there is no inline approve control anywhere. Deciding requires reading the story.

### 4.4 Editor (the writing surface)

```
┌────────────────────────────────────────────────────────────┐
│ ← My Articles          [ • Draft ]      Saved 14:12        │  status bar
├───────────────────────────────────────┬────────────────────┤
│ Headline            (Editorial, big)  │  Section      ▾    │
│ Summary             (standfirst)      │  Featured image    │
│                                       │   + alt (required) │
│ Body                (body-lg)         │   + credit         │
│                                       │  Sources      +    │
│                                       │  SEO title/desc    │
├───────────────────────────────────────┴────────────────────┤
│ [Save draft]  [Preview]              [Submit for review]   │  action bar
└────────────────────────────────────────────────────────────┘
```

- **[CONFIRMED — `BR-05`]** The action bar contains **Submit for review** as its
  primary action. There is no publish control, and the `publish` button variant
  is not available to this screen.
- Writing area uses the Editorial family at near-published size, so the editor
  sees roughly what a reader will.
- Metadata sidebar collapses beneath the body at `xs`.
- The status bar is persistent and always shows state + save status.
- **[PROVISIONAL — `OQ-26`]** Autosave indicator: `Saving…` → `Saved 14:12` →
  **`Autosave failed`** as a `danger` alert. **[CONFIRMED — `09` §3]** A silent
  failure is worse than no autosave at all.

### 4.5 Feedback panel — the component the whole workflow depends on

**[CONFIRMED — `09` §5]** Admin feedback appears **with the story**, not in a
separate inbox.

- `attention` panel pinned above the headline in the editor when the state is
  `CHANGES_REQUESTED`.
- Shows: admin name, time, and the comment in full.
- **[PROVISIONAL — `OQ-25`]** Earlier rounds are listed beneath the current one,
  collapsed, so a third revision can still see what round one asked for.
- At `xs` it sits **above** the story rather than beside it (`12` Part D) — this
  is the one mobile behaviour `18` §7 marks as must-work-perfectly.

### 4.6 Approval controls (admin, `PG-ADM-03` only)

```
┌──────────────────────────────┐
│ Decision                     │
│  [ Approve & publish ]       │  publish variant — green
│  [ Request changes ]         │  secondary; opens required comment
│  [ Reject ]                  │  destructive; opens required reason
│  ─────────────────────────── │
│  Edit directly   View history│  tertiary   [PROVISIONAL — OQ-02, OQ-11]
└──────────────────────────────┘
```

- Side panel at `lg`+; a sticky bottom bar at `xs` so all three decisions are
  reachable on a phone without zooming (**[CONFIRMED — `12` Part D]**).
- **Approve & publish** → confirmation modal stating the public consequence →
  `Publishing…` → success → return to queue (`10` §3).
- **Request changes** / **Reject** → the comment field expands inline; the submit
  control stays disabled until it is non-empty (`BR-07`, `BR-08`).
- **[PROVISIONAL — `P2-23`]** If the story was decided by another admin since the
  page loaded, the panel is replaced by an inline notice — the action is refused
  cleanly rather than failing.
- **[CONFIRMED — `BR-13`, resolved 2026-09-09]** Self-authored stories: the panel
  shows a "You wrote this story — another admin must approve it" note, and the
  **Approve & publish control is not rendered at all** (not merely disabled),
  matching how the editor area treats publishing. Request changes and Reject
  remain available. `OQ-29` is closed; `P2-01` is closed.

### 4.7 Revision / change indicators — [PROVISIONAL, OQ-26]
On a resubmitted story, a "Changed since last submission" toggle above the body.
Additions in `success-wash`, removals in `danger-wash` with a strikethrough.
**[CONFIRMED — `10` §3]** Without this, every review round means re-reading the
whole story.

### 4.8 Article history — [PROVISIONAL, OQ-11]
Append-only vertical list: actor · action · from-state → to-state · timestamp ·
comment. Timestamps in the Numeric family. Visually read-only — no controls, no
edit affordance anywhere on the component (`SEC-11`).

### 4.9 User, source and category rows
Standard tables. Notable states carried from `12`:

- **[CONFIRMED — `BR-14`]** The last active admin's *deactivate* and *change
  role* controls are **removed, with a reason shown** — not merely disabled, and
  never merely warned about.
- **[PROVISIONAL]** A source cited by a published story shows "Used by 4 stories"
  and cannot be deleted, only edited.
- **[NEW ISSUE `P2-21`]** A category containing published stories offers
  *deactivate*, not *delete*.

---

## 5. Motion

**[PROPOSED]** Deliberately minimal (`18` §4 G6).

| Purpose | Duration | Easing |
|---|---|---|
| State feedback (hover, focus, press) | 120ms | ease-out |
| Panel / sheet open | 200ms | ease-out |
| Modal | 160ms | ease-out |

Nothing else animates. No page transitions, no scroll effects, no entrance
animations, no carousels. `prefers-reduced-motion` removes all of the above.

---

## 6. Token reference

Machine-readable summary for Stitch and Figma. Names here are authoritative — a
component that needs a value not in this list needs a system change, not a
local override.

```
COLOUR
ink #14161A · ink-secondary #3D434B · ink-muted #5B6068 · ink-faint #878C94
rule #E3E1DC · rule-strong #C9C6BF
paper #FFFFFF · surface #F7F6F3 · surface-sunken #EFEDE8
accent #2D5F8A · accent-hover #234B6E · accent-wash #EAF0F6
masthead #9B2C1E
success #3A6F4A · success-wash #EAF2EC
attention #8A6A2D · attention-wash #F6F1E6
danger #9B2C1E · danger-wash #F7EBE9

STATE
draft #5B6068 · in-review #2D5F8A · changes-requested #8A6A2D
approved #2F5C3E · published #3A6F4A · rejected #9B2C1E · archived #878C94

TYPE
editorial "Newsreader", Georgia, serif
interface "Inter", -apple-system, "Segoe UI", sans-serif
numeric   "IBM Plex Mono", monospace
display-1 56/60 · display-2 44/50 · heading-1 34/42 · heading-2 27/36
heading-3 22/30 · heading-4 18/26 · standfirst 21/32 · body-lg 19/32
body 16/26 · body-sm 14/22 · meta 13/18 · caption 13/20 · label 12/16 upper

SPACE   4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128
RADIUS  sm 3 · md 6 · full 999 · photos 0
LAYOUT  page-max 1280 · page-max-cms 1440 · measure 680 · measure-wide 840
BREAK   xs <600 · sm 600 · md 900 · lg 1200 · xl 1440
FOCUS   2px accent, 2px offset
```

---

## 7. What this system deliberately omits

Stated so nobody has to wonder whether it was forgotten:

| Omitted | Why |
|---|---|
| Tag component | Tags are `[FUTURE]` (`06` §2.4) |
| Author-page components | `[FUTURE]` — `PG-PUB-F1`, `OQ-23` |
| "Related stories" recommender UI | `[FUTURE]`. V1 shows *More in this section* — §3.11 |
| Comment, newsletter, paywall components | `[FUTURE]`, each a separate product |
| Scheduling controls | `[FUTURE]` — `OQ-07`. The `APPROVED` badge is defined; no date picker exists |
| Media library | `[FUTURE]` — one image attaches to a story directly |
| Notification centre | `[FUTURE]` — `PG-EDT-F1`. V1 uses in-app counts and badges |
| Dark theme | Not V1 — tokens are named to allow it later |
| Reader-account components | No reader identity exists in V1 |
