<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { afterNavigate, onNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import Nav from '$lib/components/Nav.svelte';
	import ContactOverlay from '$lib/components/ContactOverlay.svelte';
	import CursorLabel from '$lib/components/CursorLabel.svelte';
	import Preloader from '$lib/components/Preloader.svelte';
	import { appState } from '$lib/app-state.svelte';

	let { children, data } = $props();

	// The Deck owns the whole viewport; every other route scrolls its own
	// sheet and mounts the closing band at the end of its own content.
	const isDeck = $derived(page.url.pathname === '/');

	/* Container transform (golden rule 3): the View Transitions API morphs
	   the shared view-transition-name pair (card cover → case hero). No JS
	   polyfill — unsupported browsers get the CSS crossfade below; reduced
	   motion skips the view transition entirely, so the route swap is an
	   instant opacity-safe cut. */
	let supportsViewTransitions = $state(true);

	$effect(() => {
		supportsViewTransitions = !!document.startViewTransition;
	});

	onNavigate((navigation) => {
		/* arm the home-arrival cover before the new page mounts, so the Deck
		   can never race the flash and sweep underneath it (gap MO-01) */
		if (
			navigation.from &&
			navigation.to?.url.pathname === '/' &&
			!matchMedia('(prefers-reduced-motion: reduce)').matches
		) {
			appState.covered = true;
		}
		if (!document.startViewTransition) return;
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	/* Ground flash on client-side arrivals at home (grammar §6.3, gap W3-04):
	   rises over the deck, holds while the rail rebuilds, then reveals the
	   sweep — the deck holds its sweep on appState.covered until the flash
	   starts fading out. First loads are covered by the preloader instead. */
	let flashOn = $state(false);
	let flashOff: ReturnType<typeof setTimeout> | undefined;

	afterNavigate((navigation) => {
		if (!navigation.from || navigation.to?.url.pathname !== '/') return;
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		clearTimeout(flashOff);
		flashOn = true;
		flashOff = setTimeout(() => {
			flashOn = false; // fade-out starts 1.5s in (§6.3) …
			appState.covered = false; // … and releases the held sweep with it
		}, 1500);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<a class="skip type-base" href="#main">Skip to content</a>
<Nav />
<!-- persistent shell layers (grammar §2.5/§5.0), all at z-ground and
     DOM-ordered: solid ground < deck (main) < corner-fade < flash; route
     sheets (z-sheet) stack above the lot -->
<div class="ground" aria-hidden="true"></div>
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
<div class="corner-fade" aria-hidden="true"></div>
<div class="flash" class:on={flashOn} aria-hidden="true"></div>
<ContactOverlay {...data.contact} />
<CursorLabel />
<Preloader />

<style>
	/* routes own their vertical rhythm now — each applies .route-sheet
	   (fixed sheet, internal scroll, drop-top padding) on its own wrapper */

	/* the deck route's main joins the z-ground layer so it paints above the
	   ground sheet (earlier sibling) and below the corner-fade (later one);
	   without this the fixed z-1 layers would cover the unpositioned main */
	main.deck {
		position: relative;
		z-index: var(--z-ground);
	}

	.ground {
		position: fixed;
		inset: 0;
		z-index: var(--z-ground);
		background: var(--ground);
		pointer-events: none;
	}

	/* opaque corners melting to clear across the middle 50% (grammar §2.1) */
	.corner-fade {
		position: fixed;
		inset: 0;
		z-index: var(--z-ground);
		background: linear-gradient(
			45deg,
			var(--ground) 0%,
			var(--ground) 1%,
			transparent 25%,
			transparent 75%,
			var(--ground) 100%
		);
		opacity: var(--alpha-fade);
		pointer-events: none;
		display: none;
	}

	@media (min-width: 768px) {
		.corner-fade {
			display: block;
		}
	}

	/* home white flash: in over the beat after a short hold, out over the
	   beat once the deck has rebuilt (grammar §6.3) */
	.flash {
		--flash-in-delay: 250ms; /* grammar §6.3 — not a global token */
		position: fixed;
		inset: 0;
		z-index: var(--z-ground);
		background: var(--ground);
		opacity: 0;
		pointer-events: none;
		transition: opacity var(--dur-beat) var(--ease-quad-inout);
	}

	.flash.on {
		opacity: 1;
		transition-delay: var(--flash-in-delay);
	}

	.route-fade {
		animation: route-fade var(--dur-micro) linear;
	}

	@keyframes route-fade {
		from {
			opacity: 0;
		}
	}

	.skip {
		position: fixed;
		top: var(--frame);
		left: var(--frame);
		z-index: var(--z-cursor);
		background: var(--ground);
		color: var(--ink);
		padding: var(--axis-x);
		transform: translateY(-200%);
	}

	.skip:focus {
		transform: none;
	}
</style>
