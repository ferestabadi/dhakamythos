<script lang="ts">
	import { onMount } from 'svelte';

	/* Desktop-only cursor word ("View", "Drag", "Next") read from the nearest
	   [data-cursor] under the pointer. Decorative and never load-bearing —
	   touch devices never mount the listeners. */
	let el: HTMLSpanElement | undefined = $state();
	let label = $state('');

	onMount(() => {
		if (!matchMedia('(pointer: fine)').matches) return;
		const move = (e: PointerEvent) => {
			if (el) el.style.transform = `translate3d(${e.clientX + 14}px, ${e.clientY + 18}px, 0)`;
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
			window.removeEventListener('pointermove', move);
			window.removeEventListener('pointerover', over);
		};
	});
</script>

<span bind:this={el} class="cursor-label type-meta" class:visible={!!label} aria-hidden="true">
	{label}
</span>

<style>
	.cursor-label {
		position: fixed;
		top: 0;
		left: 0;
		z-index: var(--z-cursor);
		pointer-events: none;
		background: var(--ink);
		color: var(--ground);
		padding: var(--space-1) var(--space-2);
		opacity: 0;
		transition: opacity var(--dur-fast) var(--ease-out);
	}

	.cursor-label.visible {
		opacity: 1;
	}
</style>
