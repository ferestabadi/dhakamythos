# UNVEIL GRAMMAR — measured design-language specification

A 1:1, implementation-ready spec of unveil.fr's design language, for rebuilding it as
**original code** in the dhakamythos SvelteKit site. Every value below was measured from
the production CSS, prerendered HTML, beautified JS chunks, and headless-browser probes
(evidence trail: `/tmp/unveil-spec/{css,home,pages,js,visual}.md`, `probe.json`,
`measure.json`; screenshots in `/tmp/unveil-spec/shots/`, crops copied to
`docs/*.png` in this repo). This document is self-sufficient — an implementer never
needs the mirror.

Reference stack on the source site (all reimplementable): SvelteKit + Svelte 5,
Tailwind v4.1, GSAP 3.13 core only (no plugins), three.js r173, ayamflow virtual-scroll,
hls.js 1.6.13, hand-rolled rAF manager. No Lenis, no ScrollTrigger, no Swiper, no lottie.

---

## 1. Design DNA

1. **One canvas, one ink** — everything happens on `#fafafa` with pure `#000`; hierarchy is opacity (100/30/13/3%), never hue, size, or weight.
2. **One type size** — 10.5px uppercase grotesque, single weight 400, carries the entire site; there are no headings anywhere.
3. **Negative space is the brand** — home is ~93% empty field; studio pins content to two corners and leaves the center void; research gutters are nearly as wide as its images.
4. **The page never scrolls; layers do** — `html,body { overflow:hidden }`, every route is a fixed full-viewport sheet stacked by explicit z-index, scrolling internally.
5. **All motion is opacity** — zero CSS keyframes; entrances are JS-staggered fades (power1.inOut, 0.25–1s); the only transforms live inside the WebGL deck and button hovers.
6. **Two signature curves, one signature duration** — 500ms easeOutCubic `(.215,.61,.355,1)` for opacity, easeOutExpo `(.19,1,.22,1)` for transform; expo.out/expo.inOut in JS.
7. **Frosted-glass chrome** — buttons and overlays are translucent currentColor washes (3% fill, 13% hairline) over `backdrop-filter: blur`, never solid surfaces.
8. **One left axis** — x = 14px aligns all body text, lists, footers, and legal links on every page and breakpoint; only the research grid bleeds to x = 0.
9. **Hardware-store crops** — imagery is hard-cropped, border-less, caption-less, radius-less; aspect ratio is per-asset data (`style="aspect-ratio:"`), 4:5 dominant.
10. **WebGL as homepage** — the home route's only content is a telephoto-compressed 3D card rail on canvas; the DOM ships nothing but chrome.

---

## 2. Tokens

### 2.1 Color

| Token | Value | Role |
|---|---|---|
| ground | `#fafafa` | html background, fixed base layer, WebGL clearColor, preloader, white route-flash, gradient endpoints |
| ink | `#000` | global text color (`html { color: #000 }`) |
| ink-inverse | `#fff` | text over imagery / dark theme state |
| sheet | `#ffffffb3` (white @ 70%) | frosted overlays (contact backdrop, research lightbox) — always paired with `backdrop-filter: blur` |
| everything else | `currentColor` at an opacity step | see scale below |

**Opacity scale (the real palette):**

| Opacity | Role |
|---|---|
| `1` | active / hovered / current-page text |
| `.75` | corner-fade gradient layer |
| `.3` | resting state of every label, link, and secondary text; scrub-bar track |
| `.13` | button hairline border (`::before`, 1px currentColor) |
| `.03` | button fill wash (`::after`, currentColor) |
| `0` | pre-reveal state of every animated element |

**Corner-fade gradient** (desktop ≥768px only, fixed over the canvas):
`linear-gradient(45deg, #fafafa 0%, #fafafa 1%, transparent 25%, transparent 75%, #fafafa 100%)`,
element opacity `.75`. Opaque page-color corners melting to clear across the middle 50%.

**Theme switching:** a single store (default `"black"`) drives header text color via a
0.5s power1.inOut color tween — light theme = white text over imagery. No dark mode.

**Color-adjacent effects:** `mix-blend-exclusion` (cursor label over imagery),
`filter: saturate(0)` (cursor label text), `.blur` = `filter: blur(8px)` (contact scrim).

### 2.2 Type scale

Single typeface, single weight (400), uppercase by global default
(`html { text-transform: uppercase }`; prose opts out via `normal-case`).
**The scale is breakpoint-invariant — no responsive font-size overrides exist.**
Root font-size 16px. `-webkit-font-smoothing: antialiased`, `text-rendering: optimizeLegibility`.

