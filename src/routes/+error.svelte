<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status === 404 ? 'Not found' : 'Error'} — DHAKAMYTHOS</title>
</svelte:head>

<div class="page">
	<h1 class="type-display">{page.status === 404 ? 'Lost in the myth' : 'Something broke'}</h1>
	<a class="back text-button type-meta" href="/">Back to the deck</a>
</div>

<style>
	.page {
		padding: 0 var(--gutter) var(--space-9);
	}

	.back {
		margin-top: var(--space-6);
		color: var(--ink);
		text-decoration: underline;
	}
</style>
