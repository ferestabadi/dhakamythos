<script lang="ts">
	import { onMount } from 'svelte';

	/* Fine-pointer-only floating label: the hovered work's title, read from
	   the nearest [data-cursor] under the pointer, trailing it at lerp 0.1
	   (grammar §6.2, §8). Decorative and never load-bearing — titles also
	   live in aria-labels; touch devices never mount the listeners. */
	let el: HTMLSpanElement | undefined = $state();
	let label = $state('');

	onMount(() => {
		if (!matchMedia('(pointer: fine)').matches) return;
		let x = 0;
		let y = 0;
		let targetX = 0;
		let targetY = 0;
		let raf = 0;
		const frame = () => {
			raf = requestAnimationFrame(frame);
			x += (targetX - x) * 0.1;
			y += (targetY - y) * 0.1;
			if (el) el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
		};
		const move = (e: PointerEvent) => {
			targetX = e.clientX;
			targetY = e.clientY;
			if (!raf) {
				// first move: appear at the pointer, no cross-screen chase
				x = targetX;
				y = targetY;
				raf = requestAnimationFrame(frame);
			}
		};
		const over = (e: PointerEvent) => {
			label =
				(e.target instanceof Element &&
					e.target.closest('[data-cursor]')?.getAttribute('data-cursor')) ||
				'';
		};
		window.addEventListener('pointermove', move, { passive: true });
		window.addEventListener('pointerover', over, { passive: true });
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener('pointermove', move);
			window.removeEventListener('pointerover', over);
		};
	});
</script>

<span bind:this={el} class="cursor-label type-base" class:visible={!!label} aria-hidden="true">
	{label}
</span>

<style>
	/* bare blended text — no chip (gap W4-03). The saturate(0) is constant
	   chrome, never animated; only opacity moves. */
	.cursor-label {
		--cursor-pad: 12px;
		position: fixed;
		top: 0;
		left: 0;
		z-index: var(--z-cursor);
		pointer-events: none;
		padding: var(--cursor-pad);
		white-space: nowrap;
		color: var(--ink-inverse);
		mix-blend-mode: exclusion;
		filter: saturate(0);
		opacity: 0;
		transition: opacity var(--dur-label) var(--ease-out-cubic);
	}

	.cursor-label.visible {
		opacity: 1;
	}
</style>