| Role | Size | Line-height | Tracking | Weight | Case | Where |
|---|---|---|---|---|---|---|
| meta / body ("text-11") | 10.5px (.65625rem) | 13px (1.238) | .015em | 400 | UPPER (inherited) | nav-adjacent labels, lists, legal links, footers |
| prose paragraph | 10.5px | 13px | .015em | 400 | Sentence (`normal-case`) | studio mission, research closing statement |
| button / nav label | 10.5px | 1.05 (11.025px) | .015em | 400 | UPPER (explicit) | `.button` labels, header cells, contact pills |
| micro label ("text-8") | 8px (.5rem) | 8px (1.0) | .1em | 400 | UPPER | smallest annotations (only tracked-out style) |
| viewer / counter label | 11px (.6875rem) | 1 | normal | 400 | UPPER (explicit) | video controls bar, preloader %, lightbox chrome |
| list value lines | 10.5px | 1.25 (`leading-[1.25]`) | .015em | 400 | UPPER | studio block lines |
| display block | runtime-sized (JS) | 1.0909090909 (12/11) | — | 400 | UPPER | project-detail display text |
| display paragraph | runtime-sized (JS) | 1.0761904762 (113/105) | — | 400 | Sentence | half-viewport closing panels |
| body base (unused) | 16px | 24px | normal | 400 | — | Tailwind preflight default, effectively never seen |

The `®` mark renders as `<small>` (preflight 80%) nudged `-0.5px` up, beside the wordmark.
Bold does not exist (only synthetic `b,strong { font-weight: bolder }`, unused).

### 2.3 Spacing

Base unit: 4px (`--spacing: .25rem`). The recurring rhythm:

| Value | Role |
|---|---|
| 2px | nav/pill cell gaps (`gap-x-0.5`), hairline grid gaps, studio label-column collapse width |
| 4px | page frame — header inset (`p-1`) |
| 14px | **the global left text axis** (`px-[14px]`); button label x-inset; legal nav x |
| 11px | legal nav offset from bottom edge (`bottom-[0.6875rem]`) |
| 16px / 14px | contact pill padding (`px-4 py-3.5`) |
| 10px / 40px / 7px | header cell padding x / top / bottom (label sits at cell bottom) |
| 12px | legal-link gaps (`gap-x-[0.75rem]`) |
| 20px | studio content stack gap (`gap-y-5`) |
| 40px | paragraph → first list block (20px gap + `mb-5`) |
| 56px | mobile figure offset (`mt-14`) |
| 61px | research grid gap, base (both axes, `3.8125rem`) |
| 99px / 95px | research grid gap-x / gap-y at ≥1024px |
| 7vw | research gap-x at ≥1536px (goes fluid) |
| 144px | content top padding, mobile (`pt-[9rem]`) |
| 260px | content top padding, ≥640px (`.pt-half` = 16.25rem) |
| 12.5svh | section bottom padding ≥640px (`.pb-quarter`) |
| 50svh, min 320px | half-viewport closing-section module |
| 124px / 144px / 64px / 80px | section paddings seen: `py-[7.75rem]`, `pt-[9rem]`, `py-16`, `py-20` |

Optical-nudge idiom (use deliberately): `mt-[-0.5px]`, `translate-y-[1px]`,
`translate-y-[1.5px]` (pill label optical centering), `pt-[1px]`,
`inset-[-1px]` + `calc(100%+2px)` (1px image outset to kill edge seams).

Radii: **6px** (`rounded-[0.375rem]`, buttons/cards) and `rounded-full` (pills). Nothing else.

Blur tokens: button backdrop **24px**; sheet backdrop **20px** → **40px** at ≥768px;
scrim filter **8px**.

### 2.4 Duration + easing table (complete motion vocabulary)

CSS curves:

| Name | Curve | Duration | Applied to |
|---|---|---|---|
| label fade | `cubic-bezier(.215,.61,.355,1)` (easeOutCubic) | 500ms | all label/link opacity .3 ↔ 1 |
| icon grow | `cubic-bezier(.19,1,.22,1)` (easeOutExpo) | 500ms | button `svg` transform, hover `scale(1.05)` |
| micro | `cubic-bezier(.4,0,.2,1)` | 150ms | Tailwind `.transition` default |
| controls bar | `ease-out` | 250ms | video controls opacity |

JS (GSAP) eases — the complete set used anywhere: `expo.out`, `expo.inOut`,
`power1.inOut`, `power2.out`; plus Svelte `quadInOut` for the research lightbox.

