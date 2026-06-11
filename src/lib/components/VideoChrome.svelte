<script lang="ts">
	import LqipImage from './LqipImage.svelte';
	import type { Img } from '$lib/sanity/types';

	/* Video chrome in two ownership classes (grammar §7.4, gap W4-05):
	   — `src` (self-hosted loop/mp4, the ≤3MB rule): we own the element, so
	     it gets the full unveil bar — play word, m:ss counter, scaleX
	     scrubber, sound, fullscreen (cover → contain).
	   — `embedUrl` (Vimeo/YouTube film): click-to-load facade restyled to
	     the same bar grammar; once loaded the provider iframe owns playback,
	     so our bar — including its Sound control — is deliberately absent. */
	let {
		src,
		embedUrl,
		poster,
		title
	}: { src?: string; embedUrl?: string; poster?: Img; title: string } = $props();

	/* ---- owned <video> state ---- */
	let frame: HTMLElement | undefined = $state();
	let paused = $state(true);
	let muted = $state(true); // loops start silent — sound is a user action
	let currentTime = $state(0);
	let duration = $state(0);
	let isFullscreen = $state(false);
	let userPaused = $state(false);
	let focusWithin = $state(false);
	/* once the first frame has painted the poster never returns, so a loop
	   wrap (currentTime back to 0) can't flash it back */
	let revealed = $state(false);
	$effect(() => {
		if (currentTime > 0) revealed = true;
	});

	const canHover = typeof window !== 'undefined' && matchMedia('(hover: hover)').matches;
	let awake = $state(false);
	let wakeTimer = 0;
	/* §6.5: the bar hides 1000ms after the last mousemove */
	function wake() {
		awake = true;
		clearTimeout(wakeTimer);
		wakeTimer = window.setTimeout(() => (awake = false), 1000);
	}
	function sleep() {
		clearTimeout(wakeTimer);
		awake = false;
	}
	$effect(() => () => clearTimeout(wakeTimer));

	/* bar shows when paused / on touch / while hovered or focused (§7.4) */
	const barVisible = $derived(paused || !canHover || awake || focusWithin);

	function toggle() {
		userPaused = !paused;
		paused = !paused;
	}

	function conservingData(): boolean {
		const c = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } })
			.connection;
		return !!c && (c.saveData === true || /(^|-)2g$/.test(c.effectiveType ?? ''));
	}

	/* grammar §7.3: threshold 0 — playback follows visibility of any pixel.
	   Reduced motion / data saving leave the poster standing (golden rule 5);
	   manual play through the bar stays available. */
	function playWhenVisible(el: HTMLVideoElement) {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches || conservingData()) return;
		let inView = false;
		const sync = () => {
			if (!userPaused) paused = !inView || document.hidden;
		};
		const io = new IntersectionObserver(
			([entry]) => {
				inView = entry.isIntersecting;
				sync();
			},
			{ threshold: 0 }
		);
		io.observe(el);
		document.addEventListener('visibilitychange', sync);
		return {
			destroy() {
				io.disconnect();
				document.removeEventListener('visibilitychange', sync);
			}
		};
	}

	function toggleFullscreen() {
		if (document.fullscreenElement) document.exitFullscreen();
		else frame?.requestFullscreen?.();
	}

	function fmt(s: number): string {
		const whole = Math.floor(s || 0);
		return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
	}

	/* ---- embed facade ---- */
	let playing = $state(false);

	function embedSrc(url?: string): string | null {
		if (!url) return null;
		const vimeo = url.match(/vimeo\.com\/(\d+)/);
		if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?dnt=1&autoplay=1`;
		const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
		if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1`;
		return null;
	}
	const frameSrc = $derived(embedSrc(embedUrl));
</script>

<svelte:document onfullscreenchange={() => (isFullscreen = document.fullscreenElement === frame)} />

