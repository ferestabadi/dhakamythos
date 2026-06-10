import type { Component } from 'svelte';

/* The interactive-works harness (docs/SITEMAP.md): every piece lives at
 * src/lib/pieces/<componentKey>/index.svelte and is code-split by this
 * glob — the case route imports on demand, so a piece's bundle never
 * ships on any other page. */
const modules = import.meta.glob<{ default: Component }>('./*/index.svelte');

function loaderFor(componentKey: string) {
	return Object.entries(modules).find(([path]) =>
		path.includes(`/${componentKey}/`)
	)?.[1];
}

/** Resolve a piece component, or null when no piece matches the key (the
 * case page then falls back to its cover so the work still renders). */
export async function loadPiece(componentKey: string): Promise<Component | null> {
	const loader = loaderFor(componentKey);
	if (!loader) return null;
	return (await loader()).default;
}

/** Fetch the piece's chunk while the browser is idle so the mount below
 * the standfirst feels instant — allowed warm-up per PERFORMANCE.md. */
export function warmUpPiece(componentKey: string) {
	const idle =
		'requestIdleCallback' in window
			? window.requestIdleCallback
			: (cb: () => void) => setTimeout(cb, 200);
	idle(() => void loaderFor(componentKey)?.());
}