| Motion | Ease | Duration | Delay | Stagger |
|---|---|---|---|---|
| preloader % fade-out | power1.inOut | 0.5s | 0.25s | — |
| preloader sheet fade-out | power1.inOut | 0.5s | 0.75s | — |
| header show/hide | power1.inOut | 0.75s | — | — |
| header theme-color tween | power1.inOut | 0.5s | — | — |
| home white flash in / out | power1.inOut | 0.75s / 0.75s | 0.25s / 1.5s | — |
| project page backdrop+content in | power1.inOut | 0.5s (0s between sibling routes) | — | — |
| index rows in | power1.inOut | 1s | — | 0.05 |
| index backdrop in | power2.out | 0.5s | — | — |
| research section in | power1.inOut | 0.75s | — | — |
| studio blocks in | power1.inOut | 1s | — | 0.15 |
| legal page in | power1.inOut | 1s | — | — |
| contact links open / close | power1.inOut | 0.75s / 0.25s | — | 0.15 / 0 |
| contact backdrop open/close | power1.inOut | 0.75s | — | — |
| switcher (bottom-right) in / out | power1.inOut | 0.75s / 0.25s | — | 0.075 / 0 |
| deck tile hover offset | expo.out | 0.5s | — | — |
| deck drag scene-scale 0.825 | expo.out | 0.75s | — | — |
| deck intro sweep (offset −20 → 0) | expo.out | 2.0s | — | — |
| deck scene-scale intro 0.825 → 1 | expo.out | 1.0s | 1.25s | — |
| late-tile entrance (−15 → 0) | expo.inOut | 1.25s | — | — |
| open-project: mesh+group x → 0 | expo.out | 0.833s (1.25 × ⅔) | — | — |
| open-project: rotY → 0, camera push | expo.inOut | 1.25s | — | — |
| index hover-image fade-in | power2.out | 0.5s | — | — |
| lightbox container in/out (quadInOut) | quadInOut | 500ms | — | — |
| lightbox media in | quadInOut | 500ms | 333.33ms | — |
| lightbox extra layer | quadInOut | 250ms | — | — |

**No CSS @keyframes exist anywhere. No scroll-triggered reveals. No `prefers-reduced-motion`
(add one in our build — see §9).**

### 2.5 z-index scale

| z | Layer |
|---|---|
| 0 | fixed canvas wrapper (100svh, flex-centered) |
| 1 | canvas element; solid `#fafafa` ground div; corner-fade gradient; home white-flash overlay |
| 2 | page content sheet (the scrollable route section) |
| 3 | content accents above the sheet |
| 8 | contact frosted scrim |
| 9 | contact overlay (pills + legal nav) |
| 10 | header |
| 20 | mid-tier UI reserve |
| 99 | preloader |
| 101 | research zoom lightbox (topmost; 100 deliberately skipped) |

---

## 3. Layout system

### 3.1 Breakpoints

Tailwind v4 rem-based min-width: `sm` 640 / `md` 768 / `lg` 1024 / `xl` 1280 / `2xl` 1536px.
JS thresholds: `< 640` camera open-z 35 (else 30); `< 768` mobile texture variant;
viewport `aspect < 1` camera z 55. Every hover effect is gated `@media (hover:hover)`.
No max-width or orientation queries.

### 3.2 Shell architecture

`html, body { height: 100%; overflow: hidden; touch-action: pan-x; overscroll-behavior: none }`
— the document never scrolls. Each route is one `position: fixed; inset: 0; z-index: 2`
section with `overflow-y-auto; overscroll-behavior: none; background: #fafafa`, layered
over the persistent canvas/ground. Every viewport-height value is declared twice:
`vh` then `svh` fallback (`100vh/100svh`, `50vh/50svh`, `12.5vh/12.5svh`).

### 3.3 Gutters and axes

- Page frame: 4px (header inset).
- Text axis: **x = 14px** everywhere, both breakpoints.
- Content drop zone: top padding 144px mobile → 260px ≥640px before any content.
- No page max-width container — full-bleed with gutters. Text measures are capped per block:
  283px (`max-w-[17.6875rem]`), 432px (`sm:max-w-[27rem]`), 454px, 580px (nav cap,
  `sm:max-w-[36.25rem]`).

### 3.4 The index grid (research archive)

Edge-to-edge CSS grid (x = 0 bleed), top-aligned rows (ragged bottoms — masonry feel
without masonry):

| Breakpoint | Columns | gap-x | gap-y | top pad | measured col width @ ref |
|---|---|---|---|---|---|
| base (<640) | 3 | 61px | 61px | 144px | 89.33px @ 390w |
| sm 640 | 4 | 61px | 61px | 260px | — |
| md 768 | 5 | 61px | 61px | 260px | — |
| lg 1024 | 6 | 99px | 95px | 260px | — |
| xl 1280 | 7 | 99px | 95px | 260px | 120.85px @ 1440w |
| 2xl 1536 | 8 | 7vw | 95px | 260px | — |

At desktop, image:gutter ratio ≈ 55:45 — whitespace is the dominant texture.
Reference totals at 159 tiles: grid 6402px tall, page 6852px @ 1440×900;
page 10,205px @ 390×844.

### 3.5 Half-viewport module

The closing-section unit used after grids/content: `height: 50vh/50svh; min-height: 320px;
flex-col justify-center`, single paragraph at x = 14px, max-width 283px, sentence case.

---

## 4. Typography rules

- **text-11 (10.5/13, .015em, uppercase)** is the default for ALL running text: nav labels,
  list blocks, legal links, footers, cursor label.
- **Sentence case = prose.** Only paragraphs get `normal-case` (studio mission, closing
  statements); everything else stays uppercase via inheritance.
- **Buttons** tighten line-height to 1.05; labels idle at opacity .3, hit 1 on
  hover/`.active` (current route carries `.active`).
- **List blocks** (studio): label + value lines at line-height 1.25; the label span sits in
  a collapsed 2px column (runtime-sized to measured brand-cell width + 2px via a
  `logoWidth` store) so all value columns share one x regardless of label length;
  labels at opacity .3.
