<script lang="ts">
	import ClosingBand from '$lib/components/ClosingBand.svelte';
	import { reveal } from '$lib/reveal';
</script>

<!-- Prerenders to 404.html, which Vercel serves for unknown static paths;
     in-app navigation errors render +error.svelte with the same content. -->
<svelte:head>
	<title>Not found — DHAKAMYTHOS</title>
</svelte:head>

<!-- our copy, kept — at the meta scale; the h1 stays visible because the
     copy IS the page (sr-only would empty it) -->
<div class="sheet route-sheet" use:reveal>
	<div class="axis-x">
		<h1 class="type-base">Lost in the myth</h1>
		<a class="back type-base" href="/">Back to the deck</a>
	</div>

	<ClosingBand />
</div>

<style>
	.sheet {
		--stack-gap: 1.25rem; /* 20px to the back link */
	}

	h1 {
		margin: 0;
	}

	.back {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		margin-top: var(--stack-gap);
		color: inherit;
		text-decoration: none;
		opacity: var(--alpha-rest);
		transition: opacity var(--dur-label) var(--ease-out-cubic);
	}

	@media (hover: hover) {
		.back:hover {
			opacity: var(--alpha-active);
		}
	}
</style>
