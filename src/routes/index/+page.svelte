<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { imgProps } from '$lib/sanity/image';
	import ClosingBand from '$lib/components/ClosingBand.svelte';
	import { reveal } from '$lib/reveal';

	let { data } = $props();

	type Row = (typeof data.works)[number];

	/* Every distinct tag across the catalogue, in first-seen order (works
	   arrive newest first, media tags lead each work's list). */
	const allTags = $derived([...new Set(data.works.flatMap((w) => w.tags))]);

	/* Selected tags live in the URL (?tags=A,B) so a filtered view survives
	   reload and sharing. The prerendered HTML never reads them — all rows
	   ship in the static page and filtering is a client enhancement. */
	const selected = $derived(
		browser ? (page.url.searchParams.get('tags')?.split(',').filter(Boolean) ?? []) : []
	);

	/* A work matches when it carries every selected tag. */
	const visible = $derived(
		selected.length
			? data.works.filter((w) => selected.every((t) => w.tags.includes(t)))
			: data.works
	);

	function setFilter(tags: string[]) {
		const search = tags.length ? `?tags=${tags.map(encodeURIComponent).join(',')}` : '';
		goto(`${page.url.pathname}${search}`, { replaceState: true, noScroll: true, keepFocus: true });
	}

	function toggle(tag: string) {
		setFilter(selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag]);
	}

	/* Hover preview (grammar §5.4): the hovered row's cover, pinned top-right
	   on hover-capable desktops. Client-only state — the prerendered page
	   ships no figure, and touch taps never mount one. */
	let preview = $state<Row | null>(null);
	let previewLoaded = $state(false);

	function setPreview(work: Row) {
		if (!matchMedia('(hover: hover)').matches) return;
		if (preview?.slug === work.slug) return;
		preview = work;
		previewLoaded = false;
	}

	/* mirrors --stagger-rows (50ms) — reveal() takes plain ms */
	const STEP = 50;
</script>

<svelte:head>
	<title>Index — DHAKAMYTHOS</title>
	<meta name="description" content="All works, year by year." />
</svelte:head>

