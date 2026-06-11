# UNVEIL-GAP.md — punch list: unveil grammar vs current dhakamythos

Every measured delta between `docs/UNVEIL-GRAMMAR.md` and the implementation as of
2026-06-11. Grouped in four waves, ordered by visual impact within each wave.

**Constraints that override the spec wherever they collide (tagged per item):**
- Svelte 5 runes · tokens-not-values · animate only `transform`/`opacity`.
- Perf budgets: LCP < 2.5s mobile, CLS < 0.05, TBT < 200ms → `[BUDGET-RISK]`.
- Fixture mode + existing Sanity content model stay; our content, never theirs.
- No unveil fonts/assets/text. Geist stays; type deltas are scale/leading/tracking/case
  only. → `[CONSTRAINT-COLLIDE]` marks items where the spec and a constraint disagree;
  the resolution is stated inline.

Route mapping: unveil `studio` → our `/collective`; unveil `research` → our `/archive`;
unveil `index` → our `/index`; unveil home deck → our `/` Deck. `/open-calls`, `/wall`
(= archive), legal, 404 inherit the closest grammar (legal-page / list-page rules).
There is no `src/routes/studio/` — the Sanity studio lives outside `src/routes`.

Item format — **Unveil:** exact spec value · **Now:** current state with file:line ·
**Files:** targets · **Accept:** verifiable check.

---

## W1 — Tokens (global, cheap, biggest leverage)

### W1-01 Ink goes pure black
- **Unveil:** `--ink: #000`; `html { color: #000 }`; every grey is `currentColor` at an opacity step, never a hex tint (§2.1).
- **Now:** `--ink: #141414` — `src/app.css:10`.
- **Files:** `src/app.css`.
- **Accept:** computed body color is `rgb(0,0,0)`; no `#141414` remains in the repo.

### W1-02 Ground goes neutral #fafafa
- **Unveil:** `--ground: #fafafa` (html bg, route sheets, preloader, flash, gradient endpoints).
- **Now:** `--ground: #fafaf7` (warm) — `src/app.css:9`; `theme-color` `#FAFAF7` — `src/app.html:6`.
- **Files:** `src/app.css`, `src/app.html`.
- **Accept:** html background and `<meta name=theme-color>` both `#fafafa`.

### W1-03 Opacity scale replaces the grey palette
- **Unveil:** hierarchy is ONLY currentColor opacity: `1` active / `.75` gradient / `.3` resting labels / `.13` hairlines / `.03` fills / `0` pre-reveal (§2.1). No `--muted`, no `--line` hue.
- **Now:** hue-based: `--muted: #6e6e68` (app.css:11), `--line: #e4e4df` (app.css:12), used in ~15 components.
- **Files:** `src/app.css` (add `--alpha-active:1; --alpha-rest:.3; --alpha-hairline:.13; --alpha-wash:.03; --alpha-fade:.75`), then every consumer of `--muted`/`--line`.
- **Accept:** `--muted` resolves to `rgb(0 0 0 / .3)`-equivalent, `--line` to `.13`; grep finds no `#6e6e68`/`#e4e4df`.

### W1-04 Overlay token: dark scrim → frosted white sheet
- **Unveil:** `sheet = #ffffffb3` + `backdrop-filter: blur(20px)` (40px ≥768px); scrim companion class `filter: blur(8px)`; never a solid dark surface (§2.1, §6.4).
- **Now:** `--overlay: rgba(20,20,20,.94)` opaque dark — `src/app.css:13`; consumed by ContactOverlay.svelte:52, archive lightbox (+page.svelte:129), CursorLabel, VideoChrome.
- **Files:** `src/app.css` (`--sheet: rgba(255,255,255,.7); --blur-sheet: 20px; --blur-sheet-md: 40px; --blur-button: 24px; --blur-scrim: 8px`), consumers in W2/W3.
- **Accept:** no dark full-screen surface anywhere; overlays show blurred page behind. `[BUDGET-RISK]` backdrop-filter paint cost on low-end mobile — never animate the blur itself, fade opacity only.

### W1-05 Motion tokens: the two signature curves + 500ms
- **Unveil:** label fade `cubic-bezier(.215,.61,.355,1)` 500ms; transform `cubic-bezier(.19,1,.22,1)` (easeOutExpo) 500ms; micro 150ms `(.4,0,.2,1)`; GSAP set: power1.inOut (.5/.75/1s), power2.out (.5s), expo.out/inOut; staggers 150/75/50ms (§2.4).
- **Now:** `--dur-fast: 240ms; --dur-base: 600ms; --dur-slow: 900ms; --ease-out: cubic-bezier(.16,1,.3,1); --ease-inout: cubic-bezier(.83,0,.17,1); --stagger: 70ms` — `src/app.css:33-38`.
- **Files:** `src/app.css` (`--dur-label:500ms; --dur-micro:150ms; --dur-beat:750ms; --dur-long:1000ms; --ease-out-cubic; --ease-out-expo; --stagger-route:150ms; --stagger-rows:50ms; --stagger-pills:75ms`).
- **Accept:** all transitions resolve to spec curves/durations; old tokens removed or aliased.

