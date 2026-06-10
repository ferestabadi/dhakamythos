# SITEMAP.md — dhakamythos information architecture

All routes prerendered. Taxonomy is **tags, not chapter pages** — sections
live in the nav, filtering lives in the Index view.

## Routes

| Path | Name | Source | Notes |
|---|---|---|---|
| `/` | Deck | all `work` docs, newest first | homepage; horizontal card rail |
| `/index` | Index view | all `work` docs | Year · Title · Tags, tag filters via `?tags=` |
| `/archive` | Wall | `archiveScrap` docs | dense thumbnail grid + lightbox |
| `/collective` | Collective | `siteSettings` + `member` docs | manifesto, members, press |
| `/open-calls` | Open calls | `openCall` docs | open first, then closed |
| `/open-calls/[slug]` | Call detail | one `openCall` | brief + embedded Tally form |
| `/[slug]` | Case page | one `work` | text, photo, video, and interactive works |
| `/legal/[slug]` | Legal | `legalPage` docs | privacy, terms as needed |
| Contact | overlay | `siteSettings` | dialog, **no route** |
| `/404` | Not found | — | display title + Deck link |

Reserved slugs (`index`, `archive`, `collective`, `open-calls`, `legal`) are
blocked in the schema's slug validation.

## Page anatomies (mobile-first; details in DESIGN.md)

- **Deck** — Cards at 85vw, snap; Counter bottom-left; nav floats above;
  first-visit swipe hint (meta type, fades after first scroll).
- **Index** — filter chips row (horizontally scrollable on mobile) → rows.
- **Archive** — 2-col scrap grid mobile / 4–5-col desktop; lightbox shows
  scrap + note + date.
- **Collective** — manifesto in body type (68ch) → members list (name, role,
  link) → press list → Fat footer.
- **Case page** — eyebrow → display title → standfirst → hero → gallery →
  body (Text works only) → Credits block → Next-work row → Fat footer.
  Next-work = next-newest `work`, wrapping at the end.
- **Call detail** — eyebrow (`Open until {deadline}` or `Closed`) → title →
  brief → form (open) or results links (closed).

## Interactive works convention

1. The piece is a self-contained Svelte component:
   `src/lib/pieces/<componentKey>/index.svelte` (+ its own assets/modules).
2. Its CMS `work` doc sets `interactive: true` and `componentKey`.
3. The case route dynamically imports the piece **only when**
   `interactive === true` — its bundle never ships on any other page.
4. The piece renders full-bleed inside the case page below the standfirst.
   If it manages its own viewport (maps, canvases) it exposes an
   "Enter fullscreen" affordance and traps focus while fullscreen.
5. Pieces accepting audience input (memory-map pattern) submit through a
   serverless endpoint or an embedded form at launch — no database on the
   free tier; revisit if a piece needs live shared state.

## SEO / sharing

Title pattern `"{Work} — DHAKAMYTHOS"`, root `"DHAKAMYTHOS"`. Meta
description = standfirst. OG image = cover at 1200×675 via Sanity CDN params.
Generate `sitemap.xml` and `robots.txt` at build. Every page has exactly one
`h1` (the display title).
