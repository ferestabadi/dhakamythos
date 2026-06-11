<script lang="ts">
	/* City Memory Map — demo interactive piece proving the harness.
	 *
	 * Self-contained per docs/SITEMAP.md: everything the piece needs lives in
	 * this folder, the case route imports it dynamically, and none of it
	 * ships on any other page. A procedurally drawn remembered-city grid,
	 * pannable by drag, arrow keys or touch.
	 */
	import { onMount } from 'svelte';

	let canvas: HTMLCanvasElement | undefined = $state();
	let stage: HTMLDivElement | undefined = $state();
	let panX = 0;
	let panY = 0;

	const TILE = 220;

	/* deterministic pseudo-randomness so a street keeps its shape as it
	   scrolls out of view and back */
	function hash(x: number, y: number, salt: number): number {
		let h = (x * 374761393 + y * 668265263 + salt * 2246822519) | 0;
		h = Math.imul(h ^ (h >>> 13), 1274126177);
		return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
	}

	function tokenColor(name: string, fallback: string): string {
		if (!canvas) return fallback;
		const v = getComputedStyle(canvas).getPropertyValue(name).trim();
		return v || fallback;
	}

	function draw() {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		const { width: w, height: h } = canvas;
		const dpr = Math.min(window.devicePixelRatio || 1, 2);

		const ground = tokenColor('--ground', '#fafafa');
		const ink = tokenColor('--ink', '#000');
		// hierarchy is ink at an opacity step, never a hue (grammar §2.1)
		const rest = parseFloat(tokenColor('--alpha-rest', '0.3'));

		ctx.fillStyle = ground;
		ctx.fillRect(0, 0, w, h);
		ctx.save();
		ctx.scale(dpr, dpr);

		const cw = w / dpr;
		const ch = h / dpr;
		const x0 = Math.floor(panX / TILE) - 1;
		const y0 = Math.floor(panY / TILE) - 1;

		for (let gx = x0; gx < x0 + cw / TILE + 2; gx++) {
			for (let gy = y0; gy < y0 + ch / TILE + 2; gy++) {
				const sx = gx * TILE - panX;
				const sy = gy * TILE - panY;

				// streets: jittered through-lines at the resting opacity step
				ctx.strokeStyle = ink;
				ctx.globalAlpha = rest;
				ctx.lineWidth = 1;
				const jx = hash(gx, gy, 1) * 60 - 30;
				const jy = hash(gx, gy, 2) * 60 - 30;
				ctx.beginPath();
				ctx.moveTo(sx, sy + TILE / 2 + jy);
				ctx.lineTo(sx + TILE, sy + TILE / 2 - jy);
				ctx.moveTo(sx + TILE / 2 + jx, sy);
				ctx.lineTo(sx + TILE / 2 - jx, sy + TILE);
				ctx.stroke();

				// blocks: remembered buildings, denser near "old town" origin
				const density = 3 + Math.floor(hash(gx, gy, 3) * 4);
				ctx.globalAlpha = 1;
				for (let b = 0; b < density; b++) {
					const bx = sx + hash(gx, gy, 10 + b) * (TILE - 40);
					const by = sy + hash(gx, gy, 20 + b) * (TILE - 40);
					const bw = 8 + hash(gx, gy, 30 + b) * 28;
					const bh = 8 + hash(gx, gy, 40 + b) * 28;
					ctx.fillStyle = ink;
					ctx.globalAlpha = 0.08 + hash(gx, gy, 50 + b) * 0.16;
					ctx.fillRect(bx, by, bw, bh);
				}

				// a memory pin on roughly every third tile
				if (hash(gx, gy, 5) > 0.66) {
					const px = sx + hash(gx, gy, 6) * TILE;
					const py = sy + hash(gx, gy, 7) * TILE;
					ctx.globalAlpha = 1;
					ctx.fillStyle = ink;
					ctx.beginPath();
					ctx.arc(px, py, 3, 0, Math.PI * 2);
					ctx.fill();
				}
			}
		}
		ctx.restore();
	}

	function pan(dx: number, dy: number) {
		panX += dx;
		panY += dy;
		draw();
	}

	function resize() {
		if (!canvas || !stage) return;
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		canvas.width = stage.clientWidth * dpr;
		canvas.height = stage.clientHeight * dpr;
		draw();
	}

	onMount(() => {
		resize();
		const ro = new ResizeObserver(resize);
		if (stage) ro.observe(stage);

		let dragging = false;
		let lastX = 0;
		let lastY = 0;
		const down = (e: PointerEvent) => {
			dragging = true;
			lastX = e.clientX;
			lastY = e.clientY;
			canvas?.setPointerCapture(e.pointerId);
		};
		const move = (e: PointerEvent) => {
			if (!dragging) return;
			pan(lastX - e.clientX, lastY - e.clientY);
			lastX = e.clientX;
			lastY = e.clientY;
		};
		const up = () => (dragging = false);
		canvas?.addEventListener('pointerdown', down);
		canvas?.addEventListener('pointermove', move);
		canvas?.addEventListener('pointerup', up);
		canvas?.addEventListener('pointercancel', up);

		return () => {
			ro.disconnect();
			canvas?.removeEventListener('pointerdown', down);
			canvas?.removeEventListener('pointermove', move);
			canvas?.removeEventListener('pointerup', up);
			canvas?.removeEventListener('pointercancel', up);
		};
	});

	function onKeydown(e: KeyboardEvent) {
		const steps: Record<string, [number, number]> = {
			ArrowLeft: [-40, 0],
			ArrowRight: [40, 0],
			ArrowUp: [0, -40],
			ArrowDown: [0, 40]
		};
		const step = steps[e.key];
		if (!step) return;
		e.preventDefault();
		pan(...step);
	}

	function enterFullscreen() {
		stage?.requestFullscreen?.();
	}
</script>

<div class="stage" bind:this={stage}>
	<canvas
		bind:this={canvas}
		tabindex="0"
		aria-label="City memory map — drag or use the arrow keys to drift through the remembered city"
		onkeydown={onKeydown}
	></canvas>
	<p class="hint type-base" aria-hidden="true">Drag to drift</p>
	<button class="fullscreen button button--pill type-button" onclick={enterFullscreen}>
		<span class="nudge">Enter fullscreen</span>
	</button>
</div>

<style>
	/* hard-cropped, border-less media surface (grammar §1 DNA 9) */
	.stage {
		position: relative;
		height: 70dvh;
		background: var(--ground);
	}

	.stage:fullscreen {
		height: 100%;
	}

	canvas {
		display: block;
		width: 100%;
		height: 100%;
		cursor: grab;
		touch-action: none;
	}

	canvas:active {
		cursor: grabbing;
	}

	.hint {
		position: absolute;
		left: var(--axis-x);
		bottom: var(--legal-bottom);
		margin: 0;
		opacity: var(--alpha-rest);
		pointer-events: none;
	}

	/* bottom-right pill, same anatomy as the deck switcher */
	.fullscreen {
		--pill-pad-x: 16px;
		position: absolute;
		right: var(--frame);
		bottom: var(--frame);
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		padding: 0 var(--pill-pad-x);
		border: 0;
		background: none;
		color: var(--ink);
		font: inherit;
		letter-spacing: inherit;
		text-transform: inherit;
		cursor: pointer;
	}

	.fullscreen .nudge {
		display: inline-block;
		transform: translateY(1.5px);
	}
</style>
