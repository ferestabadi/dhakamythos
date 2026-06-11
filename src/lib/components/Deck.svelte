<script lang="ts">
	import Card from './Card.svelte';
	import { appState } from '$lib/app-state.svelte';
	import type { WorkCard } from '$lib/sanity/types';

	let { works }: { works: WorkCard[] } = $props();

	const n = $derived(works.length);
	const looping = $derived(n > 1);

	let rail: HTMLUListElement | undefined = $state();
	/* §5.1: the list is duplicated once when under 20 tiles, so the dense
	   overlapped rail reads full at any position. There are no loop clones —
	   the frame loop wraps each tile's drawn position around the strip's
	   cycle (the source's own rail math), so the DOM never re-lays-out
	   after hydration (CLS 0) and the prerendered markup is the final one. */
	const strip = $derived(n > 1 && n < 20 ? [...works, ...works] : works);
	let active = $state(0);
	/* armed drag scales the whole scene down (grammar §6.2) */
	let dragScaled = $state(false);

	/* Telephoto depth slope. The source renders the rail through a 5° fov
	   camera with z = −x·aspect·1.5: each card step recedes ≈2.3% in scale,
	   which under --deck-perspective (1600px) is ≈38px of translateZ per
	   stride. Signed: left neighbors come forward, right neighbors recede —
	   a diagonal rail. */
	const DEPTH_PER_STEP = 38;
	const SWEEP_STEPS = 20;
	/* the rail line's rise: px up per px of rightward offset from center —
	   the source's high camera (y 13.33 looking at origin) projects the rail
	   as a diagonal from bottom-left to top-right (operator call, 2026-06-11) */
	const RISE = 0.45;

	let step = 1; // card stride in px (one li), remeasured lazily
	let railW = 0;
	let tiles: HTMLLIElement[] = [];
	let tileCenters: number[] = [];
	/* every li is exactly one stride wide, so the strip's cycle is
	   step × tile count — exact, where scrollWidth would fold in padding
	   and card overflow */
	const span = () => step * tiles.length;

	function measure() {
		if (!rail) return;
		tiles = Array.from(rail.querySelectorAll('li'));
		// center of the card itself — it overflows its stride-wide li
		tileCenters = tiles.map(
			(t) => t.offsetLeft + ((t.firstElementChild as HTMLElement)?.offsetWidth || t.offsetWidth) / 2
		);
		railW = rail.clientWidth;
		step = tiles.length > 1 ? tiles[1].offsetLeft - tiles[0].offsetLeft : railW;
		lastPos = NaN; // force a transform pass with the new geometry
	}

	// open with the first work centered, pre-paint
	$effect(() => {
		if (!rail) return;
		measure();
		pos = target = tileCenters.length ? tileCenters[0] - railW / 2 : 0;
	});

	function mod(v: number, m: number) {
		return ((v % m) + m) % m;
	}

	/* ---- the virtual rail (operator call, 2026-06-11: unveil-exact scroll
	   feel on every pointer; grammar §6.2) ----
	   The rail is not a scroll container once JS owns it: wheel, drag, touch
	   and keyboard all feed `target`, and one rAF eases `pos` toward it —
	   lerp .15 free, .1 under the hand — then writes per-tile transforms
	   only, never layout. The clone wrap teleports pos and target together
	   inside the same frame, so the loop is seamless mid-glide. Without JS
	   the rail falls back to plain native overflow scroll. */
	const LERP = 0.15;
	const DRAG_LERP = 0.1;
	/* gains, tuned to the dense stride (~1/4 of a full card width): a wheel
	   notch still moves about a third of a card, and touch runs at twice the
	   mouse rate — §6.2's touch divisor is half the mouse one */
	const WHEEL_GAIN = 0.3; // px of rail per px of wheel delta
	const DRAG_GAIN = 0.5; // px of rail per px of mouse-drag
	const TOUCH_GAIN = 1;
	let pos = 0; // virtual scroll position along the strip, px
	let target = 0;
	let virtual = $state(false); // flips once JS takes the rail over
	let lastPos = NaN;
	let centered: HTMLLIElement | null = null;
	let coarsePointer = false;
	let reduceMotion = false;
	/* intro sweep state — a 20-stride offset folded into the drawn position
	   and eased out by the frame loop, so per-tile depth and stacking track
	   the motion frame by frame (a rail-level transform froze them) */
	let introOffset = 0;
	let sweepFrom = 0;
	let sweepT0 = 0;
	let sweepMs = 2000; // overwritten from --dur-sweep at release

	function decorate() {
		if (!rail || tiles.length === 0) return;
		// ease toward the hand or the wheel; snap the sub-pixel tail closed
		const d = target - pos;
		if (reduceMotion) pos = target;
		else if (Math.abs(d) >= 0.5) pos += d * (dragScaled ? DRAG_LERP : LERP);
		else pos = target;
		const cycle = looping ? span() : 0;
		// keep the numbers small — the rail is cyclic, so this is invisible
		if (cycle > 0) {
			while (pos < -cycle) {
				pos += cycle;
				target += cycle;
			}
			while (pos > cycle) {
				pos -= cycle;
				target -= cycle;
			}
		}
		// the sweep's expo-out tail; reduced motion collapses it mid-flight
		if (sweepT0) {
			if (reduceMotion) {
				introOffset = 0;
				sweepT0 = 0;
			} else {
				const t = (performance.now() - sweepT0) / sweepMs;
				if (t >= 1) {
					introOffset = 0;
					sweepT0 = 0;
				} else {
					introOffset = sweepFrom * Math.pow(2, -10 * t);
				}
			}
		}
		const drawn = pos + introOffset;
		if (drawn === lastPos) return;
		lastPos = drawn;
		const mid = railW / 2;
		const depthPerPx = step > 1 ? DEPTH_PER_STEP / step : 0;
		let nearest = -1;
		let nearestDist = Infinity;
		for (let i = 0; i < tiles.length; i++) {
			/* each tile's screen center wraps around the strip's cycle —
			   the source's rail math, so the window reads full at any
			   position with no DOM clones */
			let c = tileCenters[i] - drawn;
			if (cycle > 0) c = mid + mod(c - mid + cycle / 2, cycle) - cycle / 2;
			const off = c - mid;
			if (Math.abs(off) < nearestDist) {
				nearestDist = Math.abs(off);
				nearest = i;
			}
			/* depth from the half-frame-clamped offset: past the frame edge a
			   tile is off-screen, and an unclamped translateZ would run toward
			   the perspective distance and blow the projection up */
			const zoff = Math.max(-mid, Math.min(mid, off));
			tiles[i].style.transform =
				`translate3d(${(c - tileCenters[i]).toFixed(2)}px, ${(-off * RISE).toFixed(2)}px, 0) perspective(var(--deck-perspective)) rotateY(var(--deck-rot)) translateZ(${(-zoff * depthPerPx).toFixed(1)}px)`;
			// nearer (left) tiles paint over receded ones where they overlap
			tiles[i].style.zIndex = String(200 - Math.round(off / step));
		}
		/* touch stand-in for hover: flip the auto-offset class only when the
		   centered tile changes (Card.svelte styles it) */
		if (coarsePointer && nearest >= 0 && tiles[nearest] !== centered) {
			centered?.classList.remove('is-center');
			centered = tiles[nearest];
			centered.classList.add('is-center');
		}
		if (nearest >= 0) active = nearest % n;
	}

	$effect(() => {
		if (!rail) return;
		coarsePointer = !matchMedia('(pointer: fine)').matches;
		const rmq = matchMedia('(prefers-reduced-motion: reduce)');
		reduceMotion = rmq.matches;
		const onRmq = () => (reduceMotion = rmq.matches);
		rmq.addEventListener('change', onRmq);
		virtual = true; // JS owns the rail from here; CSS drops the fallback scroll
		let raf = 0;
		const frame = () => {
			raf = requestAnimationFrame(frame);
			decorate();
		};
		raf = requestAnimationFrame(frame);
		return () => {
			cancelAnimationFrame(raf);
			rmq.removeEventListener('change', onRmq);
		};
	});

	/* ---- intro sweep (grammar §6.2) ----
	   Holds the rail 20 strides off its rest until the covering layer starts
	   lifting — the preloader on first visits (appState.ready), the arrival
	   flash on client-side returns (appState.covered, §6.3) — then glides
	   home over --dur-sweep through the frame loop, so the diagonal
	   recession holds mid-sweep. Reduced motion skips the whole figure;
	   no-JS never sees the held state (only decorate() draws it). Replays on
	   every return to home, like the source. */
	let swept = false;
	$effect(() => {
		if (!rail || swept) return;
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
			swept = true;
			return;
		}
		if (step <= 1) measure();
		introOffset = SWEEP_STEPS * step;
		lastPos = -1; // redraw the held position
		if (!appState.ready || appState.covered) return; // hold under the cover
		swept = true;
		sweepFrom = introOffset;
		// the computed token may serialize as "2s" or "2000ms"
		const dur = getComputedStyle(rail).getPropertyValue('--dur-sweep').trim();
		sweepMs = (parseFloat(dur) || 2) * (dur.endsWith('ms') ? 1 : 1000);
		sweepT0 = performance.now();
	});

	/* Tabbing to an off-screen card must bring it into the window — but a
	   pointer press and the arrow handler move the rail themselves, so the
	   focus they cause must not re-aim it. */
	let focusSteers = true;

	/* ←/→ move one card, Enter opens the focused card (native link). */
	function onKeydown(e: KeyboardEvent) {
		if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
		if (!rail) return;
		e.preventDefault();
		const dir = e.key === 'ArrowRight' ? 1 : -1;
		// land on a card boundary; the frame lerp animates the move
		target = (Math.round(target / step) + dir) * step;
		const links = rail.querySelectorAll<HTMLAnchorElement>('li[data-canonical] a');
		focusSteers = false;
		links[mod(active + dir, n)]?.focus({ preventScroll: true });
		focusSteers = true;
	}

	function onFocusin(e: FocusEvent) {
		if (!focusSteers) return;
		const li = (e.target as HTMLElement).closest('li');
		const i = li ? tiles.indexOf(li as HTMLLIElement) : -1;
		if (i >= 0) target = tileCenters[i] - railW / 2;
	}

	/* Wheel feeds the target on both axes (§6.2 folds deltaX in — trackpad
	   pans and mouse wheels land in the same lerp); the frame loop supplies
	   the glide, and reduced motion collapses it to an instant step.
	   Listens on the window: scrolling ANYWHERE on the home page moves the
	   carousel (operator call, 2026-06-11 — the home is one instrument).
	   Only the open contact overlay takes the wheel back. */
	function wheel(_el: HTMLElement) {
		const onWheel = (e: WheelEvent) => {
			if (appState.contactOpen) return;
			e.preventDefault();
			const lines = e.deltaMode === 1 ? 40 : 1; // Firefox reports lines
			target += (e.deltaY + e.deltaX) * lines * WHEEL_GAIN;
		};
		window.addEventListener('wheel', onWheel, { passive: false });
		return { destroy: () => window.removeEventListener('wheel', onWheel) };
	}

	let dragged = 0;
	/* The drag surface is the whole deck section, not the rail — a swipe or
	   press-drag anywhere on the home page moves the carousel (operator
	   call, 2026-06-11). Touch folds BOTH axes into the stride (an up-swipe
	   advances like a down-scroll); a mouse drag stays x-only. */
	function drag(el: HTMLElement) {
		let startX = 0;
		let startY = 0;
		let lastX = 0;
		let lastY = 0;
		let startTarget = 0;
		let gain = 1;
		let bothAxes = false;
		let pointerId: number | null = null;
		let armed = false;
		let armTimer: ReturnType<typeof setTimeout> | undefined;

		// a mouse drag arms only after a 150ms hold (grammar §6.2, §8) so
		// quick presses stay clicks; a touch arms on its first real movement
		const arm = () => {
			if (pointerId === null || !el.isConnected) return;
			armed = true;
			target = pos; // the hand takes the rail from any in-flight glide
			startX = lastX;
			startY = lastY;
			startTarget = target;
			el.classList.add('dragging');
			dragScaled = true;
			try {
				el.setPointerCapture(pointerId);
			} catch {
				/* pointer already lifted */
			}
		};
		let downX = 0;
		let downY = 0;
		const down = (e: PointerEvent) => {
			if (appState.contactOpen) return;
			if (e.pointerType === 'mouse' && e.button !== 0) return;
			pointerId = e.pointerId;
			lastX = downX = e.clientX;
			lastY = downY = e.clientY;
			dragged = 0;
			focusSteers = false; // mousedown focuses the card — not a Tab
			bothAxes = e.pointerType !== 'mouse';
			gain = bothAxes ? TOUCH_GAIN : DRAG_GAIN;
			if (!bothAxes) armTimer = setTimeout(arm, 150);
		};
		const move = (e: PointerEvent) => {
			if (pointerId !== e.pointerId) return;
			lastX = e.clientX;
			lastY = e.clientY;
			// touch arms past a tap-sized slop in any direction, no hold delay
			if (
				!armed &&
				bothAxes &&
				Math.max(Math.abs(e.clientX - downX), Math.abs(e.clientY - downY)) > 6
			)
				arm();
			if (!armed) return;
			const d = e.clientX - startX + (bothAxes ? e.clientY - startY : 0);
			dragged = Math.max(dragged, Math.abs(d));
			target = startTarget - d * gain;
		};
		const up = () => {
			clearTimeout(armTimer);
			focusSteers = true;
			if (pointerId === null) return;
			pointerId = null;
			if (!armed) return;
			armed = false;
			el.classList.remove('dragging');
			dragScaled = false;
			// no end-snap: the lerp tail glides the rail to rest (§6.2)
		};
		const clickCapture = (e: MouseEvent) => {
			// a drag is not a click — keep the card link from navigating
			if (dragged > 8) {
				e.preventDefault();
				e.stopPropagation();
			}
		};
		// native anchor/image drag-and-drop would hijack the pointer mid-drag
		// (ghost image, pointercancel) — belt and braces with the cards'
		// draggable="false"
		const nativeDrag = (e: Event) => e.preventDefault();
		el.addEventListener('pointerdown', down);
		el.addEventListener('pointermove', move);
		// up/cancel on window: an un-armed release outside the rail must
		// still disarm the pending 150ms timer, or the scene sticks scaled
		window.addEventListener('pointerup', up);
		window.addEventListener('pointercancel', up);
		el.addEventListener('click', clickCapture, true);
		el.addEventListener('dragstart', nativeDrag);
		return {
			destroy() {
				clearTimeout(armTimer);
				el.removeEventListener('pointerdown', down);
				el.removeEventListener('pointermove', move);
				window.removeEventListener('pointerup', up);
				window.removeEventListener('pointercancel', up);
				el.removeEventListener('click', clickCapture, true);
				el.removeEventListener('dragstart', nativeDrag);
			}
		};
	}

	const pad = (v: number) => String(v).padStart(2, '0');
