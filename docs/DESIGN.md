# DESIGN.md — dhakamythos design system

> **Governing note.** `docs/UNVEIL-GRAMMAR.md` supersedes the token, type,
> and motion tables below wherever they differ — it carries the measured
> values now implemented in `src/app.css`. This file remains authoritative
> for project vocabulary, component anatomy, and content/edge-case rules.

## Direction

Light, near-empty field where the works carry all color. One grotesque
typeface used at two extremes: oversized display and small tracked-caps
metadata. Image-led cards on a horizontal deck; choreographed but disciplined
motion. The **signature element** is the Deck + container transform (a card
physically becomes its case page). Everything else stays quiet so that one
move lands. This adapts the *grammar* of unveil.fr in original form — no
copy, imagery, code, or assets from it, ever.

Mobile is the primary canvas. Every component below is specified
mobile-first; desktop rows describe enhancements, not the base.

## Tokens (`src/app.css`)

| Token | Value | Usage |
|---|---|---|
| `--ground` | `#FAFAF7` | page field |
| `--ink` | `#141414` | text, lines on hover states |
| `--muted` | `#6E6E68` | metadata, captions, counters |
| `--line` | `#E4E4DF` | hairline rules, index row dividers |
| `--overlay` | `rgba(20,20,20,.94)` | contact overlay scrim |
| `--gutter` | `clamp(16px, 4vw, 48px)` | page side margins |
| `--space-1…10` | 4 8 12 16 24 32 48 64 96 128 px | spacing scale |
| `--radius` | `0` | sharp everywhere |
| `--dur-fast` | `240ms` | hovers, fades |
| `--dur-base` | `600ms` | reveals, morph |
| `--dur-slow` | `900ms` | page transitions |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | default (expo-out) |
| `--ease-inout` | `cubic-bezier(0.83, 0, 0.17, 1)` | overlays, exits |
| `--stagger` | `70ms` | sequenced reveals |
| z-scale | nav 50 · overlay 60 · transition 70 · cursor 80 | stacking |

No accent color at launch. Artwork is the accent. (Reserve `--accent` token,
unset.)

## Type system

**Family: Geist** (variable, OFL, one WOFF2). Swap candidates if the eye
disagrees after M2: Archivo, Inter Tight — change one token, nothing else.

| Role | Size | Weight | Tracking | Leading | Used for |
|---|---|---|---|---|---|
| `display` | `clamp(2.6rem, 9vw, 7.5rem)` | 500 | −0.02em | 0.95 | work titles, page titles |
| `title` | `clamp(1.4rem, 4vw, 2.2rem)` | 500 | −0.01em | 1.1 | card titles, section heads |
| `body` | `1rem` | 400 | 0 | 1.6 | standfirsts, articles (max-width 68ch) |
| `meta` | `0.75rem` | 500 | +0.08em, caps | 1.2 | eyebrows, tags, credits roles, nav |
| `counter` | `0.75rem` tabular | 400 | +0.04em | 1 | deck position, index numbering |

Article body (Text works): `body` role at `1.0625rem`, measure 62–68ch,
paragraphs spaced `--space-4`, no first-line indent.

## Vocabulary (use these exact terms in prompts, commits, components)

- **Deck** — homepage rail of work Cards; horizontal, snap-scrolled, loops.
- **Card** — one work's tile: cover media + eyebrow (year · tags) + title.
- **Case page** — a single work's full page (`/[slug]`).
- **Index view** — the all-text catalogue (`/index`): Year · Work · Tags rows.
- **Wall** — dense small-thumbnail archive grid (`/archive`).
- **Tags** — compound taxonomy per work, rendered `Medium / Descriptor / …`.
  No chapter pages exist; tags filter the Index view.
- **Container transform** — Card morphs into its Case page (View Transitions).
- **Page transition** — exit/enter choreography between routes.
- **Reveal** — element animates in on viewport entry.
- **Eyebrow** — small caps meta line above a title.
- **Standfirst** — the one-to-two-sentence intro under a Case title.
- **Video chrome** — custom text controls: Play · Sound · Fullscreen.
- **Credits block** — role → names table at Case foot.
- **Cursor label** — desktop-only cursor word ("View", "Drag"). Never load-bearing.
- **Counter** — "07 / 36" position marker.
- **Contact overlay** — full-screen dialog, no route.
- **Fat footer** — contact, social, legal as a designed block.

## Components

### Deck (`/`)
Anatomy: horizontal scroller of Cards + Counter + scroll hint on first visit.
| Aspect | Mobile (base) | Desktop ≥1024 |
|---|---|---|
| Card width | `85vw`, snap-center, gap `--space-4` | `~38vw`, snap-start, drag + wheel→horizontal |
| Scrolling | native momentum + `scroll-snap-type: x mandatory` | same engine; inertia layer allowed per CLAUDE.md rule 2 |
| Loop | list tripled, silent re-center at clones | same |
| Keyboard | — | ←/→ move one card; Enter opens |
Empty state (no published works): centered meta line "First works arriving
soon" + Contact link. Loading: LQIP covers, no spinners.

