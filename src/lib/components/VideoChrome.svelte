<script lang="ts">
	import LqipImage from './LqipImage.svelte';
	import type { Img } from '$lib/sanity/types';

	/* Facade pattern for films (docs/PERFORMANCE.md): poster + text control,
	   the third-party iframe loads only on tap, privacy-friendly hosts. */
	let { embedUrl, poster, title }: { embedUrl: string; poster?: Img; title: string } = $props();

	let playing = $state(false);
	let frame: HTMLDivElement | undefined = $state();

	/* Sound is the embedded player's own control — cross-origin iframes
	   don't expose a mute toggle without per-provider APIs (flagged as a
	   spec gap in the M2 status report). Fullscreen we can own. */
	function enterFullscreen() {
		frame?.requestFullscreen?.();
	}

	function embedSrc(url: string): string | null {
		const vimeo = url.match(/vimeo\.com\/(\d+)/);
		if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?dnt=1&autoplay=1`;
		const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
		if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1`;
		return null;
	}

	const src = $derived(embedSrc(embedUrl));
</script>

{#if src}
	<div class="chrome" bind:this={frame}>
		{#if playing}
			<iframe
				{src}
				title="{title} — film"
				allow="autoplay; fullscreen; picture-in-picture"
				allowfullscreen
			></iframe>
			<button class="fullscreen text-button type-meta" onclick={enterFullscreen}>
				Fullscreen
			</button>
		{:else}
			{#if poster}
				<LqipImage img={poster} role="hero" eager priority fill />
			{/if}
			<button class="play text-button type-meta" onclick={() => (playing = true)}>
				Play film
			</button>
		{/if}
	</div>
{/if}

<style>
	.chrome {
		position: relative;
		aspect-ratio: 16 / 9;
		background: var(--ink);
		overflow: hidden;
	}

	iframe {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		border: 0;
	}

	.play {
		position: absolute;
		left: var(--gutter);
		bottom: var(--space-5);
		color: var(--ground);
	}

	.fullscreen {
		position: absolute;
		top: var(--space-3);
		right: var(--gutter);
		padding: 0 var(--space-2);
		color: var(--ground);
		background: var(--overlay);
	}

	.play:hover,
	.fullscreen:hover {
		text-decoration: underline;
	}

	.chrome :global(:focus-visible) {
		outline-color: var(--ground);
	}
</style>
