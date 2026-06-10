<script lang="ts">
	import LqipImage from '$lib/components/LqipImage.svelte';
	import type { Scrap } from '$lib/sanity/types';

	let { data } = $props();
	const scraps = $derived(data.scraps);

	/* Native <dialog> supplies the lightbox floor for free: focus trap, Esc
	   to close, inert background, focus restored to the tapped scrap. The
	   last-opened scrap stays rendered after close so the exit transition
	   never blanks mid-slide. */
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
</script>

<svelte:head>
	<title>Archive — DHAKAMYTHOS</title>
	<meta name="description" content="Scraps, sketches and process — the wall." />
</svelte:head>

<div class="page">
	<h1 class="type-display">Archive</h1>

	{#if scraps.length}
		<div class="wall">
			{#each scraps as scrap, i (scrap.image.url)}
				<button
					class="scrap text-button type-meta"
					aria-label={scrap.note ?? scrap.image.alt}
					onclick={() => openLightbox(scrap)}
				>
					<LqipImage img={scrap.image} role="thumb" eager={i < 4} />
				</button>
			{/each}
		</div>
	{:else}
		<p class="empty type-meta">First scraps arriving soon</p>
	{/if}
</div>

<dialog
	bind:this={dialog}
	class="lightbox"
	aria-label={active?.note ?? active?.image.alt ?? 'Scrap'}
	onclick={(event) => {
		if (event.target === dialog) dialog?.close();
	}}
>
	{#if active}
		<button class="close text-button type-meta" onclick={() => dialog?.close()}>Close</button>
		<figure class="content" style:--ratio={active.image.width / active.image.height}>
			<!-- keyed remount re-arms the LQIP fade for each newly viewed scrap -->
			{#key active}
				<LqipImage img={active.image} role="hero" eager />
			{/key}
			{#if active.note || active.date}
				<figcaption>
					{#if active.note}<p class="note type-body">{active.note}</p>{/if}
					{#if active.date}<p class="date type-meta">
							{dateFormat.format(new Date(active.date))}
						</p>{/if}
				</figcaption>
			{/if}
		</figure>
	{/if}
</dialog>

<style>
	.page {
		padding: 0 var(--gutter) var(--space-9);
	}

	.empty {
		color: var(--muted);
		margin-top: var(--space-5);
	}

	/* the Wall — CSS-columns masonry, dense and quiet */
	.wall {
		margin-top: var(--space-7);
		columns: 2;
		column-gap: var(--space-4);
	}

	@media (min-width: 1024px) {
		.wall {
			columns: 4;
		}
	}

	@media (min-width: 1440px) {
		.wall {
			columns: 5;
		}
	}

	.scrap {
		/* text-button's inline-flex would leave column baseline gaps */
		display: block;
		width: 100%;
		break-inside: avoid;
		margin-bottom: var(--space-4);
	}

	/* ---- lightbox (ContactOverlay's rising-dialog grammar) ---- */

	.lightbox {
		position: fixed;
		inset: 0;
		width: 100%;
		height: 100%;
		max-width: none;
		max-height: none;
		margin: 0;
		border: 0;
		padding: var(--gutter);
		background: var(--overlay);
		color: var(--ground);
		transform: translateY(100%);
		transition:
			transform var(--dur-base) var(--ease-inout),
			display var(--dur-base) allow-discrete,
			overlay var(--dur-base) allow-discrete;
	}

	.lightbox[open] {
		display: grid;
		align-content: center;
		justify-items: center;
		transform: none;
	}

	@starting-style {
		.lightbox[open] {
			transform: translateY(100%);
		}
	}

	.lightbox::backdrop {
		background: transparent;
	}

	/* width follows the scrap's own ratio so the image never exceeds 70dvh */
	.content {
		width: 100%;
		max-width: calc(70dvh * var(--ratio));
		margin: 0;
	}

	.content figcaption {
		margin-top: var(--space-4);
	}

	.note {
		margin: 0;
		max-width: 68ch;
	}

	.date {
		margin: var(--space-2) 0 0;
		color: var(--muted);
	}

	.close {
		position: absolute;
		top: var(--space-3);
		right: var(--gutter);
	}

	/* the ink focus outline vanishes on the dark scrim */
	.lightbox :focus-visible {
		outline-color: var(--ground);
	}
</style>
