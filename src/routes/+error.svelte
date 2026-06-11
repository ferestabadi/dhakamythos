<script lang="ts">
	import { page } from '$app/state';
	import ClosingBand from '$lib/components/ClosingBand.svelte';
	import { reveal } from '$lib/reveal';
</script>

<svelte:head>
	<title>{page.status === 404 ? 'Not found' : 'Error'} — DHAKAMYTHOS</title>
</svelte:head>

<!-- error grammar mirrors /404: our copy at the meta scale, single fade -->
<div class="sheet route-sheet" use:reveal>
	<div class="axis-x">
		<h1 class="type-base">{page.status === 404 ? 'Lost in the myth' : 'Something broke'}</h1>
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