### W1-06 Radius: sharp → 6px + pill
- **Unveil:** exactly two radii: 6px (buttons, cards, switcher) and `rounded-full` (pills) (§2.3).
- **Now:** `--radius: 0` "sharp everywhere" — `src/app.css:30`.
- **Files:** `src/app.css` (`--radius: 6px; --radius-pill: 999px`).
- **Accept:** nav cells/pills render 6px / full-round corners; no other radius values exist.

### W1-07 Spacing tokens: 14px axis, 4px frame, 144/260 drop zones
- **Unveil:** axis x=14px everywhere; page frame 4px; content top pad 144px (<640) / 260px (≥640); legal bottom 11px; cell gaps 2px; legal-link gaps 12px; stack gap 20px; section pads 12.5svh; archive gaps 61px→99/95px→7vw (§2.3, §3.3).
- **Now:** `--gutter: clamp(16px,4vw,48px)` — `src/app.css:17`; 4/8/…/128px scale `app.css:18-27`; main top pad `--space-10` (128px) — `src/routes/+layout.svelte:64-66`.
- **Files:** `src/app.css` (`--axis-x:14px; --frame:4px; --drop-top:144px; --drop-top-sm:260px; --legal-bottom:11px; --gap-cell:2px; --grid-gap:61px; --grid-gap-x-lg:99px; --grid-gap-y-lg:95px`).
- **Accept:** tokens exist and are the only place these values appear; consumers move in W2.

### W1-08 z-index contract
- **Unveil:** 0 canvas / 1 ground+gradient+flash / 2 route sheet / 3 accents / 8 scrim / 9 contact / 10 header / 20 reserve / 99 preloader / 101 lightbox (§2.5).
- **Now:** `--z-nav:50; --z-overlay:60; --z-transition:70; --z-cursor:80` — `src/app.css:41-44`.
- **Files:** `src/app.css` (+ add `--z-ground:1; --z-sheet:2; --z-scrim:8; --z-contact:9; --z-header:10; --z-preloader:99; --z-lightbox:101`).
- **Accept:** layer order matches the unveil table; cursor label sits above lightbox (102) since unveil's cursor is body-level.

