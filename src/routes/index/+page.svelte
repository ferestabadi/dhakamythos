<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let { data } = $props();

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
</script>

<svelte:head>
	<title>Index — DHAKAMYTHOS</title>
	<meta name="description" content="All works, year by year." />
</svelte:head>

<div class="page">
	<h1 class="type-display">Index</h1>

	{#if data.works.length}
		<div class="chips" role="group" aria-label="Filter works by tag">
			{#each allTags as tag (tag)}
				<button
					class="chip text-button type-meta"
					aria-pressed={selected.includes(tag)}
					onclick={() => toggle(tag)}
				>
					{tag}
				</button>
			{/each}
		</div>

		{#if visible.length}
			<ul class="rows">
				{#each visible as work (work.slug)}
					<li>
						<a class="row" href="/{work.slug}" data-cursor="View">
							<span class="year type-meta">{work.year}</span>
							<span class="title type-title">{work.title}</span>
							<span class="tags type-meta">{work.tags.join(' / ')}</span>
						</a>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="empty type-body">
				Nothing under this tag yet — <button
					class="clear text-button type-body"
					onclick={() => setFilter([])}>clear filters</button
				>.
			</p>
		{/if}
	{:else}
		<p class="arriving type-meta">First works arriving soon</p>
	{/if}
</div>

<style>
	.page {
		padding: 0 var(--gutter) var(--space-9);
	}

	h1 {
		margin: 0;
	}

	/* chips: one strip, scrolling edge-to-edge on mobile (scrollbar hidden) */
	.chips {
		display: flex;
		gap: var(--space-2);
		margin: var(--space-6) calc(-1 * var(--gutter)) 0;
		padding: 0 var(--gutter);
		overflow-x: auto;
		scrollbar-width: none;
	}

	.chips::-webkit-scrollbar {
		display: none;
	}

	.chip {
		flex: none;
		padding: 0 var(--space-4);
		border: 1px solid var(--line);
		color: var(--muted);
	}

	.chip:hover {
		color: var(--ink);
		border-color: var(--ink);
	}

	.chip[aria-pressed='true'] {
		background: var(--ink);
		border-color: var(--ink);
		color: var(--ground);
	}

	.rows {
		list-style: none;
		margin: var(--space-7) 0 0;
		padding: 0;
	}

	.rows li {
		border-bottom: 1px solid var(--line);
	}

	/* mobile base: meta line (year · tags) over the title */
	.row {
		display: grid;
		grid-template-areas: 'year tags' 'title title';
		grid-template-columns: max-content 1fr;
		column-gap: var(--space-2);
		row-gap: var(--space-2);
		align-items: baseline;
		padding: var(--space-4) 0;
		color: var(--ink);
		text-decoration: none;
		transition: transform var(--dur-fast) var(--ease-out);
	}

	.year,
	.tags {
		color: var(--muted);
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

	@media (min-width: 1024px) {
		.chips {
			margin-left: 0;
			margin-right: 0;
			padding-left: 0;
			padding-right: 0;
			flex-wrap: wrap;
			row-gap: var(--space-2);
			overflow-x: visible;
		}

		/* one Year · Title · Tags line; hover inks the row and slides it.
		   Color snaps (no transition) — only transform animates. */
		.row {
			grid-template-areas: 'year title tags';
			grid-template-columns: max-content 1fr max-content;
			column-gap: var(--space-5);
		}

		.tags::before {
			content: none;
		}

		.row:hover {
			transform: translateX(12px);
		}

		.row:hover .year,
		.row:hover .tags {
			color: var(--ink);
		}
	}

	.empty {
		margin: var(--space-7) 0 0;
		color: var(--muted);
	}

	.clear {
		color: var(--ink);
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	.arriving {
		color: var(--muted);
		margin-top: var(--space-5);
	}
</style>
