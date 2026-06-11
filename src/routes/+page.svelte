<script lang="ts">
	import Deck from '$lib/components/Deck.svelte';
	import { ogImageUrl, preloadProps } from '$lib/sanity/image';
	import { absUrl } from '$lib/site';

	let { data } = $props();

	// the first card's cover is the LCP — preloading from <head> starts the
	// fetch ahead of the font and module preloads on slow connections; the
	// preload mirrors the <picture>'s winning (webp) source so it never
	// double-fetches against the fallback ladder
	const lcp = $derived(data.works[0] ? preloadProps(data.works[0].cover, 'card') : null);
</script>

<svelte:head>
	<title>DHAKAMYTHOS</title>
	<meta
		name="description"
		content="dhakamythos — an art collective in Dhaka publishing works of text, photo, video and interaction."
	/>
	<meta property="og:title" content="DHAKAMYTHOS" />
	<meta
		property="og:description"
		content="An art collective in Dhaka publishing works of text, photo, video and interaction."
	/>
	{#if data.works[0]}
		<meta property="og:image" content={absUrl(ogImageUrl(data.works[0].cover))} />
	{/if}
	{#if lcp}
		<link
			rel="preload"
			as="image"
			href={lcp.href}
			imagesrcset={lcp.imagesrcset}
			imagesizes={lcp.imagesizes}
			type={lcp.type}
			fetchpriority="high"
		/>
	{/if}
</svelte:head>

<h1 class="visually-hidden">DHAKAMYTHOS</h1>

<Deck works={data.works} />
