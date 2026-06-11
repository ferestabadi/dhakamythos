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
		lastLeft = -1; // force a transform pass with the new geometry
	}

	$effect(() => {
		if (rail && looping) cloned = true;
	});

	// after the clones exist, jump to the canonical (middle) set pre-paint
	$effect(() => {
		if (cloned && rail) {
			measure();
			rail.scrollLeft = setWidth();
		}
	});

	function mod(v: number, m: number) {
		return ((v % m) + m) % m;
	}

	/* ---- the per-frame decoration (gap W3-01) ----
	   One rAF owns every scroll-coupled write: scrollLeft is read once, then
	   tiles get transform (and stacking order) only — never layout. Tiles
	   more than a viewport from center are skipped; the CSS default transform
	   covers them until they approach. */
	let lastLeft = -1;
	let centered: HTMLLIElement | null = null;
	let coarsePointer = false;

	function decorate() {
		if (!rail || tiles.length === 0) return;
		const left = rail.scrollLeft;
		if (left === lastLeft) return;
		lastLeft = left;
		const mid = left + railW / 2;
		let nearest = -1;
		let nearestDist = Infinity;
		for (let i = 0; i < tiles.length; i++) {
			const off = tileCenters[i] - mid;
			const dist = Math.abs(off);
			if (dist < nearestDist) {
				nearestDist = dist;
				nearest = i;
			}
			if (dist > railW) continue;
			tiles[i].style.transform =
				`perspective(var(--deck-perspective)) rotateY(var(--deck-rot)) translateZ(${(-off * DEPTH_PER_PX).toFixed(1)}px)`;
			// nearer (left) tiles paint over receded ones when growth overlaps
			tiles[i].style.zIndex = String(200 - Math.round(off / step));
		}
		/* touch stand-in for hover: flip the auto-offset class only when the
		   centered tile changes (Card.svelte styles it) */
		if (coarsePointer && nearest >= 0 && tiles[nearest] !== centered) {
			centered?.classList.remove('is-center');
			centered = tiles[nearest];
			centered.classList.add('is-center');
		}
		active = mod(Math.round(left / step), n);
	}

	$effect(() => {
		if (!rail) return;
		coarsePointer = !matchMedia('(pointer: fine)').matches;
		let raf = 0;
		const frame = () => {
			raf = requestAnimationFrame(frame);
			decorate();
		};
		raf = requestAnimationFrame(frame);
		return () => cancelAnimationFrame(raf);
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

	/* silent re-centre at the clone boundaries, between snaps */
	function recenter() {
		if (!rail || !cloned) return;
		const set = setWidth();
		if (rail.scrollLeft < set * 0.5) rail.scrollLeft += set;
		else if (rail.scrollLeft >= set * 1.5) rail.scrollLeft -= set;
		lastLeft = -1;
		decorate(); // re-decorate in the same frame so the jump stays invisible
	}

	function scrollEnd(el: HTMLElement) {
		if ('onscrollend' in window) {
			el.addEventListener('scrollend', recenter);
			return { destroy: () => el.removeEventListener('scrollend', recenter) };
		}
		let t: ReturnType<typeof setTimeout>;
		const debounced = () => {
			clearTimeout(t);
			t = setTimeout(recenter, 150);
		};
		el.addEventListener('scroll', debounced, { passive: true });
		return { destroy: () => el.removeEventListener('scroll', debounced) };
	}

	/* ←/→ move one card, Enter opens the focused card (native link). */
	function onKeydown(e: KeyboardEvent) {
		if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
		if (!rail) return;
		e.preventDefault();
		const dir = e.key === 'ArrowRight' ? 1 : -1;
		// smoothing only on pointer:fine (golden rule 2); touch + reduced
		// motion jump instantly
		const smooth =
			matchMedia('(pointer: fine)').matches &&
			!matchMedia('(prefers-reduced-motion: reduce)').matches;
		rail.scrollBy({ left: dir * step, behavior: smooth ? 'smooth' : 'auto' });
		const links = rail.querySelectorAll<HTMLAnchorElement>('li[data-canonical] a');
		links[mod(active + dir, n)]?.focus({ preventScroll: true });
	}

	/* Desktop only: vertical wheel drives the rail; drag scrolls it.
	   Both set scrollLeft directly — native scroll keeps ownership. */
	function wheelToHorizontal(el: HTMLElement) {
		const onWheel = (e: WheelEvent) => {
			if (!matchMedia('(pointer: fine)').matches) return;
			if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
			e.preventDefault();
			el.scrollLeft += e.deltaY;
		};
		el.addEventListener('wheel', onWheel, { passive: false });
		return { destroy: () => el.removeEventListener('wheel', onWheel) };
	}

	let dragged = 0;
	function drag(el: HTMLElement) {
		let startX = 0;
		let lastX = 0;
		let startLeft = 0;
		let pointerId: number | null = null;
		let armed = false;
		let armTimer: ReturnType<typeof setTimeout> | undefined;

		// drag arms only after a 150ms hold (grammar §6.2, §8); quicker
		// presses stay clicks
		const arm = () => {
			if (pointerId === null || !el.isConnected) return;
			armed = true;
			startX = lastX;
			startLeft = el.scrollLeft;
			el.classList.add('dragging');
			dragScaled = true;
			try {
				el.setPointerCapture(pointerId);
			} catch {
				/* pointer already lifted */
			}
		};
		const down = (e: PointerEvent) => {
			if (e.pointerType !== 'mouse' || e.button !== 0) return;
			pointerId = e.pointerId;
			lastX = e.clientX;
			dragged = 0;
			armTimer = setTimeout(arm, 150);
		};
		const move = (e: PointerEvent) => {
			if (pointerId === null) return;
			lastX = e.clientX;
			if (!armed) return;
			const dx = e.clientX - startX;
			dragged = Math.max(dragged, Math.abs(dx));
			el.scrollLeft = startLeft - dx;
		};
		const up = () => {
			clearTimeout(armTimer);
			if (pointerId === null) return;
			pointerId = null;
			if (!armed) return;
			armed = false;
			el.classList.remove('dragging');
			dragScaled = false;
			// drag is mouse-only, so smooth re-snap is within golden rule 2
			const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
			el.scrollTo({
				left: Math.round(el.scrollLeft / step) * step,
				behavior: smooth ? 'smooth' : 'auto'
			});
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
				data-deck
				onkeydown={onKeydown}
				use:scrollEnd
				use:wheelToHorizontal
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
		overflow-x: auto;
		overscroll-behavior-x: contain;
		scroll-snap-type: x mandatory;
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

	@media (pointer: fine) {
		.rail {
			cursor: grab;
		}
	}

	:global(.rail.dragging) {
		scroll-snap-type: none;
		cursor: grabbing;
	}

	li {
		position: relative;
		flex: none;
		scroll-snap-align: center;
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
