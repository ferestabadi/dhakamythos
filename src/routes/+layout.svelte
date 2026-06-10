<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import Nav from '$lib/components/Nav.svelte';
	import FatFooter from '$lib/components/FatFooter.svelte';
	import ContactOverlay from '$lib/components/ContactOverlay.svelte';
	import CursorLabel from '$lib/components/CursorLabel.svelte';

	let { children, data } = $props();

	// The Deck owns the whole viewport; every other route flows below the nav
	// and ends in the fat footer.
	const isDeck = $derived(page.url.pathname === '/');

	/* Container transform (golden rule 3): the View Transitions API morphs
	   the shared view-transition-name pair (card cover → case hero). No JS
	   polyfill — unsupported browsers get the CSS crossfade below; reduced
	   motion gets the browser's plain crossfade, opacity only. */
	let supportsViewTransitions = $state(true);

	$effect(() => {
		supportsViewTransitions = !!document.startViewTransition;
	});

	onNavigate((navigation) => {
		if (!document.startViewTransition) return;
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<a class="skip type-meta" href="#main">Skip to content</a>
<Nav />
{#if supportsViewTransitions}
	<main id="main" class:deck={isDeck}>
		{@render children()}
	</main>
{:else}
	<!-- crossfade fallback per motion grammar: remount fades the route in -->
	{#key page.url.pathname}
		<main id="main" class="route-fade" class:deck={isDeck}>
			{@render children()}
		</main>
	{/key}
{/if}
{#if !isDeck}
	<FatFooter {...data.contact} />
{/if}
<ContactOverlay {...data.contact} />
<CursorLabel />

<style>
	main:not(.deck) {
		padding-top: var(--space-10);
	}

	.route-fade {
		animation: route-fade var(--dur-fast) linear;
	}

	@keyframes route-fade {
		from {
			opacity: 0;
		}
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