<div class="sheet route-sheet">
	<div class="axis-x">
		<h1 class="visually-hidden">Index</h1>

		{#if data.works.length}
			<div class="chips" role="group" aria-label="Filter works by tag" use:reveal>
				{#each allTags as tag (tag)}
					<button
						class="chip button button--pill"
						class:active={selected.includes(tag)}
						aria-pressed={selected.includes(tag)}
						onclick={() => toggle(tag)}
					>
						<span class="chip-label type-button">{tag}</span>
					</button>
				{/each}
			</div>

			{#if visible.length}
				<ul class="rows" onmouseleave={() => (preview = null)}>
					{#each visible as work, i (work.slug)}
						<li use:reveal={{ delay: i * STEP }}>
							<a
								class="row type-list"
								href="/{work.slug}"
								onmouseenter={() => setPreview(work)}
								onfocus={() => setPreview(work)}
							>
								<span class="year">{work.year}</span>
								<span class="title">{work.title}</span>
								<span class="tags">{work.tags.join(' / ')}</span>
							</a>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="empty prose-case type-base">
					Nothing under this tag yet — <button class="clear" onclick={() => setFilter([])}
						>clear filters</button
					>.
				</p>
			{/if}
		{:else}
			<p class="arriving type-base">First works arriving soon</p>
		{/if}
	</div>

	{#if preview}
		<figure class="preview" aria-hidden="true">
			{#key preview.slug}
				<img
					{...imgProps(preview.cover, 'card')}
					alt=""
					loading="lazy"
					decoding="async"
					class:loaded={previewLoaded}
					onload={() => (previewLoaded = true)}
				/>
			{/key}
		</figure>
	{/if}

	<ClosingBand />
</div>

<style>
	.sheet {
		--stack-gap: 1.25rem; /* 20px rhythm between page units */
		--rows-top: 2.5rem; /* chips → first row */
		--row-pad: 0.3125rem; /* line padding keeps comfortable hit areas without dividers */
		--pill-pad-x: 1rem; /* 16px pill label inset (grammar §2.3) */
		--preview-top: 3.5rem; /* preview clears the header band */
		padding-bottom: 12.5vh;
		padding-bottom: 12.5svh;
	}

	/* chips: one strip, scrolling edge-to-edge on mobile (scrollbar hidden) */
	.chips {
		display: flex;
		gap: var(--gap-cell);
		margin-inline: calc(-1 * var(--axis-x));
		padding-inline: var(--axis-x);
		overflow-x: auto;
		scrollbar-width: none;
	}

	.chips::-webkit-scrollbar {
		display: none;
	}

	/* the .button recipe draws the chrome; this resets the element and keeps
	   the 44px hit floor via its own box */
	.chip {
		flex: none;
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		padding-inline: var(--pill-pad-x);
		border: 0;
		background: none;
		color: inherit;
		font: inherit;
		letter-spacing: inherit;
		text-transform: inherit;
		cursor: pointer;
	}

	.chip-label {
		transform: translateY(1.5px); /* optical pill centering (grammar §2.3) */
	}

	.rows {
		list-style: none;
		margin: var(--rows-top) 0 0;
		padding: 0;
	}

	/* mobile base: meta line (year · tags) over the title; no dividers —
	   the rhythm alone separates rows */
	.row {
		display: grid;
		grid-template-areas: 'year tags' 'title title';
		grid-template-columns: max-content 1fr;
		column-gap: var(--gap-cell);
		row-gap: var(--gap-cell);
		align-items: baseline;
		padding: var(--row-pad) 0;
		color: inherit;
		text-decoration: none;
		transition: opacity var(--dur-label) var(--ease-out-cubic);
	}

	.year,
	.tags {
		opacity: var(--alpha-rest);
	}

	.year {
		grid-area: year;
	}

	.tags {
		grid-area: tags;
	}

	/* the mobile meta line reads "year · tags" */
	.tags::before {
		content: '· ';
	}

	.title {
		grid-area: title;
	}

	/* rows idle at 1; hovering any row dims the rest (grammar §6.5) */
	@media (hover: hover) {
		.rows:hover .row {
			opacity: var(--alpha-rest);
		}

		.rows .row:hover {
			opacity: var(--alpha-active);
		}
	}

	.preview {
		display: none;
		margin: 0;
	}

	@media (hover: hover) and (min-width: 1024px) {
		.preview {
			display: block;
			position: fixed;
			top: var(--preview-top);
			right: 0;
			height: calc(50vh - 3.5rem);
			height: calc(50svh - 3.5rem);
			z-index: var(--z-accent);
		}

		.preview img {
			display: block;
			height: 100%;
			width: auto;
			object-fit: cover;
			opacity: 0;
			transition: opacity var(--dur-label) var(--ease-out-cubic);
		}

		.preview img.loaded {
			opacity: 1;
		}
	}

	@media (min-width: 1024px) {
		.chips {
			margin-inline: 0;
			padding-inline: 0;
			flex-wrap: wrap;
			row-gap: var(--gap-cell);
			overflow-x: visible;
		}

		/* one Year · Title · Tags line */
		.row {
			grid-template-areas: 'year title tags';
			grid-template-columns: max-content 1fr max-content;
			column-gap: var(--stack-gap);
		}

		.tags::before {
			content: none;
		}
	}

	.empty {
		margin: var(--rows-top) 0 0;
	}

	/* inline action — speaks the label language, no underline */
	.clear {
		border: 0;
		background: none;
		padding: 0;
		color: inherit;
		font: inherit;
		letter-spacing: inherit;
		cursor: pointer;
		opacity: var(--alpha-rest);
		transition: opacity var(--dur-label) var(--ease-out-cubic);
	}

	@media (hover: hover) {
		.clear:hover {
			opacity: var(--alpha-active);
		}
	}

	.arriving {
		opacity: var(--alpha-rest);
	}
</style>
