<script lang="ts">
	import { contactOverlay } from '$lib/contact-overlay.svelte';
</script>

<svelte:head>
	<title>DHAKAMYTHOS</title>
	<meta
		name="description"
		content="dhakamythos — an art collective in Dhaka publishing works of text, photo, video and interaction."
	/>
</svelte:head>

<h1 class="visually-hidden">DHAKAMYTHOS</h1>

<!-- Deck empty state (docs/DESIGN.md) — replaced by the Card rail in M2. -->
<section class="deck-empty">
	<p class="type-meta">First works arriving soon</p>
	<button class="text-button type-meta" onclick={contactOverlay.open}>Contact</button>
</section>

<style>
	.deck-empty {
		min-height: 100dvh;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: var(--space-4);
		color: var(--muted);
	}

	.deck-empty button {
		color: var(--ink);
		text-decoration: underline;
	}
</style>
