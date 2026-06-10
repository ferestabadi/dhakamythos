<script lang="ts">
	import Prose from '$lib/components/Prose.svelte';

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

<div class="page">
	<h1 class="type-display">{page.title}</h1>
	<div class="body">
		<Prose blocks={page.body} />
	</div>
</div>

<style>
	.page {
		padding: 0 var(--gutter) var(--space-9);
	}

	h1 {
		margin: 0;
	}

	.body {
		margin-top: var(--space-7);
	}
</style>
