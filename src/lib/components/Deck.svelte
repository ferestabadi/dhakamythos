<script lang="ts">
	import Card from './Card.svelte';
	import { appState } from '$lib/app-state.svelte';
	import type { WorkCard } from '$lib/sanity/types';

	let { works }: { works: WorkCard[] } = $props();

	const n = $derived(works.length);
	const looping = $derived(n > 1);

	let rail: HTMLUListElement | undefined = $state();
	/* Clones render only after hydration: prerendered HTML carries one
	   canonical set (no duplicate content, works without JS), then the list
	   is tripled and silently re-centred for the loop. */
	let cloned = $state(false);
	let active = $state(0);
	/* armed drag scales the whole scene down (grammar §6.2) */
	let dragScaled = $state(false);

	/* Telephoto depth slope. The source renders the rail through a 5° fov
	   camera with z = −x·aspect·1.5, which projects to ≈6% scale loss per
	   card step; under --deck-perspective the same loss needs ≈0.38px of
	   translateZ per px of offset from the viewport center. Signed: left
	   neighbors come forward, right neighbors recede — a diagonal rail. */
	const DEPTH_PER_PX = 0.38;
	const SWEEP_STEPS = 20;

	let step = 1; // card stride in px, remeasured lazily
	let railW = 0;
	let tiles: HTMLLIElement[] = [];
	let tileCenters: number[] = [];
	const setWidth = () => (rail ? rail.scrollWidth / (cloned ? 3 : 1) : 0);

	function measure() {
		if (!rail) return;
		tiles = Array.from(rail.querySelectorAll('li'));
		tileCenters = tiles.map((t) => t.offsetLeft + t.offsetWidth / 2);
		railW = rail.clientWidth;
		step = tiles.length > 1 ? tiles[1].offsetLeft - tiles[0].offsetLeft : railW;
		lastPos = -1; // force a transform pass with the new geometry
	}

	$effect(() => {
		if (rail && looping) cloned = true;
	});

	// after the clones exist, start on the canonical (middle) set pre-paint
	$effect(() => {
		if (cloned && rail) {
			measure();
			pos = target = setWidth();
		}
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
	const WHEEL_GAIN = 1; // px of rail per px of wheel delta
	const TOUCH_GAIN = 1.75; // touch divisor is half the mouse one (§6.2)
	let pos = 0; // virtual scroll position along the strip, px
	let target = 0;
	let virtual = $state(false); // flips once JS takes the rail over
	let lastPos = -1;
	let centered: HTMLLIElement | null = null;
	let coarsePointer = false;
	let reduceMotion = false;

	function decorate() {
		if (!rail || tiles.length === 0) return;
		// ease toward the hand or the wheel; snap the sub-pixel tail closed
		const d = target - pos;
		if (reduceMotion) pos = target;
		else if (Math.abs(d) >= 0.5) pos += d * (dragScaled ? DRAG_LERP : LERP);
		else pos = target;
		// clone wrap: keep the window inside the middle set, mid-glide too
		if (cloned) {
			const set = setWidth();
			if (set > 0) {
				while (pos < set * 0.5) {
					pos += set;
					target += set;
				}
				while (pos >= set * 1.5) {
					pos -= set;
					target -= set;
				}
			}
		}
		if (pos === lastPos) return;
		lastPos = pos;
		const mid = pos + railW / 2;
		const x = (-pos).toFixed(2);
		let nearest = -1;
		let nearestDist = Infinity;
		for (let i = 0; i < tiles.length; i++) {
			const off = tileCenters[i] - mid;
			const dist = Math.abs(off);
			if (dist < nearestDist) {
				nearestDist = dist;
				nearest = i;
			}
			// every tile rides the virtual position; depth only near the window
			tiles[i].style.transform =
				`translate3d(${x}px, 0, 0) perspective(var(--deck-perspective)) rotateY(var(--deck-rot)) translateZ(${dist > railW ? 0 : (-off * DEPTH_PER_PX).toFixed(1)}px)`;
			if (dist <= railW) {
				// nearer (left) tiles paint over receded ones when growth overlaps
				tiles[i].style.zIndex = String(200 - Math.round(off / step));
			}
		}
		/* touch stand-in for hover: flip the auto-offset class only when the
		   centered tile changes (Card.svelte styles it) */
		if (coarsePointer && nearest >= 0 && tiles[nearest] !== centered) {
			centered?.classList.remove('is-center');
			centered = tiles[nearest];
			centered.classList.add('is-center');
		}
		active = mod(Math.round(pos / step), n);
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
	   Holds the rail ~20 card-steps left until the preloader flips
	   appState.ready, then releases over --dur-sweep. Reduced motion skips
	   the whole figure; no-JS never sees the held state (transform is set
	   only from here). Replays on every return to home, like the source. */
	let swept = false;
	$effect(() => {
		if (!rail || swept) return;
		const el = rail;
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
			swept = true;
			return;
		}
		if (step <= 1) measure();
		el.style.transform = `translate3d(${-SWEEP_STEPS * step}px, 0, 0)`;
		if (!appState.ready) return; // hold the pre-sweep state
		swept = true;
		void el.offsetWidth; // commit the start position before transitioning
		el.classList.add('sweep');
		el.style.transform = 'translate3d(0, 0, 0)';
	});

	/* ←/→ move one card, Enter opens the focused card (native link). */
	function onKeydown(e: KeyboardEvent) {
		if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
		if (!rail) return;
		e.preventDefault();
		const dir = e.key === 'ArrowRight' ? 1 : -1;
		// land on a card boundary; the frame lerp animates the move
		target = (Math.round(target / step) + dir) * step;
		const links = rail.querySelectorAll<HTMLAnchorElement>('li[data-canonical] a');
		links[mod(active + dir, n)]?.focus({ preventScroll: true });
	}

	/* Tabbing to an off-screen card must bring it into the window — the rail
	   no longer scrolls natively, so focus drives the target instead. */
	function onFocusin(e: FocusEvent) {
		const li = (e.target as HTMLElement).closest('li');
		const i = li ? tiles.indexOf(li as HTMLLIElement) : -1;
		if (i >= 0) target = tileCenters[i] - railW / 2;
	}

	/* Wheel feeds the target on both axes (§6.2 folds deltaX in — trackpad
	   pans and mouse wheels land in the same lerp); the frame loop supplies
	   the glide, and reduced motion collapses it to an instant step. */
	function wheel(el: HTMLElement) {
		const onWheel = (e: WheelEvent) => {
			e.preventDefault();
			const lines = e.deltaMode === 1 ? 40 : 1; // Firefox reports lines
			target += (e.deltaY + e.deltaX) * lines * WHEEL_GAIN;
		};
		el.addEventListener('wheel', onWheel, { passive: false });
		return { destroy: () => el.removeEventListener('wheel', onWheel) };
	}

	let dragged = 0;
	function drag(el: HTMLElement) {
		let startX = 0;
		let lastX = 0;
		let startTarget = 0;
		let gain = 1;
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
		const down = (e: PointerEvent) => {
			if (e.pointerType === 'mouse' && e.button !== 0) return;
			pointerId = e.pointerId;
			lastX = downX = e.clientX;
			dragged = 0;
			gain = e.pointerType === 'mouse' ? 1 : TOUCH_GAIN;
			if (e.pointerType === 'mouse') armTimer = setTimeout(arm, 150);
		};
		const move = (e: PointerEvent) => {
			if (pointerId !== e.pointerId) return;
			lastX = e.clientX;
			// touch arms past a tap-sized slop, with no hold delay
			if (!armed && e.pointerType !== 'mouse' && Math.abs(e.clientX - downX) > 6) arm();
			if (!armed) return;
			const dx = e.clientX - startX;
			dragged = Math.max(dragged, Math.abs(dx));
			target = startTarget - dx * gain;
		};
		const up = () => {
			clearTimeout(armTimer);
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
		el.addEventListener('pointerdown', down);
		el.addEventListener('pointermove', move);
		// up/cancel on window: an un-armed release outside the rail must
		// still disarm the pending 150ms timer, or the scene sticks scaled
		window.addEventListener('pointerup', up);
		window.addEventListener('pointercancel', up);
		el.addEventListener('click', clickCapture, true);
		return {
			destroy() {
				clearTimeout(armTimer);
				el.removeEventListener('pointerdown', down);
				el.removeEventListener('pointermove', move);
				window.removeEventListener('pointerup', up);
				window.removeEventListener('pointercancel', up);
				el.removeEventListener('click', clickCapture, true);
			}
		};
	}

	const copies = $derived(cloned ? [0, 1, 2] : [1]);
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
	<section class="deck" aria-label="Works">
		<div class="scene" class:scaled={dragScaled}>
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<!-- keyboard events bubble up from the focusable card links; the rail
			     itself stays out of the tab order. data-deck is the Preloader
			     contract: it finds [data-deck] img, decodes, then flips ready. -->
			<ul
				bind:this={rail}
				class="rail"
				class:virtual
				data-deck
				onkeydown={onKeydown}
				onfocusin={onFocusin}
				use:wheel
				use:drag
			>
				{#each copies as copy (copy)}
					{#each works as work, i (`${copy}-${work.slug}`)}
						<li data-canonical={copy === 1 ? '' : undefined} aria-hidden={copy === 1 ? undefined : true}>
							<Card
								{work}
								position={i + 1}
								total={n}
								eager={copy === 1 && i < 2}
								priority={copy === 1 && i === 0}
								focusable={copy === 1}
								vtName={copy === 1 ? `work-${work.slug}` : undefined}
							/>
						</li>
					{/each}
				{/each}
			</ul>
		</div>

		<!-- the counter wears the bottom-right switcher idiom (grammar §5.4) -->
		<p class="switcher button button--pill type-button" aria-hidden="true">
			<span class="nudge">{pad(active + 1)} / {pad(n)}</span>
		</p>
	</section>
{/if}

<style>
	.deck {
		/* local sizes the token sheet doesn't carry */
		--rail-pad-y: 64px; /* headroom: forward tiles scale up to ~1.25 plus the
		   hover lift — without it the rail's auto overflow clips them */
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
	}

	/* armed drag shrinks the whole scene; back to 1 on release (§6.2) */
	.scene {
		transition: transform var(--dur-beat) var(--ease-out-expo);
	}

	.scene.scaled {
		transform: scale(var(--deck-scale-drag));
	}

	.rail {
		display: flex;
		align-items: center;
		gap: var(--gap-cell);
		margin: 0;
		padding: var(--rail-pad-y) var(--axis-x);
		list-style: none;
		/* native overflow scroll is only the no-JS fallback; .virtual hands
		   the rail to the lerp loop (operator call, 2026-06-11 — §6.2 feel) */
		overflow-x: auto;
		overscroll-behavior-x: contain;
		scrollbar-width: none;
	}

	/* the intro sweep transitions only once .sweep is set — the held
	   pre-sweep transform applies instantly */
	:global(.rail.sweep) {
		transition: transform var(--dur-sweep) var(--ease-out-expo);
	}

	.rail::-webkit-scrollbar {
		display: none;
	}

	/* JS-owned rail: gestures feed the lerp, nothing scrolls natively */
	.rail.virtual {
		overflow: hidden;
		touch-action: none;
	}

	@media (pointer: fine) {
		.rail {
			cursor: grab;
		}
	}

	:global(.rail.dragging) {
		cursor: grabbing;
	}

	li {
		position: relative;
		flex: none;
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
