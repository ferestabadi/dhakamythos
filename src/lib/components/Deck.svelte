<script lang="ts">
	import Card from './Card.svelte';
	import { contactOverlay } from '$lib/contact-overlay.svelte';
	import type { WorkCard } from '$lib/sanity/types';

	let { works }: { works: WorkCard[] } = $props();

	const n = $derived(works.length);
	const looping = $derived(n > 1);
	const HINT_KEY = 'dm-deck-hint-seen';

	let rail: HTMLUListElement | undefined = $state();
	/* Clones render only after hydration: prerendered HTML carries one
	   canonical set (no duplicate content, works without JS), then the list
	   is tripled and silently re-centred for the loop. */
	let cloned = $state(false);
	let active = $state(0);
	let hintVisible = $state(false);

	let step = 1; // card stride in px, remeasured lazily
	const setWidth = () => (rail ? rail.scrollWidth / (cloned ? 3 : 1) : 0);

	function measure() {
		if (!rail) return;
		const items = rail.querySelectorAll('li');
		step = items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : rail.clientWidth;
	}

	$effect(() => {
		if (!rail) return;
		if (looping) cloned = true;
		hintVisible = !localStorage.getItem(HINT_KEY);
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

	function onScroll() {
		if (!rail) return;
		active = mod(Math.round(rail.scrollLeft / step), n);
	}

	/* user intent (not the programmatic re-centring) dismisses the hint */
	function dismissHint() {
		if (!hintVisible) return;
		hintVisible = false;
		localStorage.setItem(HINT_KEY, '1');
	}

	/* silent re-centre at the clone boundaries, between snaps */
	function recenter() {
		if (!rail || !cloned) return;
		const set = setWidth();
		if (rail.scrollLeft < set * 0.5) rail.scrollLeft += set;
		else if (rail.scrollLeft >= set * 1.5) rail.scrollLeft -= set;
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
		let startLeft = 0;
		let pointerId: number | null = null;

		const down = (e: PointerEvent) => {
			if (e.pointerType !== 'mouse' || e.button !== 0) return;
			pointerId = e.pointerId;
			startX = e.clientX;
			startLeft = el.scrollLeft;
			dragged = 0;
			el.classList.add('dragging');
			el.setPointerCapture(e.pointerId);
		};
		const move = (e: PointerEvent) => {
			if (pointerId === null) return;
			const dx = e.clientX - startX;
			dragged = Math.max(dragged, Math.abs(dx));
			el.scrollLeft = startLeft - dx;
		};
		const up = () => {
			if (pointerId === null) return;
			pointerId = null;
			el.classList.remove('dragging');
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
		el.addEventListener('pointerup', up);
		el.addEventListener('pointercancel', up);
		el.addEventListener('click', clickCapture, true);
		return {
			destroy() {
				el.removeEventListener('pointerdown', down);
				el.removeEventListener('pointermove', move);
				el.removeEventListener('pointerup', up);
				el.removeEventListener('pointercancel', up);
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
		<p class="type-meta">First works arriving soon</p>
		<button class="text-button type-meta contact" onclick={contactOverlay.open}>Contact</button>
	</section>
{:else}
	<section class="deck" aria-label="Works">
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<!-- keyboard events bubble up from the focusable card links; the rail
		     itself stays out of the tab order -->
		<ul
			bind:this={rail}
			class="rail"
			onscroll={onScroll}
			onkeydown={onKeydown}
			onpointerdown={dismissHint}
			onwheel={dismissHint}
			ontouchstart={dismissHint}
			use:scrollEnd
			use:wheelToHorizontal
			use:drag
			data-cursor="Drag"
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

		<p class="counter type-counter" aria-hidden="true">{pad(active + 1)} / {pad(n)}</p>

		{#if hintVisible}
			<p class="hint type-meta">Swipe to browse</p>
		{/if}
	</section>
{/if}

<style>
	.deck {
		position: relative;
		height: 100dvh;
		display: grid;
		align-content: center;
	}

	.rail {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		margin: 0;
		padding: 0 var(--gutter);
		list-style: none;
		overflow-x: auto;
		overscroll-behavior-x: contain;
		scroll-snap-type: x mandatory;
		scrollbar-width: none;
	}

	.rail::-webkit-scrollbar {
		display: none;
	}

	:global(.rail.dragging) {
		scroll-snap-type: none;
		cursor: grabbing;
	}

	li {
		flex: none;
		scroll-snap-align: center;
	}

	.counter {
		position: absolute;
		left: var(--gutter);
		bottom: var(--space-5);
		margin: 0;
		color: var(--muted);
	}

	.hint {
		position: absolute;
		right: var(--gutter);
		bottom: var(--space-5);
		margin: 0;
		color: var(--muted);
	}

	@media (min-width: 1024px) {
		.rail {
			cursor: grab;
			scroll-padding-left: var(--gutter);
		}

		li {
			scroll-snap-align: start;
		}
	}

	.deck-empty {
		min-height: 100dvh;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: var(--space-4);
		color: var(--muted);
	}

	.deck-empty .contact {
		color: var(--ink);
		text-decoration: underline;
	}
</style>