</script>

<svelte:window onresize={measure} />

{#if n === 0}
	<section class="deck-empty">
		<p class="type-base">First works arriving soon</p>
		<button class="contact button button--pill type-button" onclick={() => (appState.contactOpen = true)}>
			<span class="nudge">Contact</span>
		</button>
	</section>
{:else}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<!-- the whole section is the instrument: wheel and drag anywhere on the
	     home page move the carousel; keyboard events bubble up from the
	     focusable card links -->
	<section class="deck" class:virtual aria-label="Works" use:wheel use:drag>
		<div class="scene" class:scaled={dragScaled}>
			<!-- the rail itself stays out of the tab order. data-deck is the
			     Preloader contract: it finds [data-deck] img, decodes, then
			     flips ready. -->
			<ul
				bind:this={rail}
				class="rail"
				class:virtual
				data-deck
				onkeydown={onKeydown}
				onfocusin={onFocusin}
			>
				{#each strip as work, i (i)}
					{@const canonical = i < n}
					<li data-canonical={canonical ? '' : undefined} aria-hidden={canonical ? undefined : true}>
						<Card
							{work}
							position={(i % n) + 1}
							total={n}
							eager={i < 2}
							priority={i === 0}
							focusable={canonical}
							vtName={canonical ? `work-${work.slug}` : undefined}
						/>
					</li>
				{/each}
			</ul>
		</div>

		<!-- the counter wears the bottom-right switcher idiom (grammar §5.4:
		     40px tall, 16px pads, 6px radius — a rectangle, not a capsule) -->
		<p class="switcher button type-button" aria-hidden="true">
			<span class="nudge">{pad(active + 1)} / {pad(n)}</span>
		</p>
	</section>
{/if}

<style>
	.deck {
		/* local sizes the token sheet doesn't carry */
		--switcher-h: 40px;
		--switcher-pad-x: 16px;
		position: relative;
		height: 100vh;
		height: 100svh;
		display: grid;
		/* pin the single track to the viewport — an auto track would size to
		   the rail's max-content and the rail could never scroll */
		grid-template-columns: minmax(0, 100%);
		align-content: center;
		/* the diagonal rail runs corner to corner — clip it at the viewport */
		overflow: hidden;
	}

	/* the whole section is the gesture surface once JS owns the rail */
	.deck.virtual {
		touch-action: none;
	}

	@media (pointer: fine) {
		.deck.virtual {
			cursor: grab;
		}
	}

	:global(.deck.dragging) {
		cursor: grabbing;
	}

	/* armed drag shrinks the whole scene; back to 1 on release (§6.2) */
	.scene {
		transition: transform var(--dur-beat) var(--ease-out-expo);
	}

	.scene.scaled {
		transform: scale(var(--deck-scale-drag));
	}

	.rail {
		/* rail geometry (§5.1/§6.2): tiles ≈44% of the viewport height as
		   the measured camera projects them (fov 5 at z 35); neighbors
		   overlap ~3/4 of a tile width — world stride 0.375 against a tile
		   ~1.31 wide ⇒ each li is one stride, 23% of the tile height (≈29%
		   of a 4:5 tile's width), and the cards overflow it. Portrait keeps
		   the camera's retreat to z 55 (smaller apparent tiles). */
		--tile-h: clamp(200px, 28svh, 320px);
		--deck-stride: calc(var(--tile-h) * 0.23);
		display: flex;
		align-items: center;
		margin: 0;
		/* headroom: forward tiles scale up ~1.2 plus the hover lift —
		   without it the rail clips them */
		padding: calc(var(--tile-h) * 0.2) var(--axis-x);
		list-style: none;
		/* native overflow scroll is only the no-JS fallback; .virtual hands
		   the rail to the lerp loop (operator call, 2026-06-11 — §6.2 feel) */
		overflow-x: auto;
		overscroll-behavior-x: contain;
		scrollbar-width: none;
	}

	@media (orientation: landscape) {
		.rail {
			--tile-h: clamp(260px, 44svh, 520px);
		}
	}

	.rail::-webkit-scrollbar {
		display: none;
	}

	/* JS-owned rail: gestures feed the lerp, nothing scrolls natively; the
	   diagonal needs free vertical overflow — the section clips instead */
	.rail.virtual {
		overflow: visible;
		touch-action: none;
	}

	li {
		position: relative;
		flex: none;
		/* one stride per li — the card overflows rightward across its
		   neighbors; the rAF's z-index stacking paints left-near tiles on
		   top, the original's draw order */
		width: var(--deck-stride);
		/* resting angle without JS; the rAF adds the signed translateZ.
		   Per-tile perspective keeps every card at the same apparent angle —
		   the telephoto flattening (§6.2) — where a shared vanishing point
		   would skew edge tiles wide-angle. */
		transform: perspective(var(--deck-perspective)) rotateY(var(--deck-rot));
	}

	.switcher {
		position: absolute;
		right: var(--frame);
		bottom: var(--frame);
		display: inline-flex;
		align-items: center;
		height: var(--switcher-h);
		margin: 0;
		padding: 0 var(--switcher-pad-x);
		font-variant-numeric: tabular-nums;
	}

	/* pill-label optical centering (grammar §2.3) */
	.switcher .nudge {
		display: inline-block;
		transform: translateY(1.5px);
	}

	.deck-empty {
		min-height: 100vh;
		min-height: 100svh;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: var(--axis-x);
	}

	.deck-empty p {
		margin: 0;
		opacity: var(--alpha-rest);
	}

	/* same pill anatomy as the switcher (16px pads, 44px hit floor) —
	   .deck's local sizes don't reach this sibling section */
	.deck-empty .contact {
		--pill-pad-x: 16px;
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		padding: 0 var(--pill-pad-x);
		border: 0;
		background: none;
		color: var(--ink);
		font: inherit;
		letter-spacing: inherit;
		text-transform: inherit;
		cursor: pointer;
	}

	.deck-empty .nudge {
		display: inline-block;
		transform: translateY(1.5px);
	}
</style>