### Card
Anatomy: cover (4:5 mobile, 3:4–16:10 desktop per asset hotspot) → eyebrow
(`YYYY · Tag / Tag`) → title (2-line clamp, ellipsis).
| State | Behavior |
|---|---|
| Default | cover at scale 1, LQIP→sharp fade `--dur-fast` |
| Hover (pointer:fine) | media scales 1.04 over `--dur-base --ease-out`; Cursor label "View" |
| Touch | no hover dependency — tap navigates, brief 0.98 press scale |
| Focus | 2px `--ink` outline, offset 4px |
| Has loop video | loop (muted, ≤3MB) plays when card is mostly in view, pauses off-view; poster first on `saveData`/2g |
| Missing cover | `--ink` block with title knocked out in `--ground` |

### Case page (`/[slug]`)
Order: eyebrow (year · tags) → display title → standfirst → hero (Video
chrome, image, or none) → gallery (full-bleed mobile, alternating widths
desktop) → body (Text works) → Credits block → Next-work link → Fat footer.
Interactive works: standfirst + full-bleed mount of the piece (dynamically
imported); an "Enter fullscreen" affordance if the piece supports it.
| Element | Motion |
|---|---|
| Arrival from Card | container transform on the cover; title reveals with `--stagger` |
| Gallery items | reveal: opacity 0→1 + translateY 24px→0, `--dur-base` |
| Next-work link | full-width row; hover slides title 8px, cursor "Next" |

### Video chrome
Text buttons over media: `Play` toggle, `Sound off/on`, `Fullscreen`. Meta
role type, `--ground` on media, mix-blend safe. Tap targets ≥ 44px. Native
`<video>` for self-hosted loops; facade + on-tap iframe for embeds
(per PERFORMANCE.md). Never autoplays with sound.

### Index view (`/index`)
Row: `Year · Title · Tags` on a `--line` divider; tag chips toggle filters
(multi-select, URL `?tags=` synced). Mobile: two-line row (year+tags meta
over title). Hover (desktop): row text shifts to `--ink`, 12px slide.
Empty filter result: "Nothing under this tag yet — clear filters."

### Wall (`/archive`)
CSS-columns masonry of small scraps (≤256px thumbs), lazy except first
viewport, tap opens lightbox with note/date. Infinite-feeling but paginated
fetch at build (all scraps prerendered; images lazy).

### Contact overlay
Full-screen `--overlay`, `--ground` text. Opens `--dur-base --ease-inout`
rising; Esc/scrim/✕ closes. Focus trapped; trigger regains focus on close.
Content: email, Instagram, city line.

### Nav
Wordmark (→ Deck) · Index · Archive · Collective · Open Calls · Contact
(overlay trigger). Mobile: wordmark + Contact persistent, rest behind a
full-screen menu (staggered reveal, `--dur-base`). Desktop: single row, meta
role type. Nav never sticks over the deck during card scroll on mobile.

### Open calls (`/open-calls`, `/open-calls/[slug]`)
List: status pill (`Open` ink-on-ground inverted, `Closed` muted) + deadline.
Detail: brief (body type) + embedded Tally form (lazy iframe on scroll-near)
+ deadline meta. Closed calls keep the page, swap form for "Closed — results"
linking result works.

## Motion grammar (single source of truth)

| Element | Trigger | Animation | Duration | Easing |
|---|---|---|---|---|
| Card cover | hover | scale 1 → 1.04 | `--dur-base` | `--ease-out` |
| Card → Case | navigate | container transform (cover morphs) | `--dur-base` | browser VT default |
| Case title | arrival | per-line rise 100%→0 + fade | `--dur-base`, `--stagger` | `--ease-out` |
| Reveals | 20% in view | opacity + translateY 24→0, once | `--dur-base` | `--ease-out` |
| Overlay | open/close | translateY 100%→0 / reverse | `--dur-base` | `--ease-inout` |
| Route fallback | unsupported VT | crossfade | `--dur-fast` | linear |
| Reduced motion | always | everything above → opacity-only ≤ `--dur-fast`; loops → posters | | |

## Edge cases

Long titles: clamp 2 lines on Cards, never on Case pages. No credits: omit
block. No gallery: hero only. Slow connection (`saveData` / 2g): posters
replace loops, hero embeds stay facades. 404: display-type "Lost in the
myth" + Deck link.

## Accessibility floor

Focus visible everywhere (2px `--ink`). Deck operable by keyboard and
announced as a list ("Work 7 of 36"). Alt text schema-enforced. Body
contrast ≥ 4.5:1 (`--ink`/`--muted` on `--ground` pass). Hit targets ≥ 44px.
Reduced-motion map above is mandatory, not optional.
