# PERFORMANCE.md — dhakamythos budgets and media rules

Reference device: mid-range Android on throttled 4G (Dhaka reality). These
are **gates, not goals** — a feature that misses them doesn't merge.

## Budgets

| Metric | Budget | Measured by |
|---|---|---|
| LCP | < 2.5s | `npm run perf` (Lighthouse mobile, throttled) |
| CLS | < 0.05 | same |
| INP | < 200ms | same + manual deck scroll check |
| First-load JS | ≤ 100KB gzipped | build output |
| Per-route extra JS | ≤ 60KB gz (interactive pieces ≤ 150KB) | build output |
| Lighthouse perf | ≥ 85 | ship gate per milestone |
| Fonts | 1 file, ≤ 60KB WOFF2 | network panel |

## Images (Sanity CDN does the work)

- Always through `@sanity/image-url` with hotspot crops; every image ships as
  a webp `<source>` + fallback `<img>` pair (`pictureProps`).
- `srcset` is a DPR ladder per role (grammar §7.2): fixed logical box —
  thumb 256 q75 · card/body 720 q80 · hero 2048 q90 · lightbox 2048 q75 —
  at DPR steps `[.25,.5,.75,1,1.5,2,3,4]`, sub-50px and beyond-intrinsic
  candidates dropped, `src` = the dpr-1 width. OG stays `1200×675`.
- Explicit `width`/`height` (or aspect-ratio) on every `<img>` — CLS rule.
- LQIP: render `asset.metadata.lqip` as the background, fade in the real
  image (`--dur-label`).
- `loading="lazy"` everywhere except the first two Deck cards and the Case
  hero (those get `fetchpriority="high"`).

## Video

- **Card loops:** muted, `playsinline`, looped, ≤ 3MB WebM (H.264 MP4
  fallback), uploaded to Sanity as files. Play only while the card is mostly
  in view (IntersectionObserver), pause off-view. Poster always set.
- **Films:** never self-hosted. Facade pattern — poster + play affordance,
  iframe (Vimeo/YouTube, `dnt`/`youtube-nocookie`) injected on tap only.
- `navigator.connection.saveData` or `effectiveType` 2g → posters only,
  loops never start.

## Fonts

One variable WOFF2 (Geist), latin subset, self-hosted, `preload`,
`font-display: swap`, metric-matched fallback (`size-adjust`) so swap causes
no CLS. No second family. No icon fonts — inline SVG.

## JS discipline

- Prerender everything; hydrate only what moves (deck logic, overlay, video
  chrome, filters, pieces).
- GSAP: core only, imported where used; no ScrollSmoother. Inertia layer
  (if used at all) loads behind a `(pointer: fine)` + desktop-width check.
- Interactive pieces: `import()` on their route, `requestIdleCallback`
  warm-up allowed, nothing global.
- Prefetch case pages on hover/touchstart of their Card
  (`data-sveltekit-preload-data="hover"`); Deck never preloads more than the
  next 2 neighbors.

## Delivery

- All routes static at build; Sanity publish → Vercel deploy-hook rebuild
  (wire in M5). Content changes go live in ~1 min without code.
- Static assets `cache-control: immutable`; HTML revalidated.
- Analytics: Vercel built-in only (zero client JS) unless asked.

## Ship-gate checklist (run at the end of every milestone)

1. `npm run build` clean, bundle sizes within budget table.
2. `npm run perf` ≥ 85; LCP/CLS/INP within budget.
3. Real-device pass: deck scroll smooth, no input delay, loops behave.
4. Keyboard + reduced-motion pass.
5. Network panel: no asset > 350KB on first view, fonts = 1 request.
