<script lang="ts">
	import LqipImage from './LqipImage.svelte';
	import { imgProps } from '$lib/sanity/image';
	import type { WorkCard } from '$lib/sanity/types';

	let {
		work,
		position,
		total,
		eager = false,
		priority = false,
		focusable = true,
		vtName
	}: {
		work: WorkCard;
		/** 1-based position announced to screen readers ("Work 7 of 36") */
		position: number;
		total: number;
		eager?: boolean;
		/** the LCP card only — see LqipImage */
		priority?: boolean;
		/** false for loop clones — hidden from tab order and readers */
		focusable?: boolean;
		vtName?: string;
	} = $props();

	/* Loops never start under data saving or 2G (docs/PERFORMANCE.md). */
	function conservingData(): boolean {
		const c = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } })
			.connection;
		return !!c && (c.saveData === true || /(^|-)2g$/.test(c.effectiveType ?? ''));
	}

	let loopAllowed = $state(false);
	$effect(() => {
		// reduced motion → loops become posters (golden rule 5)
		loopAllowed =
			!!work.coverLoop &&
			!conservingData() &&
			!matchMedia('(prefers-reduced-motion: reduce)').matches;
	});

	/* Play only while the card is mostly in view, pause off-view. The browser
	   pauses video-only media in hidden tabs, so re-check on tab return. */
	function loopWhenVisible(el: HTMLVideoElement) {
		let mostlyInView = false;
		const playOrPause = () => {
			if (mostlyInView && !document.hidden) el.play().catch(() => {});
			else el.pause();
		};
		const io = new IntersectionObserver(
			([entry]) => {
				mostlyInView = entry.intersectionRatio >= 0.6;
				playOrPause();
			},
			{ threshold: [0, 0.6] }
		);
		io.observe(el);
		document.addEventListener('visibilitychange', playOrPause);
		return {
			destroy() {
				io.disconnect();
				document.removeEventListener('visibilitychange', playOrPause);
			}
		};
	}
</script>

<a
	class="card"
	href="/{work.slug}"
	tabindex={focusable ? undefined : -1}
	data-cursor="View"
>
	<span class="cover" style:view-transition-name={vtName}>
		<LqipImage img={work.cover} role="card" {eager} {priority} fill />
		{#if loopAllowed && work.coverLoop}
			<video
				class="loop"
				src={work.coverLoop.url}
				poster={imgProps(work.cover, 'card').src}
				width={work.cover.width}
				height={work.cover.height}
				muted
				playsinline
				loop
				preload="none"
				aria-hidden="true"
				use:loopWhenVisible
			></video>
		{/if}
	</span>
	<span class="eyebrow type-meta">{work.year} · {work.tags.join(' / ')}</span>
	<span class="title type-title">{work.title}</span>
	<span class="visually-hidden">Work {position} of {total}</span>
</a>

<style>
	.card {
		display: block;
		width: 85vw;
		color: var(--ink);
		text-decoration: none;
		-webkit-tap-highlight-color: transparent;
	}

	.cover {
		display: block;
		position: relative;
		overflow: hidden;
		aspect-ratio: 4 / 5;
		/* missing cover → ink block; the title below stays the label */
		background: var(--ink);
		transition: transform var(--dur-fast) var(--ease-out);
	}

	/* media moves, frame stays — transform + opacity only */
	.cover :global(img),
	.loop {
		transition: transform var(--dur-base) var(--ease-out);
	}

	.loop {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	@media (hover: hover) and (pointer: fine) {
		.card:hover .cover :global(img),
		.card:hover .loop {
			transform: scale(1.04);
		}
	}

	/* touch: brief press scale, no hover dependency */
	.card:active .cover {
		transform: scale(0.98);
	}

	.eyebrow {
		display: block;
		margin-top: var(--space-4);
		color: var(--muted);
	}

	.title {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		overflow: hidden;
		margin-top: var(--space-2);
	}

	@media (min-width: 1024px) {
		.card {
			width: 38vw;
		}

		.cover {
			/* keep tall covers inside the viewport; ratio stays within the
			   3:4–16:10 window the spec allows on desktop */
			aspect-ratio: auto;
			height: min(47.5vw, 62vh);
		}
	}
</style>
