<script lang="ts">
	import { imgProps, type ImgRole } from '$lib/sanity/image';
	import type { Img } from '$lib/sanity/types';

	/* Renders an Img with its LQIP behind the real file, fading the real one
	   in on load. `fill` lets a parent own the box (e.g. the Card's 4:5
	   cover); otherwise the frame keeps the image's intrinsic ratio, so
	   layout never shifts (CLS rule). */
	let {
		img,
		role,
		eager = false,
		priority = false,
		fill = false,
		vtName
	}: {
		img: Img;
		role: ImgRole;
		/** skip lazy-loading (first two deck cards, case hero) */
		eager?: boolean;
		/** fetchpriority=high — reserve for the page's LCP image so eager
		 * neighbours don't race it for bandwidth */
		priority?: boolean;
		fill?: boolean;
		vtName?: string;
	} = $props();

	const attrs = $derived(imgProps(img, role));
	let el: HTMLImageElement | undefined = $state();
	/* The image is visible by default so prerendered paint (and LCP) never
	   waits for hydration; the LQIP fade is layered on only when JS arrives
	   while the file is still in flight. */
	let waiting = $state(false);

	$effect(() => {
		if (el && !el.complete) waiting = true;
	});
</script>

<span
	class="frame"
	class:fill
	style:aspect-ratio={fill ? undefined : `${img.width} / ${img.height}`}
	style:background-image={img.lqip ? `url(${img.lqip})` : undefined}
	style:view-transition-name={vtName}
>
	<img
		bind:this={el}
		{...attrs}
		loading={eager ? 'eager' : 'lazy'}
		fetchpriority={priority ? 'high' : undefined}
		decoding="async"
		class:waiting
		onload={() => (waiting = false)}
	/>
</span>

<style>
	.frame {
		display: block;
		position: relative;
		overflow: hidden;
		background-size: cover;
		background-position: center;
	}

	.frame.fill {
		position: absolute;
		inset: 0;
	}

	img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: opacity var(--dur-fast) var(--ease-out);
	}

	img.waiting {
		opacity: 0;
	}
</style>
