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

	/* Play while any pixel is in view, pause fully off-screen (grammar §7.3:
	   threshold 0). The browser pauses video-only media in hidden tabs, so
	   re-check on tab return. */
	function loopWhenVisible(el: HTMLVideoElement) {
		let inView = false;
		const playOrPause = () => {
			if (inView && !document.hidden) el.play().catch(() => {});
			else el.pause();
		};
		const io = new IntersectionObserver(
			([entry]) => {
				inView = entry.isIntersecting;
				playOrPause();
			},
			{ threshold: 0 }
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

<!-- Bare image tile (grammar §5.1): no caption, no title text. The title
     surfaces through the cursor label on fine pointers (data-cursor) and the
     aria-label always. -->
<a
	class="card"
	href="/{work.slug}"
	tabindex={focusable ? undefined : -1}
	data-cursor={work.title}
	aria-label="{work.title} — work {position} of {total}"
	style:aspect-ratio="{work.cover.width} / {work.cover.height}"
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
</a>

<style>
	.card {
		/* tile height — the rail occupies roughly the middle third of the
		   viewport (§5.1 proportions); width derives from each asset's exact
		   ratio via the inline aspect-ratio (§7.1) */
		--tile-h: clamp(220px, 33svh, 360px);
		display: block;
		position: relative;
		height: var(--tile-h);
		color: var(--ink);
		-webkit-tap-highlight-color: transparent;
	}

	.cover {
		position: absolute;
		inset: 0;
		overflow: hidden;
		/* missing cover → ink block; the aria-label stays the name */
		background: var(--ink);
		transition: transform var(--dur-label) var(--ease-out-expo);
	}

	.loop {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* hover = offset shift, never media zoom (grammar §6.2, §6.5) */
	@media (hover: hover) and (pointer: fine) {
		.card:hover .cover {
			transform: translate(24px, -4px);
		}
	}

	/* touch: brief press scale, no hover dependency */
	.card:active .cover {
		transform: scale(0.98);
	}

	/* touch stand-in for hover: the centered tile (class set by the Deck's
	   rAF) offsets forward, every other tile takes the inverse (§6.2) */
	@media (hover: none) {
		.cover {
			transform: translate(-12px, 0);
		}

		:global(li.is-center) .cover {
			transform: translate(12px, -4px);
		}
	}
</style>
