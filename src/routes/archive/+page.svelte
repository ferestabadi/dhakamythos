<script lang="ts">
	import ClosingBand from '$lib/components/ClosingBand.svelte';
	import LqipImage from '$lib/components/LqipImage.svelte';
	import { preloadProps } from '$lib/sanity/image';
	import type { Scrap } from '$lib/sanity/types';

	let { data } = $props();
	const scraps = $derived(data.scraps);
	// the first tile is the page's LCP — preload exactly what it will request
	const lcp = $derived(scraps[0] ? preloadProps(scraps[0].image, 'thumb') : null);

	/* Native <dialog> supplies the lightbox floor for free: focus trap, Esc
	   to close, inert background, focus restored to the tapped scrap. The
	   last-opened scrap stays rendered after close so the exit fade never
	   blanks mid-frame. */
	let dialog: HTMLDialogElement | undefined = $state();
	let active: Scrap | null = $state(null);

	function openLightbox(scrap: Scrap) {
		active = scrap;
		dialog?.showModal();
	}

	/* "18 Mar 2024" */
	const dateFormat = new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});

	/* Row one at the widest grid (8 columns ≥1536px) loads eagerly; every
	   tile below stays lazy (gap W4-11). */
	const EAGER_TILES = 8;
</script>

<svelte:head>
	<title>Archive — DHAKAMYTHOS</title>
	<meta name="description" content="Scraps, sketches and process — the wall." />
	{#if lcp}
		<link
			rel="preload"
			as="image"
			href={lcp.href}
			imagesrcset={lcp.imagesrcset}
			imagesizes={lcp.imagesizes}
			type={lcp.type}
			fetchpriority="high"
		/>
	{/if}
</svelte:head>

<!-- the research route fades in whole over the beat, not the long unit (§5.3).
     CSS @starting-style, not the JS reveal: the fade starts at first paint
     instead of after hydration, so the grid's LCP isn't deferred behind the
     throttled-CPU hydration cost. Same 750ms figure either way. -->
<section class="route-sheet entry">
	<h1 class="visually-hidden">Archive</h1>

	{#if scraps.length}
		<!-- the index grid (grammar §3.4): x=0 bleed, no captions, no titles -->
		<div class="wall">
			{#each scraps as scrap, i (scrap.image.url)}
				<button
					class="tile"
					style:aspect-ratio={`${scrap.image.width} / ${scrap.image.height}`}
					aria-label={scrap.note ?? scrap.image.alt}
					onclick={() => openLightbox(scrap)}
				>
					<LqipImage img={scrap.image} role="thumb" fill eager={i < EAGER_TILES} priority={i === 0} />
				</button>
			{/each}
		</div>
	{:else}
		<p class="empty type-base axis-x">First scraps arriving soon</p>
	{/if}

	<ClosingBand />
</section>

<dialog
	bind:this={dialog}
	class="lightbox"
	aria-label={active?.note ?? active?.image.alt ?? 'Scrap'}
>
	{#if active}
		<!-- the entire frosted surface closes — unveil's zoom-out gesture -->
		<button class="close" aria-label="Close" onclick={() => dialog?.close()}></button>
		<figure class="content" style:--ratio={active.image.width / active.image.height}>
			<!-- keyed remount re-arms the LQIP fade for each newly viewed scrap -->
			{#key active}
				<div class="media">
					<LqipImage img={active.image} role="lightbox" eager />
				</div>
			{/key}
			{#if active.note || active.date}
				<figcaption class="chrome type-viewer">
					{#if active.note}<p class="note">{active.note}</p>{/if}
					{#if active.date}<p class="date">{dateFormat.format(new Date(active.date))}</p>{/if}
				</figcaption>
			{/if}
		</figure>
	{/if}
</dialog>

<style>
	/* entry fade from element insertion (prerendered = first paint) */
	.entry {
		opacity: 1;
		transition: opacity var(--dur-beat) var(--ease-quad-inout);
	}

	@starting-style {
		.entry {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.entry {
			transition: none;
		}
	}

	/* ---- the index grid (grammar §3.4): edge-to-edge CSS grid, rows
	   top-aligned so tile bottoms rag — masonry feel without masonry ---- */

	.wall {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--grid-gap);
		align-items: start;
	}

	@media (min-width: 640px) {
		.wall {
			grid-template-columns: repeat(4, 1fr);
			/* §2.3 section bottom pad ≥640 — vh then svh (§3.2 double declaration) */
			padding-bottom: 12.5vh;
			padding-bottom: 12.5svh;
		}
	}

	@media (min-width: 768px) {
		.wall {
			grid-template-columns: repeat(5, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.wall {
			grid-template-columns: repeat(6, 1fr);
			gap: var(--grid-gap-y-lg) var(--grid-gap-x-lg);
		}
	}

	@media (min-width: 1280px) {
		.wall {
			grid-template-columns: repeat(7, 1fr);
		}
	}

	@media (min-width: 1536px) {
		.wall {
			grid-template-columns: repeat(8, 1fr);
			gap: var(--grid-gap-y-lg) var(--grid-gap-x-2xl);
		}
	}

	/* The inline aspect-ratio is the tile's whole box model (gap W4-02);
	   LqipImage `fill` covers it absolutely. */
	.tile {
		position: relative;
		display: flex;
		width: 100%;
		margin: 0;
		border: 0;
		padding: 0;
		background: none;
		color: inherit;
		cursor: zoom-in;
	}

	.empty {
		margin: 0;
		opacity: var(--alpha-rest);
	}

	/* ---- lightbox (grammar §6.6): frosted zoom — opacity fades only,
	   blur constant ---- */

	.lightbox {
		/* §6.6 metrics with no global token — local to this dialog */
		--pad-x: 40px;
		--pad-y: 64px;
		--media-delay: 333ms; /* media trails the sheet by ⅔ of its fade */
		--dur-chrome: 250ms;
		--media-max-h: 70dvh;
		--chrome-gap: 16px;
		--line-gap: 8px;

		position: fixed;
		inset: 0;
		z-index: var(--z-lightbox);
		width: 100%;
		height: 100%;
		max-width: none;
		max-height: none;
		margin: 0;
		border: 0;
		padding: var(--pad-y) var(--pad-x);
		background: var(--sheet);
		-webkit-backdrop-filter: blur(var(--blur-sheet));
		backdrop-filter: blur(var(--blur-sheet));
		color: var(--ink);
		opacity: 0;
		transition:
			opacity var(--dur-label) var(--ease-quad-inout),
			display var(--dur-label) allow-discrete,
			overlay var(--dur-label) allow-discrete;
	}

	@media (min-width: 768px) {
		.lightbox {
			-webkit-backdrop-filter: blur(var(--blur-sheet-md));
			backdrop-filter: blur(var(--blur-sheet-md));
		}
	}

	.lightbox[open] {
		display: grid;
		align-content: center;
		justify-items: center;
		opacity: 1;
	}

	.lightbox::backdrop {
		background: transparent;
	}

	/* media arrives on its own delayed beat; chrome on a faster one.
	   Delay applies on open only — close is one collective 500ms fade. */
	.media {
		opacity: 0;
		transition: opacity var(--dur-label) var(--ease-quad-inout);
	}

	.lightbox[open] .media {
		opacity: 1;
		transition-delay: var(--media-delay);
	}

	.chrome {
		display: grid;
		gap: var(--line-gap);
		margin: var(--chrome-gap) 0 0;
		opacity: 0;
		transition: opacity var(--dur-chrome) var(--ease-quad-inout);
	}

	.lightbox[open] .chrome {
		opacity: 1;
	}

	/* the subtree was display:none before open, so each fading layer needs
	   an explicit before-open value for its entry transition */
	@starting-style {
		.lightbox[open],
		.lightbox[open] .media,
		.lightbox[open] .chrome {
			opacity: 0;
		}
	}

	.close {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		border: 0;
		padding: 0;
		background: none;
		cursor: zoom-out;
	}

	.close:focus-visible {
		outline-offset: calc(-1 * var(--frame)); /* keep the ring on-screen */
	}

	/* width follows the scrap's own ratio so the media never exceeds the
	   padded viewport height; clicks fall through to the close surface */
	.content {
		width: 100%;
		max-width: calc(var(--media-max-h) * var(--ratio));
		margin: 0;
		pointer-events: none;
	}

	.note {
		margin: 0;
		max-width: 68ch;
	}

	.date {
		margin: 0;
		opacity: var(--alpha-rest);
	}
</style>