### W1-09 Reduced-motion override keeps working against new tokens
- **Unveil:** none exists upstream; ours stays (fidelity ledger §9 #7) — constraint, not a delta to remove.
- **Now:** global opacity-only collapse — `src/app.css:201-213`.
- **Files:** `src/app.css` (verify the override still neutralizes new GSAP/JS staggers added in W3 — JS paths must check `matchMedia` themselves).
- **Accept:** with reduce on: no preloader count-up, no staggers, instant fades; deck sweep skipped.

**W1 count: 9**

---

## W2 — Typography + layout per route

### W2-01 Collapse the type system to one size (10.5px scale)
- **Unveil:** one size carries the site: 10.5px/13px/.015em/400; buttons 10.5/1.05; lists 10.5/1.25; viewer 11/1; micro 8/8/.1em; display text runtime-sized at lh 1.0909 (upper) / 1.0762 (sentence). **No headings, no bold, no second size on core pages** (§2.2, §4).
- **Now:** five roles incl. `display clamp(2.6rem,9vw,7.5rem)/500/−.02em` and `title clamp(1.4rem,4vw,2.2rem)/500` — `src/app.css:108-143`; `body 1rem/1.6`; meta `.75rem/500/.08em`.
- **Files:** `src/app.css` (replace roles: `.type-11 {font-size:.65625rem; line-height:.8125rem; letter-spacing:.015em; font-weight:400}` + `.type-button` lh 1.05, `.type-list` lh 1.25, `.type-viewer` 11px/1, `.type-micro` 8px/8px/.1em, `.type-display` runtime/clamp at lh 1.0909), every component using `type-display/title/body/meta/counter`.
- **Accept:** weight 400 only renders anywhere (wordmark included); 10.5px is the measured size of nav, lists, footers, captions at 390 AND 1440 (breakpoint-invariant). Visible `h1`s become sr-only or 10.5px; one sr-only h1 per page stays (constraint). Geist stays; calibrate letter-spacing ±.005em steps against §9.1 advance-width targets.

### W2-02 Uppercase by default, sentence-case prose opt-out
- **Unveil:** `html { text-transform: uppercase }`; only prose paragraphs get `normal-case` (§2.2, §4).
- **Now:** sentence-case default; only `.type-meta` uppercases — `src/app.css:133`.
- **Files:** `src/app.css` (html rule + `.prose-case` opt-out), `Prose.svelte`, collective manifesto, standfirsts.
- **Accept:** all labels/nav/lists render uppercase from inheritance; paragraphs render sentence case. `[CONSTRAINT-COLLIDE]` CLAUDE.md copy style "sentence case" — resolved: authored copy stays sentence case in the CMS; uppercase is presentation-layer only.

### W2-03 Home: bare-image rail in a ~93% empty field
- **Unveil:** home DOM ships zero content — only chrome + media rail; tiles are caption-less images (title appears only in the cursor label); no counter/hint text blocks; corner-fade gradient `linear-gradient(45deg,#fafafa 0/1%,transparent 25%,transparent 75%,#fafafa 100%)` @ .75, fixed, ≥768px (§5.1, §2.1).
- **Now:** Card renders eyebrow + 2-line title below the cover — `src/lib/components/Card.svelte:93-95`; Deck shows counter bottom-left + hint bottom-right — `Deck.svelte:211-215, 254-268`; no gradient layer.
- **Files:** `Card.svelte`, `Deck.svelte`, `src/routes/+page.svelte`, `+layout.svelte` (gradient div).
- **Accept:** at 1440×900 the home first paint is ≳90% bare ground; tile titles surface via cursor label (fine pointers) and aria-label (always); counter restyled as the bottom-right switcher pill idiom (40px h, 6px radius, px-16) or removed; corner gradient visible ≥768px.

### W2-04 Nav → four-cell frosted button grid, top-left
- **Unveil:** fixed top-0 left-0, `p-1` (4px frame), ul of cells with 2px gaps, each cell h 58px (pad 40px top/7px bottom — label sits bottom-left), brand cell 200px wide @md + ®-mark `<small>` nudged −0.5px, nav block capped 580px, every cell the `.button` recipe (W2-13); labels idle .3, active route 1; mobile: equal-width cells full-bleed minus 4px (§5.0).
- **Now:** absolute flex row, wordmark weight 700, links as bare words with hue hover, separate Contact + mobile "Menu" `<dialog>` — `src/lib/components/Nav.svelte:22-46, 67-113, 115-168`.
- **Files:** `Nav.svelte`.
- **Accept:** header measures ≈62px tall incl. frame; cells show 6px-radius hairline (.13) + wash (.03) + blur(24px); current route label at opacity 1, others .3; wordmark weight 400. Our 5 destinations + Contact stay (our IA — constraint): brand cell + up to 4 link cells + contact button cell; mobile menu dialog deleted or reduced to cells (see W3-12).

### W2-05 Shell: fixed full-viewport sheets over a persistent ground
- **Unveil:** `html,body { overflow:hidden }`; every route is `position:fixed; inset:0; z-2; overflow-y:auto; bg:#fafafa` stacked over fixed ground divs; `vh`+`svh` double declarations (§3.2).
- **Now:** normal document flow; `main` gets `padding-top: var(--space-10)` — `src/routes/+layout.svelte:46-56, 63-66`; FatFooter below.
- **Files:** `+layout.svelte`, `src/app.css`, every route's outer wrapper.
- **Accept:** document scrollHeight == viewport on every route; the route section scrolls internally; ground div persists across navigations. `[BUDGET-RISK]` scroll restoration + CLS re-measure needed; keep SvelteKit's scroll handling pointed at the section.

### W2-06 The 14px axis + 144/260px drop zones on every route
- **Unveil:** all body text/lists/footers/legal at x=14px both breakpoints; first content at y=144 (<640) / 260 (≥640); section bottom pad 12.5svh ≥640 (§3.3).
- **Now:** `--gutter` clamp(16–48px) on every page wrapper — `index/+page.svelte:83`, `archive:82`, `collective:63`, `open-calls:48`, `[slug]:130`, `legal`, `404`; top offset 128px via layout.
- **Files:** all route pages, `+layout.svelte`.
- **Accept:** DevTools measures first text glyph at x=14px and first content row at y=144/260 on every route at 390 and 1440.

### W2-07 Archive → edge-to-edge index grid with giant gutters
- **Unveil:** CSS grid, x=0 bleed, cols 3/4/5/6/7/8 @ base/640/768/1024/1280/1536, gaps 61px → 99/95px (≥1024) → 7vw×95px (≥1536); per-asset `style="aspect-ratio:"`; top-aligned ragged rows; no captions/titles; `cursor-zoom-in`; whitespace ≈45% of row width (§3.4, §5.3).
- **Now:** CSS-columns masonry 2/4/5 cols, `column-gap: var(--space-4)` (16px), inside the gutter, `margin-top --space-7`, visible "Archive" display h1 — `src/routes/archive/+page.svelte:33-51, 91-107`.
- **Files:** `archive/+page.svelte`.
- **Accept:** grid touches both viewport edges; gap measures 61px @390 (3 cols) and 99×95px @1440 (7 cols); each tile carries its asset's exact ratio; h1 sr-only.

### W2-08 Collective → two-corner studio anatomy
- **Unveil:** fixed top-right square image exactly 50vh tall (≥1024 only, doesn't scroll); single text column max-w 432px; stack gap 20px; mission paragraph then list blocks with the label collapsed to a 2px column (runtime-aligned to brand width) at opacity .3, values lh 1.25; mobile ends in a full-bleed square figure mt 56px; center + bottom-right left empty (§5.2).
- **Now:** display h1 + prose + bordered members/press rows with 44px hit boxes and dividers — `src/routes/collective/+page.svelte:13-59, 62-131`.
- **Files:** `collective/+page.svelte` (+ a `ListBlock` pattern or inline), needs one square artwork in fixtures/Sanity (our content).
- **Accept:** @1440 text occupies x 0–432 only; fixed 450×450 image top-right; member/press rows render as label-collapsed list lines (no borders); reveal = 7-unit stagger (W3-03).

### W2-09 Case page display text metrics
- **Unveil:** display blocks runtime-sized, lh 1.0909 uppercase / 1.0762 sentence; backdrop+content fade 0.5s; closing statements in half-viewport modules max-w 283px (§5.4, §2.2).
- **Now:** `clamp(2.6rem,9vw,7.5rem)` w500 −.02em lh .95 title + 68ch standfirst/body — `src/routes/[slug]/+page.svelte:56-64, 128-171`; credits table with `--line` borders :221-240.
- **Files:** `[slug]/+page.svelte`, `Prose.svelte`.
- **Accept:** title renders w400, lh 1.0909, uppercase; standfirst sentence case lh 1.0762; measures capped 283/432px; credits lose hairline borders → label .3 / value 1 rows.

### W2-10 Index view rows: opacity hierarchy, no dividers, hover preview
- **Unveil:** plain text rows (no border dividers); hover preview figure pinned top-right at `height: calc(50svh − 3.5rem)`, lazy image; rows idle at 1, siblings dim (§5.4).
- **Now:** `--line` border per row, `translateX(12px)` hover slide, no preview figure — `src/routes/index/+page.svelte:123-200`; chips with `--line` borders :105-121.
- **Files:** `index/+page.svelte`.
- **Accept:** zero `border-bottom` rules; hover shows cover preview top-right (≥1024); tag chips restyle to the frosted pill recipe (W2-13) — tag filtering stays (our model, constraint).

### W2-11 FatFooter → half-viewport closing band; legal moves into Contact
- **Unveil:** no footer element; routes end in a 50svh (min 320px) centered module: one sentence-case paragraph max-w 283px at x=14; legal/social live in the contact overlay's bottom-left legal nav (x 14, bottom 11px, 12px gaps) (§3.5, §6.4).
- **Now:** bordered FatFooter block (email + rows + colophon) appended to every non-deck route — `src/lib/components/FatFooter.svelte:29-69`, mounted in `+layout.svelte:57-59`.
- **Files:** `FatFooter.svelte` (becomes `ClosingBand`), `ContactOverlay.svelte`, `+layout.svelte`.
- **Accept:** non-deck routes end in the 50svh band; Instagram/colophon render inside the contact overlay bottom-left; no `border-top` footer remains.

### W2-12 Contact overlay layout: centered pill row over frosted sheet
- **Unveil:** pills dead-center (email rect 6px radius, social pill, address pill hidden <640px; 2px gaps; pad 16/14px; label nudge translateY 1.5px; idle .3); legal nav bottom-left; frosted scrim behind; below 640 the ul sits at translateY(75%) (§6.4).
- **Now:** dark sheet, left-aligned grid of underlined links — `src/lib/components/ContactOverlay.svelte:21-39, 41-133`.
- **Files:** `ContactOverlay.svelte`.
- **Accept:** overlay shows page blurred behind (`--sheet` + blur 20/40); email/Instagram/city as pills centered @1440; ink text; `<dialog>` + focus trap stays (constraint).

### W2-13 The universal `.button` recipe (frosted chrome)
- **Unveil:** every control: 6px radius (or pill), `backdrop-filter: blur(24px)`, `::before` 1px currentColor border @ .13, `::after` currentColor fill @ .03, label .3→1, lh 1.05, `@media(hover:hover)` gating, `user-select:none` (§5.0, §2.1).
- **Now:** `.text-button` = bare unstyled word, 44px hit floor — `src/app.css:148-159`; chips/pills hand-rolled per page.
- **Files:** `src/app.css` (add `.button` recipe class), `Nav.svelte`, `ContactOverlay.svelte`, `index/+page.svelte` chips, `open-calls/+page.svelte:76-87` status pill, `VideoChrome.svelte` controls.
- **Accept:** one recipe drives nav cells, pills, chips, video controls; 44px hit floor preserved via padding (constraint). `[BUDGET-RISK]` many blurred elements on one screen — cap backdrop-filter surfaces per view.

### W2-14 Open-calls / legal / 404 retype to the small scale
- **Unveil:** legal pages = text at 10.5px from the axis, single 1s fade; no display titles anywhere (§5.4).
- **Now:** display h1s on every page — `open-calls/+page.svelte:20`, `legal/[slug]/+page.svelte`, `404/+page.svelte` ("Lost in the myth" display).
- **Files:** those three routes.
- **Accept:** all three pages render only 10.5px-scale text at x=14; 404 keeps its copy (ours) at meta scale; h1s sr-only.

**W2 count: 14**

---

## W3 — Motion choreography

### W3-01 Deck physics: telephoto card rail `[CONSTRAINT-COLLIDE]` `[BUDGET-RISK]`
- **Unveil:** WebGL rail — fov 5 camera, slabs at rotY −30°, spacing 0.375, depth z=−x·aspect·1.5, three lerps (scroll .15 / drag .1 / cursor .1), 150ms drag-arm, scene scale .825 while dragging, hover offset (⅔,−.1) expo.out .5s, click-to-open flatten 0.833s + rotY→0 1.25s + camera push, 2s intro sweep from −20, blur-edge shader band (§6.2).
- **Now:** flat native scroll-snap rail, tripled-list loop, mouse drag + wheel→horizontal, smooth re-snap — `src/lib/components/Deck.svelte:97-163, 219-294`.
- **Collision:** CLAUDE.md golden rule 4 (deck scrolls on native CSS scroll-snap; GSAP never owns scroll) + rule 7 (first-load JS ≤100KB — three.js alone breaks it) + TBT/LCP budgets.
- **Resolution to implement:** keep native scroll ownership; approximate the look in DOM — parent `perspective` ≈ telephoto, per-card `rotateY(−30°) translateZ(−|offset|·k)` driven from `scrollLeft` in a rAF transform write (transform/opacity only); drag scale .825 on the rail wrapper; hover = translate offset not zoom; intro sweep = transform from −20·k px over 2s expo-out, skipped under reduced motion. No three.js.
- **Files:** `Deck.svelte`, `Card.svelte`, `src/app.css`.
- **Accept:** @1440 the rail reads angled-and-receding with center card frontal; wheel/drag/snap unchanged; Lighthouse mobile LCP < 2.5s with the deck route's JS delta ≤ +10KB gzip.

### W3-02 Intro preloader + staged entrance `[BUDGET-RISK]`
- **Unveil:** z-99 ground sheet with lerped % counter (`shown += (target−shown)·0.1`), exits 0.5s power1.inOut @ .25 then sheet @ .75; header fades in 0.75s only after; non-home routes skip the visual (§6.1).
- **Now:** no preloader; header/content render immediately — `+layout.svelte`.
- **Files:** new `Preloader.svelte`, `+layout.svelte`, `Deck.svelte` (gate the sweep on it).
- **Resolution:** home-only, gated to first visit per session; counter ties to deck image decode promises; reduced-motion + no-JS render straight through; sheet is the ground color so the LCP image can still paint beneath at the same pixel — verify LCP isn't re-attributed to the sheet.
- **Accept:** first home visit shows count-up → fade; revisits and deep links skip it; mobile LCP stays < 2.5s.

### W3-03 Reveal grammar: scroll-triggered rise → mount-time staggered fades
- **Unveil:** zero scroll-triggered reveals, zero translateY entrances; each route's units fade 0→1 on mount: studio 7 units 1s stagger .15; index rows 1s stagger .05; research section single .75s; legal 1s (§2.4, §6.3).
- **Now:** IntersectionObserver reveal at 20% visibility with `translateY(24px)` — `src/lib/reveal.ts:5-21`, `src/app.css:176-187`; used across `[slug]`, collective, open-calls.
- **Files:** `reveal.ts` (becomes mount-stagger action), `app.css`, all `use:reveal` call sites.
- **Accept:** entrances are opacity-only, fire once on route mount with per-route stagger values; nothing animates on scroll; no-JS still shows everything (prerender stays visible — constraint).

### W3-04 Page transitions: opacity fades over shared ground + home white flash `[CONSTRAINT-COLLIDE]`
- **Unveil:** per-route GSAP fades; → home: white flash in .75s @ .25 / out .75s @ 1.5 covering the deck rebuild; sibling-route arrivals skip the backdrop fade; everything opacity, no transform transitions (§6.3).
- **Now:** View Transitions API morph (card → case hero) + crossfade fallback — `src/routes/+layout.svelte:27-56`; per-word title rise with transform — `[slug]/+page.svelte:148-167`.
- **Collision:** golden rule 3 mandates the VT container morph — it stays (it replaces unveil's WebGL flatten as our signature exit).
- **Files:** `+layout.svelte` (white-flash div on home arrivals), `[slug]/+page.svelte` (replace word-rise with per-span 500ms easeOutCubic fades), `app.css:189-197` (VT timing → 500ms).
- **Accept:** navigating to home flashes ground then sweeps the deck; case-page text fades (no rise); card→case morph still runs.

### W3-05 Contact overlay choreography: rise → fade with stagger
- **Unveil:** open = items fade .75s power1.inOut stagger .15 + scrim .75s; close = items .25s no stagger; Esc/scrim/route-change close; header hides .75s while open (§6.4).
- **Now:** whole dialog `translateY(100%)` rise/fall 600ms ease-inout — `ContactOverlay.svelte:54-69`.
- **Files:** `ContactOverlay.svelte`, `Nav.svelte` (hide while open).
- **Accept:** no transform on open; pills appear in sequence; close is a fast collective fade; header fades out while overlay is open.

### W3-06 Hover language: opacity .3→1 everywhere, 500ms easeOutCubic
- **Unveil:** every label idles .3 and hits 1 on hover/active over 500ms `cubic-bezier(.215,.61,.355,1)`; current route pinned at 1 (§6.5).
- **Now:** instant hue swap `--muted`→`--ink` — `Nav.svelte:90-98`; underline hovers — `FatFooter.svelte:62-64`, `ContactOverlay.svelte:98-115`, collective/press links.
- **Files:** `Nav.svelte`, `ContactOverlay.svelte`, `FatFooter`/ClosingBand, `collective`, `index` chips, `open-calls`.
- **Accept:** no underline hovers, no color transitions; labels animate opacity only (golden-rule clean); `aria-current` cell reads opacity 1.

### W3-07 Index hover: dim siblings + preview fade
- **Unveil:** hovered row → 1, all siblings → .3 over .5s cubicOut; preview image fades in .5s power2.out on load (§5.4, §6.5).
- **Now:** `translateX(12px)` slide + hue swap — `index/+page.svelte:192-199`.
- **Files:** `index/+page.svelte`.
- **Accept:** hovering any row dims the rest; no horizontal movement; preview (W2-10) fades in.

### W3-08 Card hover: zoom → offset shift
- **Unveil:** tile shifts (x ⅔ unit, y −.1) expo.out .5s; touch auto-offsets the centered tile; no scale-up of media (§6.2).
- **Now:** media `scale(1.04)` 600ms — `Card.svelte:131-136`; `:active` press `scale(.98)` :139-141.
- **Files:** `Card.svelte`.
- **Accept:** hover translates the card (≈24px x / −4px y) with easeOutExpo 500ms; no media zoom; press scale may stay (touch affordance, ours).

### W3-09 Lightbox: rising dark sheet → frosted zoom fade
- **Unveil:** `cursor-zoom-in` tiles → z-101 sheet `#ffffffb3` blur 20/40, pad 40/64px; container quadInOut 500ms, media in 500ms delayed 333ms, extra layer 250ms; full-surface `cursor-zoom-out` close (§6.6).
- **Now:** dark `--overlay` dialog rising `translateY(100%)` 600ms — `archive/+page.svelte:119-149`.
- **Files:** `archive/+page.svelte`.
- **Accept:** open/close are fades; media arrives on the 333ms delay; cursors zoom-in/out; note/date chrome at 11px/1 uppercase; `<dialog>` a11y stays.

### W3-10 Header show/hide + theme tween
- **Unveil:** header fades in .75s after intro; hides .75s while contact open; text color tweens .5s to white over imagery routes (§6.1, §2.1).
- **Now:** header always visible, ink only — `Nav.svelte:67-79`.
- **Files:** `Nav.svelte`, theme store (new, runes).
- **Accept:** header participates in intro and contact choreography; color flips over dark media (case hero) via a store-driven 500ms tween.

### W3-11 Remove all translate-text hovers
- **Unveil:** text never slides (§6.5 table is exhaustive).
- **Now:** next-work `translateX(8px)` — `[slug]/+page.svelte:256-264`; open-calls title slide — `open-calls/+page.svelte:89-95`.
- **Files:** those two.
- **Accept:** hovers there are opacity .3→1 only.

### W3-12 Mobile menu dialog → always-visible cells
- **Unveil:** no hamburger/menu exists; the four header cells are the entire nav at every width (§5.0).
- **Now:** mobile hides links behind a full-screen `<dialog>` with display-type rows — `Nav.svelte:48-62, 115-168`.
- **Files:** `Nav.svelte`.
- **Accept:** 390px shows all destinations as equal cells (two rows of cells if 6 don't fit — our IA, constraint); the Menu dialog is deleted.

**W3 count: 12**

---

## W4 — Fine detail

### W4-01 srcset: width ladder → DPR ladder + `<picture>` webp pairing
- **Unveil:** fixed logical box per context, DPR steps [.25,.5,.75,1,1.5,2,3,4], skip candidates < 50px, `src` = dpr 1; `<picture>` always pairs webp `<source>` + fallback; grid `h=256&w=256&q=75&fit=max`, zoom `h=2048`, q90 full-res (§7.2).
- **Now:** width ladders `[480,768,1080]`/`[768…1920]`/`[256,512]` + `auto(format)` q75, bare `<img>` — `src/lib/sanity/image.ts:9-14, 47-54`; `LqipImage.svelte:47-55`.
- **Files:** `image.ts`, `LqipImage.svelte`, fixture variant generator.
- **Accept:** emitted srcset descriptors match the DPR math for each role; fixture mode produces the same ladder locally (constraint); CLS stays < 0.05 (width/height attrs kept).

### W4-02 Per-asset aspect ratios, 4:5 house ratio
- **Unveil:** exact float per asset as inline `aspect-ratio`, image absolute + cover; ~60% portrait, 4:5 dominant; studio art exact 1:1 (§7.1).
- **Now:** card cover hard-forced `4/5` then desktop `height: min(47.5vw, 62vh)` — `Card.svelte:111, 158-168`; archive uses intrinsic ratio via LqipImage.
- **Files:** `Card.svelte`, `archive/+page.svelte`, Sanity/fixture data (expose ratio).
- **Accept:** every tile/cover renders its own asset ratio; no fixed-height override; content model untouched (ratio derives from existing width/height — constraint).

### W4-03 Cursor system: grab/grabbing + exclusion-blend label
- **Unveil:** home body cursor `grab`/`grabbing`/`pointer`; label = bare 10.5px text, `p-3`, `mix-blend-exclusion`, white + `saturate(0)`, follows at lerp 0.1, shows project title (§8, §6.2).
- **Now:** label is an ink chip with padding/background, snaps instantly to the pointer — `src/lib/components/CursorLabel.svelte:13, 35-50`; cursors: rail grab/grabbing only — `Deck.svelte:244-247, 270-273`.
- **Files:** `CursorLabel.svelte`, `Deck.svelte`, `Card.svelte` (data-cursor carries the work title, not "View").
- **Accept:** label renders blended text (no box), trails the pointer with lerp .1 (rAF transform — golden-rule clean); shows the hovered work's title; never mounts on coarse pointers (already true).

### W4-04 Scrollbars hidden globally
- **Unveil:** `::-webkit-scrollbar { display:none }` everywhere (§8).
- **Now:** hidden only on `.rail` (Deck.svelte:237-241) and `.chips` (index/+page.svelte:98-103).
- **Files:** `src/app.css` (global `scrollbar-width:none` + webkit rule on the route sheets).
- **Accept:** no scrollbar visible on any route at any width; keyboard/scroll still work.

### W4-05 Video chrome → unveil controls-bar anatomy `[CONSTRAINT-COLLIDE]`
- **Unveil:** bottom strip p-16/32, gap 16, 11px/1 uppercase: play word (min-w 38px), m:ss counter, invisible range over 2px currentColor track @ .3 + `scaleX(progress)` fill, sound, fullscreen (cover→contain); bar auto-hides 1000ms; HLS startLevel 4 / maxBuffer 5; poster swap on `currentTime > 0` (§7.4).
- **Now:** facade + provider iframe with "Play film"/"Fullscreen" text buttons — `src/lib/components/VideoChrome.svelte:30-93`; card loops play ≥.6 in-view — `Card.svelte:45-66`.
- **Collision:** CLAUDE.md bans >3MB video files in Sanity (embeds only) — keep embeds for films; apply the full bar only to self-hosted loops/mp4s where we own the element; iframe films keep the facade (poster + play word styled to the bar grammar).
- **Files:** `VideoChrome.svelte`, `Card.svelte`.
- **Accept:** any owned `<video>` shows the unveil bar (scaleX scrubber, 11px chrome, 1000ms auto-hide); embeds show a bar-styled facade.

### W4-06 Selection + tap-highlight `[CONSTRAINT-COLLIDE]`
- **Unveil:** `* { user-select:none }`, no `::selection` style, transparent tap highlight (§8).
- **Now:** inverted ink `::selection` — `src/app.css:101-104`; tap-highlight only on Card (Card.svelte:104).
- **Collision:** fidelity ledger §9 #7 marks selection-disabling "don't replicate". Resolution: keep text selectable; drop the loud inverted `::selection` for a quiet `rgb(0 0 0 / .08)` wash; `user-select:none` only on chrome (buttons, nav, deck — already non-content); tap-highlight transparent globally.
- **Accept:** prose remains selectable; chrome doesn't ghost-select during drags; no inverted selection flash.

### W4-07 Hover gating + pointer-fineness classes
- **Unveil:** every hover behind `@media (hover:hover)`; pointer fineness polled 500ms → body classes gate wheel/raycast/label/click-delay (§3.1, §8).
- **Now:** gated on Card only — `Card.svelte:131`; Nav/index/next/open-calls hovers ungated; fineness checked ad-hoc via `matchMedia` per handler (Deck.svelte:90, 101; CursorLabel:11).
- **Files:** all hover rules from W3-06..08, `src/app.css`.
- **Accept:** no sticky-hover states on touch; one shared `(hover:hover)` convention; the polling loop is optional — `matchMedia` listeners suffice (simpler, same behavior).

### W4-08 Optical nudges + ® wordmark detail
- **Unveil:** pill labels `translateY(1.5px)`, list nudges `±0.5/1px`, wordmark `<small>`® at preflight 80% nudged −0.5px, brand cell carries a section word @md+ (§2.3, §5.0).
- **Now:** none; wordmark is plain text — `Nav.svelte:23`.
- **Files:** `Nav.svelte`, `ContactOverlay.svelte` pills.
- **Accept:** pill labels sit optically centered; wordmark renders `dhakamythos<small>®</small>` equivalent styling (our mark, our text — constraint) + current-section word in the brand cell ≥768px.

### W4-09 1px image outset against edge seams
- **Unveil:** project-context images get `inset:-1px; width/height: calc(100%+2px)` to kill hairline seams (§2.3, §7.2).
- **Now:** images sit exactly at 100% — `LqipImage.svelte:67-82`.
- **Files:** `LqipImage.svelte` (opt-in prop for case/hero contexts).
- **Accept:** no 1px ground-colored seam at image edges on fractional-DPR screens.

### W4-10 Loop visibility threshold
- **Unveil:** IntersectionObserver threshold 0, rootMargin 0 on the `<picture>` drives play/pause and lazy video mount (§7.3).
- **Now:** plays at ≥.6 intersection — `Card.svelte:51-57`.
- **Files:** `Card.svelte`.
- **Accept:** loops start as soon as any pixel is visible, pause fully off-screen; data-saver/reduced-motion gates stay (constraint).

### W4-11 Eager/lazy + preload polish
- **Unveil (ledger-corrected):** keep visuals, add `loading=lazy decoding=async` below the fold; `data-sveltekit-preload-data="hover"` (already present — app.html body).
- **Now:** already lazy/async + LCP preload — `LqipImage.svelte:47-55`, `routes/+page.svelte:27-36`. Delta is only to keep this through the W2-07 grid rebuild (first-row tiles eager, rest lazy).
- **Files:** `archive/+page.svelte` after W2-07.
- **Accept:** rebuilt archive keeps row-1 eager / rest lazy; Lighthouse image audit clean.

**W4 count: 11**

---

## Tally

| Wave | Items | Collisions | Budget risks |
|---|---|---|---|
| W1 tokens | 9 | — | W1-04 |
| W2 type+layout | 14 | W2-02, W2-13 (mitigated) | W2-05, W2-13 |
| W3 motion | 12 | W3-01, W3-04 | W3-01, W3-02 |
| W4 detail | 11 | W4-05, W4-06 | — |
| **Total** | **46** | | |
