# CLAUDE.md — dhakamythos

Site for the dhakamythos art collective: works for consumption (text, photo,
video), works for interaction (bespoke pieces), and open calls for
collaboration. One site hosts everything. **Mobile-first, full-cinematic,
free-tier.**

## Stack (fixed — do not substitute)

| Layer      | Choice                                        |
|------------|-----------------------------------------------|
| Framework  | SvelteKit (Svelte 5), full prerender          |
| Styling    | Tailwind + CSS custom properties (tokens)     |
| Motion     | GSAP (choreography) + native View Transitions |
| CMS        | Sanity (free plan), embedded `studio/`        |
| Images     | Sanity CDN via `@sanity/image-url`            |
| Host       | Vercel Hobby (`adapter-vercel`)               |

## Read before any feature work

`docs/UNVEIL-GRAMMAR.md` — **the governing visual spec**: every token, metric,
and motion value comes from it; it wins over DESIGN.md wherever they differ.
`docs/DESIGN.md` (vocabulary, components) · `docs/SITEMAP.md`
(routes, page anatomies) · `docs/PERFORMANCE.md` (budgets, media rules).
These documents win over your defaults. Tokens, not values — if a color or
duration isn't a token, add the token first.

## Golden rules (the cinematic budget — MUST)

1. Animate **only** `transform` and `opacity`. Nothing animates `width`,
   `height`, `top`, layout, or filters on scroll paths.
2. Inertia/smoothed scrolling (Lenis or similar) mounts **only** on
   `(pointer: fine)` devices. Touch keeps native momentum. No exceptions.
3. Card → case-page morph uses the **View Transitions API** with a crossfade
   fallback where unsupported. GSAP handles intra-page reveals only.
4. The Deck scrolls on **native CSS scroll-snap**. GSAP may decorate
   (parallax inside cards, reveals); it never owns scroll position.
5. `prefers-reduced-motion: reduce` → all non-essential motion off,
   transitions become opacity-only, loops become posters.
6. Every image/video declares intrinsic dimensions. CLS budget is ~0.
7. First-load JS ≤ 100KB gzipped. Each interactive piece is dynamically
   imported on its own route only — its bundle never ships elsewhere.
8. No new dependency without a one-line justification in the commit message.
9. Autoplaying media is always muted; sound starts only on user action.
10. Fonts never block render: one WOFF2 (NB International Pro 400,
    licensed), preloaded, `font-display: swap`, metric-matched fallback.

## Conventions

- `src/lib/components/` PascalCase Svelte components, one per file.
- `src/lib/pieces/<slug>/` — interactive works, each self-contained,
  lazy-loaded by the case route.
- `src/lib/sanity/` — client, image URL builder, GROQ queries.
- Design tokens live in `src/app.css` as `--*` custom properties; Tailwind
  reads them. Never hardcode a hex or ms value in a component.
- Copy style: sentence case, active voice, plain verbs. Buttons say what they
  do ("View work", "Submit to this call").

## Commands

```
npm run dev          # site
npm run studio       # sanity studio (cd studio && npm run dev)
npm run build && npm run preview
npm run perf         # lighthouse mobile, throttled — see PERFORMANCE.md
```

## Definition of done (every feature)

Builds clean · checked at 390px and 1440px · keyboard pass (tab order, focus
visible, deck arrow keys) · `npm run perf` ≥ 85 · zero console errors ·
reduced-motion checked once per milestone.

## Env

`PUBLIC_SANITY_PROJECT_ID` · `PUBLIC_SANITY_DATASET=production` ·
(M5) `SANITY_REVALIDATE_SECRET` for the publish webhook.

## Never

- Never copy text, images, code, or assets from unveil.fr or any reference
  site — its design grammar is the inspiration, every artifact here is original.
- Never commit secrets or `.env`.
- Never add analytics beyond Vercel's built-in without being asked.
- Never let a quota-relevant asset (video file > 3MB) into Sanity — embeds only.
- Never block the deck render on anything below the fold.
