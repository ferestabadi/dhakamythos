<script lang="ts">
	import { pictureProps, type ImgRole } from '$lib/sanity/image';
	import type { Img } from '$lib/sanity/types';

	/* Renders an Img as a <picture> — webp source + fallback (grammar §7.2) —
	   with its LQIP behind the real file, fading the real one in on load.
	   `fill` lets a parent own the box (e.g. the Card's 4:5 cover); otherwise
	   the frame keeps the image's intrinsic ratio, so layout never shifts
	   (CLS rule). */
	let {
		img,
		role,
		eager = false,
		priority = false,
		fill = false,
		outset = false,
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
		/** 1px bleed past the frame — case/hero contexts use it so
		 * fractional-DPR rounding never shows a ground-colored seam (W4-09) */
		outset?: boolean;
		vtName?: string;
	} = $props();

	const pic = $derived(pictureProps(img, role));
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
	class:outset
	style:aspect-ratio={fill ? undefined : `${img.width} / ${img.height}`}
	style:background-image={img.lqip ? `url(${img.lqip})` : undefined}
	style:view-transition-name={vtName}
>
	<picture>
		{#each pic.sources as source (source.type)}
			<source type={source.type} srcset={source.srcset} sizes={source.sizes} />
		{/each}
		<img
			bind:this={el}
			{...pic.img}
			loading={eager ? 'eager' : 'lazy'}
			fetchpriority={priority ? 'high' : undefined}
			decoding="async"
			class:waiting
			onload={() => (waiting = false)}
		/>
	</picture>
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

	/* the picture element is pure plumbing — the img keeps doing the layout */
	picture {
		display: contents;
	}

	img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: opacity var(--dur-label) var(--ease-out-cubic);
	}

	img.waiting {
		opacity: 0;
	}

	/* opt-in 1px outset (grammar §2.3): media bleeds under the frame edge so
	   fractional-DPR rounding can't leave a ground-colored seam */
	.frame.outset img {
		position: absolute;
		inset: -1px;
		width: calc(100% + 2px);
		height: calc(100% + 2px);
	}
</style>
