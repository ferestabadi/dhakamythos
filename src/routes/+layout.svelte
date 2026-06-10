<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import Nav from '$lib/components/Nav.svelte';
	import FatFooter from '$lib/components/FatFooter.svelte';
	import ContactOverlay from '$lib/components/ContactOverlay.svelte';

	let { children } = $props();

	// The Deck owns the whole viewport; every other route flows below the nav
	// and ends in the fat footer.
	const isDeck = $derived(page.url.pathname === '/');
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<a class="skip type-meta" href="#main">Skip to content</a>
<Nav />
<main id="main" class:deck={isDeck}>
	{@render children()}
</main>
{#if !isDeck}
	<FatFooter />
{/if}
<ContactOverlay />

<style>
	main:not(.deck) {
		padding-top: var(--space-10);
	}

	.skip {
		position: fixed;
		top: var(--space-2);
		left: var(--space-2);
		z-index: var(--z-cursor);
		background: var(--ground);
		color: var(--ink);
		padding: var(--space-3);
		transform: translateY(-200%);
	}

	.skip:focus {
		transform: none;
	}
</style>
