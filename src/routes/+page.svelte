<script lang="ts">
	import Deck from '$lib/components/Deck.svelte';
	import { imgProps } from '$lib/sanity/image';

	let { data } = $props();

	// the first card's cover is the LCP — preloading from <head> starts the
	// fetch ahead of the font and module preloads on slow connections
	const lcp = $derived(data.works[0] ? imgProps(data.works[0].cover, 'card') : null);
</script>

<svelte:head>
	<title>DHAKAMYTHOS</title>
	<meta
		name="description"
		content="dhakamythos — an art collective in Dhaka publishing works of text, photo, video and interaction."
	/>
	{#if lcp}
		<link
			rel="preload"
			as="image"
			href={lcp.src}
			imagesrcset={lcp.srcset}
			imagesizes={lcp.sizes}
			fetchpriority="high"
		/>
	{/if}
</svelte:head>

<h1 class="visually-hidden">DHAKAMYTHOS</h1>

<Deck works={data.works} />