- **Viewer chrome** (video bar, lightbox, preloader) uses 11px/1 uppercase.
- **Display text** (project detail) is runtime-sized with line-height 1.0909 (uppercase
  blocks) / 1.0762 (sentence paragraphs); spans fade individually at 500ms easeOutCubic.
- **No headings, no bold, no italics, no second size on the core pages.** Hierarchy =
  opacity steps + case switch + position + isolation in whitespace.

---

## 5. Page anatomies

### 5.0 Shared shell (identical on every route)

```
hydration root (display: contents)
├─ header        fixed top-0 left-0 z-10, w-full, p-1, pointer-events-none, prerendered opacity-0
│  └─ nav        capped 580px ≥640px (hugs top-LEFT; 60% of the top band stays empty @1440)
│     └─ ul      4 cells, 2px gaps, each cell h 58px (pad 40px top / 7px bottom → label bottom-left)
│        ├─ brand cell   w-1/4 → 200px @md+  (wordmark + <small>® + section word, word md+ only)
│        ├─ link cell    → research route (one-word label)
│        ├─ link cell    → studio route (one-word label)
│        └─ button cell  → contact toggle (one-word label; a real <button>, no hamburger)
├─ div           fixed inset-0 z-1, solid #fafafa ground
├─ div           fixed inset-0 z-1, corner-fade gradient (hidden <768px)
│  …route-specific z-2 section here (home has none)…
├─ section       fixed inset-0 z-9, flex-centered — CONTACT OVERLAY (see §6.4)
└─ div           fixed inset-0 z-8, opacity-0, filter blur(8px) — frosted scrim
                 (#ffffffb3 + backdrop-blur 20px → 40px @md+)
```

Header cells use the universal `.button` recipe: 6px radius, `backdrop-filter: blur(24px)`,
`::before` 1px currentColor border @ .13, `::after` currentColor fill @ .03 (both inherit
radius, pointer-events:none), label spans .3 → 1. Header gets
`backface-visibility: hidden` (paint stabilization), `user-select: none`, and per-control
`pointer-events: all` over a pass-through wrapper.

Measured @1440×900: nav block 584×62px incl. frame (40.5% × 6.9% of viewport);
cell widths [200, 124.7, 124.7, 124.7]. @390: four equal ~95px cells, full-bleed minus 4px frame.

### 5.1 Home

```
(shell only — the DOM ships zero content markup)
└─ WebGL canvas inside a fixed 100svh flex-centered wrapper (z-0/1)
   · a horizontal rail of thin 3D cards (every project visual, flattened, optionally shuffled)
   · cards rotated −30° on Y, receding in z away from center, seen through a 5° fov camera
   · corner-fade gradient floats above (md+), nav floats top-left
```

Proportions: first viewport is ~93% empty `#fafafa`; no h1, no hero copy, no footer element.
Footer duties live in the contact overlay's bottom-left legal nav. Tile order: shuffled
per visit behind a CMS boolean; list duplicated once if < 20 tiles. Full deck physics in §6.2.

### 5.2 Studio

```
section  fixed inset-0 z-2, overflow-y-auto, bg-#fafafa
│        pad-top 144px → 260px @sm; pad-bottom 12.5svh @sm
├─ img   fixed top-0 right-0, hidden <1024px — square artwork, EXACTLY 50vh tall
│        (450×450 @1440×900 = 31% of width), hard crop, no caption, doesn't scroll
└─ div   single text column, max-w 432px @sm (30% of 1440), stack gap 20px
   ├─ p   mission paragraph — 10.5/13 sentence case, x=14px, +20px extra margin → 40px to next
   ├─ ul  block 1 (clients, ~14 lines)      ┐ label collapsed to 2px col @ opacity .3,
   ├─ ul  block 2 (services, ~5 lines)      │ value lines 10.5px upper, line-height 1.25,
   ├─ ul  block 3 (press, ~4 external links)│ links target=_blank rel="noopener nofollow noreferrer"
   ├─ ul  block 4 (awards, ~2 external links)┘
   └─ figure  mobile only (<640px): square full-bleed artwork at document end, mt 56px,
              flush left/right/bottom, no caption
```

Proportions @1440×900: text x 0–432, starts y=260 (29% down), ends y≈779; no scroll;
center + bottom-right ~55% of canvas deliberately empty. @390: starts y=144, page scrolls
~298px, bottom image 390×390. Reveal: 7 units (p, 4 lists, figure, fixed img) each
prerendered opacity-0, staggered 0.15 at 1s power1.inOut.

### 5.3 Research

```
section  fixed inset-0 z-2, overflow-y-auto, bg-#fafafa, prerendered opacity-0 (fades in whole)
├─ div   the index grid (§3.4) — every tile:
│  └─ button  relative flex cursor-zoom-in, style="aspect-ratio: <exact float per asset>"
│     └─ picture absolute inset-0 overflow-hidden
│        ├─ source webp  (DPR-ladder srcset, §7.2)
│        ├─ source jpeg
│        └─ img absolute inset-0 h-full w-full object-cover alt=""
└─ section  half-viewport closing band — 50svh (450px @900, min 320px), flex-centered column:
   └─ p   one paragraph, x=14px, max-w 283px, 10.5px sentence case, line-height 1.0762
```

