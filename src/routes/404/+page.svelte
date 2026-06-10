<!-- Prerenders to 404.html, which Vercel serves for unknown static paths;
     in-app navigation errors render +error.svelte with the same content. -->
<svelte:head>
	<title>Not found — DHAKAMYTHOS</title>
</svelte:head>

<div class="page">
	<h1 class="type-display">Lost in the myth</h1>
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
