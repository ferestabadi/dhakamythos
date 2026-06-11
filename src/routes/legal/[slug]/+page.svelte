<script lang="ts">
	import Prose from '$lib/components/Prose.svelte';
	import ClosingBand from '$lib/components/ClosingBand.svelte';
	import { reveal } from '$lib/reveal';

	let { data } = $props();
	const page = $derived(data.page);

	/* Legal pages have no standfirst, so the description falls back to the
	   opening paragraph (works use their standfirst — see SITEMAP SEO rules). */
	const description = $derived.by(() => {
		const first = page.body.find((b) => b.kind === 'text');
		const text = first?.kind === 'text' ? first.spans.map((s) => s.text).join('') : '';
		return text.slice(0, 160) || `${page.title} — dhakamythos.`;
	});
</script>

<svelte:head>
	<title>{page.title} — DHAKAMYTHOS</title>
	<meta name="description" content={description} />
</svelte:head>

<!-- legal grammar (§5.4): small-scale text from the axis, one 1s fade -->
<div class="sheet route-sheet" use:reveal>
	<article class="column axis-x">
		<h1 class="visually-hidden">{page.title}</h1>
		<div class="body prose-case type-base">
			<Prose blocks={page.body} />
		</div>
	</article>

	<ClosingBand />
</div>

<style>
	.sheet {
		--measure: 27rem; /* 432px text column */
		padding-bottom: 12.5vh;
		padding-bottom: 12.5svh;
	}

	.column {
		max-width: var(--measure);
	}

	/* the column owns the measure and the type role; Prose only provides
	   markup here (its own metrics are superseded from outside) */
	.body :global(.prose) {
		font-size: inherit;
		line-height: inherit;
		max-width: none;
	}
</style>
