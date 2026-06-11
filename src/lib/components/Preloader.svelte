<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { appState } from '$lib/app-state.svelte';

	/* First-visit home intro (grammar §6.1, gap W3-02). The inline script in
	   app.html flags <html> with .intro-pending before first paint; this
	   component takes over at hydration, counts deck image decodes up to
	   100%, runs the two-beat exit, then flips appState.ready — the deck
	   gates its sweep and the header gates its entrance on that flag. */

	const FLAG = 'dm-intro';
	const EXIT_MS = 1250; // sheet fade ends: 750ms beat + 500ms fade (§6.1)
	const STALL_MS = 8000; // a wedged decode must never strand the visitor

	let running = $state(false);
	let leaving = $state(false);
	let shown = $state(0);

	onMount(() => {
		const root = document.documentElement;
		const wantsIntro =
			page.url.pathname === '/' &&
			!sessionStorage.getItem(FLAG) &&
			!matchMedia('(prefers-reduced-motion: reduce)').matches;

		if (!wantsIntro) {
			root.classList.remove('intro-pending'); // safety — never set on this path
			/* double rAF: let the header's post-hydration hidden frame paint
			   first so its beat-long entrance actually fades (gap W3-10) */
			let raf = requestAnimationFrame(() => {
				raf = requestAnimationFrame(() => {
					appState.ready = true;
				});
			});
			return () => cancelAnimationFrame(raf);
		}

		running = true;
		let target = 0;
		let raf = 0;
		let exitTimer = 0;
		let stallTimer = 0;

		// the component's own sheet is in the DOM after this flush — release
		// the first-paint CSS sheet without a gap
		requestAnimationFrame(() => root.classList.remove('intro-pending'));

		const finish = () => {
			leaving = true;
			sessionStorage.setItem(FLAG, '1');
			clearTimeout(stallTimer);
			exitTimer = window.setTimeout(() => {
				appState.ready = true;
				running = false;
			}, EXIT_MS);
		};

		const tick = () => {
			// the readout lerps toward the decode-driven target (§6.1)
			shown += (target - shown) * 0.1;
			if (Math.round(shown) >= 100) {
				shown = 100;
				finish();
				return;
			}
			raf = requestAnimationFrame(tick);
		};

		const imgs = Array.from(document.querySelectorAll<HTMLImageElement>('[data-deck] img'));
		if (imgs.length === 0) {
			shown = 100;
			finish();
		} else {
			const step = 100 / imgs.length;
			for (const img of imgs) {
				img
					.decode()
					.catch(() => {}) // a broken image still counts as settled
					.then(() => {
						target += step;
					});
			}
			stallTimer = window.setTimeout(() => {
				target = 100;
			}, STALL_MS);
			raf = requestAnimationFrame(tick);
		}

		return () => {
			cancelAnimationFrame(raf);
			clearTimeout(exitTimer);
			clearTimeout(stallTimer);
		};
	});
</script>

{#if running}
	<div class="sheet" class:leaving aria-hidden="true">
		<!-- the readout speaks viewer chrome: 11px/1 (§2.2, §4) -->
		<span class="count type-viewer">{Math.round(shown)}%</span>
	</div>
{/if}

<style>
	.sheet {
		--delay-count: 250ms; /* % exit beat (grammar §6.1) — not a global token */
		position: fixed;
		inset: 0;
		z-index: var(--z-preloader);
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--ground);
		/* sheet exit: 500ms fade after a 750ms beat (§6.1) */
		transition: opacity var(--dur-label) var(--ease-quad-inout) var(--dur-beat);
	}

	.count {
		font-variant-numeric: tabular-nums;
		/* readout exit: 500ms fade after a 250ms beat (§6.1) */
		transition: opacity var(--dur-label) var(--ease-quad-inout) var(--delay-count);
	}

	.leaving,
	.leaving .count {
		opacity: 0;
	}

	/* The inline head script flags <html> before hydration so the sheet
	   exists from the first paint on intro-eligible loads. Without JS the
	   class is never added and the prerendered page renders normally. */
	:global(html.intro-pending)::before {
		content: '';
		position: fixed;
		inset: 0;
		z-index: var(--z-preloader);
		background: var(--ground);
	}
</style>
