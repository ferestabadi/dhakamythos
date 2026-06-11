/* Mount-time staggered fade (grammar §2.4, gap W3-03). Entrances are
 * opacity-only and fire once per route mount — nothing is scroll-triggered.
 * The prerendered markup ships visible; JS drops opacity to 0, commits that
 * frame, then fades back in over --dur-long --ease-quad-inout after `delay`.
 * No-JS and reduced-motion render instantly. */
export function reveal(el: HTMLElement, options: { delay?: number } = {}) {
	if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	el.style.transition = 'none';
	el.style.opacity = '0';
	void el.offsetWidth; // commit the hidden frame so the fade has a start state
	el.style.transition = `opacity var(--dur-long) var(--ease-quad-inout) ${options.delay ?? 0}ms`;
	el.style.opacity = '1';
	// drop the inline styles once settled so they can't shadow later hovers
	const settle = (event: TransitionEvent) => {
		if (event.target !== el) return;
		el.style.removeProperty('transition');
		el.style.removeProperty('opacity');
		el.removeEventListener('transitionend', settle);
	};
	el.addEventListener('transitionend', settle);
	return {
		destroy() {
			el.removeEventListener('transitionend', settle);
		}
	};
}