159 tiles in the source; ~19% are videos but **prerender identically as image posters** —
video behavior exists only inside the lightbox. No captions, titles, or hover labels in
the grid. Aspect census (house ratios): 0.8 ×51, 0.753 ×24, 1.0 ×20, 1.5 ×11, 1.667 ×10,
0.75 ×7, 16:9-family ×12, extremes 0.502–3.207; ~60% portrait — **4:5 is the house ratio**.

### 5.4 Other routes (for completeness)

- **`/index` (table list):** rows fade in 1s power1.inOut stagger 0.05; row hover = JS
  opacity 1 vs 0.3 on siblings (0.5s cubicOut); hover preview figure pinned top-right at
  `height: calc(50svh − 3.5rem)`, image `loading="lazy"`, fade-in 0.5s power2.out on load.
- **`/[slug]` (project detail):** white backdrop + content both fade in 0.5s power1.inOut
  (instant backdrop when arriving from `/index` or a sibling project). Display text with
  the 1.0909/1.0762 line-heights; visuals via the §7 media component.
- **Legal pages:** single fade 1s power1.inOut.
- **Switcher** (bottom-right pill on `/` and `/index`): h 40px, 6px radius, `px-[16px]`,
  items gap 28px; in 0.75s stagger 0.075 / out 0.25s.

---

## 6. Motion choreography

### 6.1 Intro / preloader

Fixed sheet `inset-0 z-99 bg-#fafafa`, centered percentage readout (10.5px uppercase).
1. Preload, per deck tile, blur thumb + full texture (mobile variant if viewport < 768px);
   each finished tile adds `100/count` to a progress target.
2. Displayed number lerps toward target: `shown += (target − shown) × 0.1` per rAF;
   done when `round(shown) === 100`.
3. Exit (home route): % text fades out 0.5s power1.inOut delay 0.25 (flips
   appLoaded/appCanvasInit) → sheet fades out 0.5s delay 0.75 power1.inOut (flips
   appAnimated). Non-home routes skip the visual and set all flags immediately.
4. Header becomes visible (0.75s power1.inOut) only after appAnimated.

### 6.2 Home deck (the signature) — exact physics

**Renderer:** `WebGLRenderer({ alpha:false, antialias:true })`, clearColor `#fafafa`,
pixelRatio `min(devicePixelRatio, 2)`. PerspectiveCamera **fov 5** (telephoto flattening),
near .1 / far 1000, position `(0, 13.33, 35)` looking at origin; portrait viewport → z 55.
Lights: AmbientLight white **1.5** + DirectionalLight white **1** at (0, 25, 50).
Renders only while route = home and contact closed (gate re-checked 500/1000ms after
route change; disabled 2000ms after leaving).

**Tile build (per visual):** `BoxGeometry(H, W, 0.0175)` — a thin slab, not a plane.
Base 1.5×1.5; with image ratio `r = imgH/imgW`: width ×= r, then both dims
×= `(1 − (r − 1) × 0.5)` (tall images shrunk toward square); mesh x-offset `−(H−1.5)/2`.
Nesting: static outer → moving group (rail position + Y rotation) → inner offset group
(hover shift) → mesh, plus an invisible hit-proxy plane (opacity 0, scale.x 1.5) for raycasts.

**Shader:** cover-fit UV sampling; a **0.15-UV edge band** where smoothstep cross-fades
the sharp texture into the blur-up thumbnail at **0.75 alpha** — the blurred-edge frame
look. Uniforms: blur texture, image texture (mobile variant < 768px), image size, mesh
size. Textures bound only while on home and tile visible. `colorSpace: srgb`.

**Rail layout (every frame):** spacing **0.375 world units**; position
`x = wrap(−count×0.375/2, +count×0.375/2, (index − scrollPos) × 0.375)`;
depth `z = −x × aspect × 1.5` (landscape) or `−x × 6` (portrait);
resting `rotation.y = −π/6` (−30°); cull when `|z| ≥ 12.5`.

**Scroll/drag physics (three lerps):**
- wheel (fine pointers only): `target −= (deltaY + deltaX) / 20`; virtual-scroll config
  `touchMultiplier: 20`, mouseMultiplier 1, firefoxMultiplier 15, keyStep 120.
- per frame: `scrollPos += (target − scrollPos) × 0.15`.
- drag: `dragLerp += (dragDelta − dragLerp) × 0.1`; rail input
  `scrollPos/25 − dragLerp/q + introOffset` with q = 100 desktop / 50 touch.
- drag arms after a **150ms** hold; whole scene scales to **0.825** (expo.out 0.75s)
  while dragging, back to 1 on release; cursor grab → grabbing.