{#if src}
	<!-- pointer handlers only wake/hide the bar; real controls live inside -->
	<div
		class="chrome"
		role="presentation"
		class:contain={isFullscreen}
		style:aspect-ratio={poster ? `${poster.width} / ${poster.height}` : undefined}
		bind:this={frame}
		onpointermove={wake}
		onpointerleave={sleep}
		onfocusin={() => (focusWithin = true)}
		onfocusout={() => (focusWithin = false)}
	>
		<video
			{src}
			class:revealed={revealed || !poster}
			muted={muted}
			bind:paused
			bind:currentTime
			bind:duration
			loop
			playsinline
			preload="metadata"
			use:playWhenVisible
		></video>
		{#if poster}
			<span class="poster" class:gone={revealed}>
				<LqipImage img={poster} role="hero" eager fill outset />
			</span>
		{/if}
		<!-- mouse shortcut only — the bar's play word is the accessible control -->
		<button class="surface" tabindex="-1" aria-hidden="true" onclick={toggle}>
			<span class="visually-hidden">{paused ? 'Play' : 'Pause'}</span>
		</button>
		<div class="bar type-viewer" class:visible={barVisible}>
			<button class="word" onclick={toggle}>{paused ? 'Play' : 'Pause'}</button>
			<span class="time">{fmt(currentTime)} / {fmt(duration)}</span>
			<span class="scrub">
				<span class="track"></span>
				<span class="fill" style:transform="scaleX({duration ? currentTime / duration : 0})"
				></span>
				<input
					type="range"
					min="0"
					max={duration || 0}
					step="0.01"
					value={currentTime}
					oninput={(e) => (currentTime = +e.currentTarget.value)}
					aria-label="Seek"
				/>
			</span>
			<button class="word" onclick={() => (muted = !muted)} aria-pressed={!muted}>Sound</button>
			<button class="word" onclick={toggleFullscreen} aria-pressed={isFullscreen}>
				Fullscreen
			</button>
		</div>
	</div>
{:else if frameSrc}
	<!-- the facade frame keeps the poster's own ratio (§7.1); 16/9 is only
	     the no-poster fallback -->
	<div
		class="chrome"
		bind:this={frame}
		style:aspect-ratio={poster ? `${poster.width} / ${poster.height}` : undefined}
	>
		{#if playing}
			<iframe
				src={frameSrc}
				title="{title} — film"
				allow="autoplay; fullscreen; picture-in-picture"
				allowfullscreen
			></iframe>
		{:else}
			<button class="facade" aria-label="Play {title}" onclick={() => (playing = true)}>
				{#if poster}
					<span class="poster"><LqipImage img={poster} role="hero" eager priority fill outset /></span>
				{/if}
				<span class="bar type-viewer visible" aria-hidden="true">
					<span class="word">Play</span>
				</span>
			</button>
		{/if}
	</div>
{/if}

<style>
	/* bar metrics are grammar values (§2.4, §7.4) with no app.css token —
	   declared component-local; only opacity ever animates */
	.chrome {
		--dur-controls: 250ms;
		--bar-pad: 16px;
		--bar-gap: 16px;
		--track-size: 2px;
		position: relative;
		aspect-ratio: 16 / 9;
		background: var(--ink);
		color: var(--ink-inverse);
		overflow: hidden;
	}

	@media (min-width: 768px) {
		.chrome {
			--bar-pad: 32px;
		}
	}

	video {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0;
		transition: opacity var(--dur-label) var(--ease-out-cubic);
	}

	video.revealed {
		opacity: 1;
	}

	/* fullscreen flips the crop into a full view of the frame (§7.4) */
	.chrome.contain video {
		object-fit: contain;
	}

	/* poster swap: fades out once currentTime > 0, video fades in */
	.poster {
		position: absolute;
		inset: 0;
		transition: opacity var(--dur-label) var(--ease-out-cubic);
	}

	.poster.gone {
		opacity: 0;
	}

	iframe {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		border: 0;
	}

	.surface,
	.facade {
		position: absolute;
		inset: 0;
		border: 0;
		padding: 0;
		background: none;
		color: inherit;
		font: inherit;
		letter-spacing: inherit;
		text-transform: inherit; /* chrome words are uppercase (§7.4) — the UA button reset isn't */
		text-align: left;
		cursor: pointer;
	}

	.bar {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		gap: var(--bar-gap);
		padding: var(--bar-pad);
		opacity: 0;
		pointer-events: none;
		transition: opacity var(--dur-controls) ease-out;
	}

	.bar.visible {
		opacity: 1;
		pointer-events: auto;
	}

	/* §6.5 label rule: rest .3 → 1; 44px hit areas via padding that never
	   moves layout */
	.word {
		min-width: 38px;
		border: 0;
		padding: 17px 0;
		margin: -17px 0;
		background: none;
		color: inherit;
		font: inherit;
		letter-spacing: inherit;
		text-transform: inherit; /* see .facade — bar words stay uppercase */
		text-align: left;
		cursor: pointer;
		opacity: var(--alpha-rest);
		transition: opacity var(--dur-label) var(--ease-out-cubic);
	}

	@media (hover: hover) {
		.word:hover,
		.facade:hover .word {
			opacity: var(--alpha-active);
		}
	}

	.time {
		display: none;
		min-width: 58px;
		opacity: var(--alpha-rest);
		font-variant-numeric: tabular-nums;
	}

	@media (min-width: 768px) {
		.time {
			display: block;
		}
	}

	/* invisible range over a 2px currentColor track; progress is a
	   transform-only scaleX fill from the left edge */
	.scrub {
		position: relative;
		flex: 1;
		height: 11px;
	}

	.track,
	.fill {
		position: absolute;
		left: 0;
		width: 100%;
		top: 50%;
		height: var(--track-size);
		margin-top: calc(var(--track-size) / -2);
		background: currentColor;
	}

	.track {
		opacity: var(--alpha-rest);
	}

	.fill {
		transform-origin: left;
	}

	.scrub input {
		position: absolute;
		left: 0;
		top: 50%;
		width: 100%;
		height: 44px;
		transform: translateY(-50%);
		margin: 0;
		opacity: 0;
		cursor: pointer;
	}

	.chrome :global(:focus-visible) {
		outline-color: var(--ink-inverse);
	}
</style>