**Hover:** desktop — inner group tweens to `(x: 2/3, y: −0.1)` expo.out 0.5s, back to 0 on
leave. Touch — center tile (min |z|) auto-"hovers": `(+0.325, −0.1)`, all others `−0.325`.
Cursor label (fine pointers): fixed 10.5px span, `p-3`, `mix-blend-exclusion`, white text
+ `saturate(0)`, follows pointer with **lerp 0.1**, shows hovered project title.

**Click → open:** counts only if released within **200ms** of pointer-down, not on a
link/button, ≥1000ms after mount. Sequence: inner offset resets; mesh x → 0 AND moving
group x → 0, expo.out **0.833s** (z keeps following −x×aspect×1.5); rotY → 0 expo.inOut
**1.25s**, then route change on complete; camera pushes to z = 35 (<640px) / 30,
expo.inOut 1.25s; siblings hidden; scene scale 0.825.

**Intro / re-entry:** rail offset set to **−20**, tweened to 0 expo.out **2.0s** (tiles
sweep in from the left); scene scale 0.825 → 1, 1.0s, delay 1.25, expo.out. Tiles created
post-init enter −15 → 0 expo.inOut 1.25s. On navigation back to home, the deck is torn
down and rebuilt after **1100ms** (50ms on first load).

### 6.3 Page transitions

No router transition API — per-component GSAP fades over the shared `#fafafa` ground:

- **→ home:** white flash overlay (`fixed inset-0 z-1 bg-#fafafa`) fades in 0.75s
  power1.inOut delay 0.25, holds, fades out 0.75s delay 1.5 — a ≈2.25s window covering the
  deck rebuild + 2s sweep. Initial load: set opaque, fade out 0.75s delay 0.25.
- **home → project:** the WebGL flatten/camera push (1.25s) IS the exit; new page fades
  in 0.5s. **Sibling-route arrivals** (index ↔ project, project ↔ project) skip the
  backdrop fade (0s) so only content fades.
- All other entrances per the §2.4 table. Page exit = unmount, covered by the next
  page's `#fafafa` backdrop. Everything is opacity; **no transform-based transitions.**

### 6.4 Contact overlay (the "menu")

Layers: pills section (z-9, flex-centered; ul `translate-y-[75%]` below 640px,
centered above) + bottom-left legal nav (x 14px, 11px off bottom, 12px gaps) +
frosted scrim (z-8: `#ffffffb3`, backdrop-blur 20→40px, plus filter blur(8px) class).

- **Open:** pills + legal fade in 0.75s power1.inOut **stagger 0.15**; scrim 0.75s.
- **Close:** items 0.25s, **no stagger**; scrim 0.75s. Esc closes; any route change
  closes; clicking the scrim closes.
- Pills @1440×900: row dead-center (y 430.5, h 39px): email rectangle 139.6px (6px
  radius), social pill 90px, address pill 218px (hidden <640px); 2px gaps; padding
  16/14px; labels 10.5px upper @ .3, optical nudge `translate-y-[1.5px]`.
- Header hides (0.75s) while the overlay is open.

### 6.5 Hover states (all gated `@media (hover:hover)`)

| Target | Effect |
|---|---|
| any label/link | opacity .3 → 1, 500ms easeOutCubic; current route stays at 1 (`.active`) |
| button with svg | icon `scale(1.05)`, 500ms easeOutExpo |
| deck tile | offset shift §6.2 + cursor label + body cursor `pointer` |
| index row | row to 1, siblings to .3 (JS + 0.5s cubicOut); preview image swap |
| video surface | controls bar opacity → 1; auto-hides 1000ms after last mousemove |

### 6.6 Research lightbox

Tile buttons `cursor-zoom-in` → modal `fixed inset-0 z-101`, `#ffffffb3` +
backdrop-blur 20→40px, padding `px-10 py-16`. Svelte custom fades (quadInOut):
container in/out **500ms**; inner media in **500ms delayed 333.33ms**; secondary layer
**250ms**. Full-surface close button `cursor-zoom-out`; Esc or click closes; store
clears 500ms after close; grid videos behind it deactivate after 1000ms.
Viewer chrome: 11px/1 uppercase; progress track = nested div `background: currentColor;
transform: scaleX(progress)` origin-left; bar fades 0.25s ease-out.

---

## 7. Media treatment

### 7.1 Aspect ratios

Per-asset exact floats carried as inline `style="aspect-ratio:"` on the tile wrapper,
with the image absolutely positioned and `object-cover`. House distribution: **4:5 (0.8)
dominant**, then 0.753, 1.0, 1.5, 1.667, 0.75, 16:9 family; range 0.502–3.207;
~60% portrait. Studio artworks are exact 1:1 squares. Dominant intrinsic sources:
1350×1080, 1080×1920, 2700×2160, 2464×1856.

### 7.2 srcset ladders — **DPR ladder, not width ladder**

Fixed logical box per context; candidates vary `dpr` at constant w/h params:

| Context | Logical box | params | DPR steps | resulting descriptors |
|---|---|---|---|---|
| grid thumbnail | 192px (`sizes="(max-width:192px) 100vw, 192px"`) | `h=256&w=256&q=75&fit=max&auto=compress` (+`fm=webp` twin) | .25/.5/.75/1/1.5/2/3/4 | 48w…771w (entries above intrinsic width omitted → 7–8 each) |
| lightbox / zoom | 928px | `h=2048&w=2048&q=75&fit=max` | .25–1 (+ higher on large assets) | 232w/464w/696w/928w… |
| full-res standalone | — | `h=2048&w=2048&q=90&fit=max&dpr=1` (+webp) | — | — |
| deck texture desktop | — | `h=720&w=720&q=80&fit=max&dpr=1` (+webp) | — | — |
| deck texture mobile (<768) | — | `h=512&w=512&q=80` (+webp) | — | — |
| blur placeholder | — | `h=64&w=64&q=80&blur=16` (+webp) + ~500B inline base64 thumb | — | — |
| project thumbnail | — | `h=1024&q=90` | — | — |
| og:image | — | `w=1200&auto=format&fit=max` (1200×675) | — | — |

Implementation rule from their component: generate DPR variants `[.25,.5,.75,1,1.5,2,3,4]`,
skip any candidate whose resulting width < 50px; `<img src>` = the dpr=1 variant;
`<picture>` always pairs a webp `<source>` with a format-less fallback. Project-context
images get the `inset:-1px / calc(100%+2px)` outset to hide edge seams;
fit `object-cover` (project/grid) vs `object-contain` (lightbox).

### 7.3 Eager/lazy rules

- Source site ships **zero** `loading=`/`decoding=`/`fetchpriority=` attributes — the
  entire research grid is eager static DOM (~442KB of markup). The one exception:
  index-page hover previews use `loading="lazy"`.
- Visibility logic is IntersectionObserver, **threshold 0, rootMargin 0px**, watched on
  the `<picture>` — drives video play/pause and lazy video mount.
- Our build: keep the visual behavior, but add `loading="lazy"` + `decoding="async"`
  below the fold (invisible fidelity win; see §9).

### 7.4 Video rules

- **Project videos (HLS):** `Hls({ startLevel: 4, maxBufferLength: 5, maxBufferSize: 5 })`,
  Safari native-HLS fallback. `<video loop muted playsinline>` — **no autoplay attribute**;
  play()/pause() driven purely by in-view state. Poster swap: on `play`, poll until
  `currentTime > 0`, then video opacity → 1 / poster `<img>` opacity → 0.
  Click toggles play/pause. Hover reveals the controls bar (auto-hide 1000ms).
- **Controls bar:** bottom strip, `p-4` → `p-8` @md, gap 16px, 11px uppercase:
  play/pause word (min-w 38px), `current / total` m:ss (md+, min-w 58px), scrubber =
  invisible `<input type=range step=.01>` over a 2px currentColor track @ 30% with a
  `scaleX(progress)` fill, sound toggle, fullscreen (fullscreen flips object-fit
  cover → contain). Bar shown when paused / touch device / hovering; else hidden;
  0.25s ease-out.
- **Grid/lightbox videos:** plain `<video loop autoplay muted playsinline>`, mounted only
  when intersecting; low-res rendition in grids, medium-res in the lightbox; same
  currentTime>0 fade-in. Streaming: HLS `.m3u8` for project pages; mp4 renditions
  (high/medium/low) elsewhere. Source durations: loops mostly 2–18s.

---

## 8. Interaction details

- **Cursor:** body cursor on home = `grab` / `grabbing` (dragging) / `pointer` (over
  tile), else `default`; `cursor-zoom-in` on grid tiles, `cursor-zoom-out` on the
  lightbox close surface. The only "custom cursor" is the floating project-title label
  (10.5px, lerp 0.1, mix-blend-exclusion, white + saturate(0)) — no cursor graphic.
- **Pointer accuracy:** poll pointer fineness every 500ms; body classes
  `finePointer/coarsePointer/noPointer`; `canHover = fine`. canHover gates: wheel input,
  hover raycasts, hover offsets, cursor label, row hovers, video hover-controls, and
  click delay (0ms fine / 20ms coarse).
- **Click-vs-drag:** 150ms hold arms drag; click valid only within 200ms of pointer-down.
- **Scrollbars:** `::-webkit-scrollbar { display: none }` globally — invisible everywhere.
- **Selection:** `* { user-select: none }` site-wide; no `::selection` style.
- **Focus:** source kills all outlines (`* { outline: none }`) + transparent tap
  highlight. *Our build: keep `:focus` invisible but add `:focus-visible` rings (§9).*
- **Touch:** `touch-action: pan-x` + `overscroll-behavior: none` on html/body; route
  sections re-declare `overscroll-behavior: none`; deck drag divisor 50 (vs 100 fine).
- **Smooth scroll: none.** DOM pages scroll natively; the only inertial motion is the
  deck's three lerps (scroll .15 / drag .1 / cursor .1) on a priority-sorted single-rAF
  manager that cancels on window blur.
- **Resize:** window size read from a ResizeObserver on the fixed 100svh wrapper, not
  window events (correct svh behavior on mobile chrome).
- **Hydration/UX flags:** body `data-sveltekit-preload-data="hover"` (route data preloads
  on link hover — the only data-attribute on the entire site); webp support probed once
  via 1px `createImageBitmap`.

---

## 9. Fidelity ledger — what cannot carry over 1:1, and the chosen equivalent

| # | Original | Status | Equivalent in dhakamythos |
|---|---|---|---|
| 1 | **NB International Pro Regular** (Neubau, commercial webfont; single 400 cut) | **RESOLVED 2026-06-11 — license purchased**; the real face ships (`static/fonts/`) | exact 1:1; §9.1 calibration obsolete |
| 2 | Their photography / artwork (DatoCMS + Mux assets) | NOT copyable | Original dhakamythos imagery, graded to the same grammar: hard crops, no borders/captions, 4:5 house ratio, B/W-leaning accents, mixed-ratio archive |
| 3 | Their copywriting (mission text, labels, project titles, closing statements) | NOT copyable | Original copy fitted to the same measures: mission ≈ 7 lines @ 432px, closing statement ≈ 6 lines @ 283px, one-word nav labels |
| 4 | DatoCMS (content + imgix-style image CDN + `blurUpThumb`) | Different stack | **Sanity**: param map `auto=compress→auto=format`, `fit=max→fit=max`, `dpr/h/w/q/fm=webp/blur` all supported by Sanity's image CDN (blur scale differs — calibrate visually against the 64px/blur=16 look); `blurUpThumb` → `metadata.lqip` (base64 ~20px) |
| 5 | Mux video (HLS .m3u8 + mp4 renditions) | Service choice | Mux via `sanity-plugin-mux-input` (keeps `startLevel 4 / maxBuffer 5` config verbatim), or static mp4 renditions if volume is small |
| 6 | ~800KB inline hydration payload on every route (entire 38-project dataset shipped everywhere, zero lazy fetching) | Anti-pattern, not aesthetic | Per-route data loading in SvelteKit; visual result identical |
| 7 | Zero a11y (no aria/roles/tabindex/h1/landmarks; alt=""; outlines killed; selection disabled) | Deliberate omission — don't replicate | Add invisible fidelity: `:focus-visible` rings, aria-labels on tile buttons, real alt text, an sr-only h1, `prefers-reduced-motion` fallback (skip deck sweep, instant fades) — none of it changes a pixel for mouse users |
| 8 | No `loading`/`decoding` attributes (eager 159-tile grid) | Perf flaw | lazy/async below the fold; identical rendering |
| 9 | `font-display` unset (FOIT risk) | Flaw | `font-display: swap` or `optional` on Geist |
| 10 | Libraries (GSAP 3.13, three r173, hls.js 1.6.13, virtual-scroll) | Fine to use | All free/MIT (GSAP fully free since 3.13); or reimplement virtual-scroll's tiny wheel-normalizer (multipliers in §6.2) |

### 9.1 NB International Pro → Geist metric-matching spec

What the original face does (everything an implementer needs, no font files required):
a neo-grotesque, single Regular cut, used only at 8–11px uppercase + 10.5px sentence case.

| Parameter | Target (measured from NB International Pro @ 16px root) |
|---|---|
| sizes in service | 10.5px (everything), 11px (viewer chrome), 8px (micro) |
| line-heights | 13px running / 11.025px (1.05) buttons / 1.25 lists / 1 viewer |
| tracking | 0.1575px (.015em) @ 10.5px; 0.8px (.1em) @ 8px |
| weight | 400 only — never anything else; no italics |
| case | uppercase default, sentence-case prose |

Calibration targets (uppercase, 10.5px, .015em — measured advance widths to match within
±3%): the three legal-nav labels measure 76.0 / 79.6 / 71.2px; the brand label block
36.1×11px; the contact pills (incl. 32px horizontal padding) 139.6 / 90 / 218px. Method: render the same strings in Geist 400 at 10.5px/.015em and
nudge **letter-spacing first** (±0.005em steps), then `font-size-adjust` if x-height
reads small. Since the site has no large display type on the core pages, small-size
texture matching is the whole game — Geist's slightly closed apertures at 10.5px
uppercase read very close to a grotesque. Self-host woff2, `font-display: swap`,
weight 400 only (do not ship other weights — weight contrast must stay impossible).

### 9.2 What carries over exactly (no substitution needed)

All numbers in §§2–8: the `#fafafa/#000` system, opacity palette, 10.5px scale, 14px
axis, 144/260px drop zones, grid ramps and gaps, z-contract, both cubic-beziers, every
GSAP duration/stagger, deck physics constants (fov 5, 0.375 spacing, −30°, lerps
.15/.1/.1, 0.825 drag scale, 0.15-UV blur band @ .75 alpha), DPR ladder, video
buffer config, frosted-glass recipe, button anatomy, and the contact/lightbox
choreography — these are facts, and the implementation is original code.
