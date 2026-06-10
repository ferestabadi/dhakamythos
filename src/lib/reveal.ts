/* Reveal on viewport entry (docs/DESIGN.md motion grammar): opacity +
 * translateY 24→0 at 20% visibility, once. The hiding class is added only
 * when JS runs, so prerendered pages stay fully visible without it; under
 * reduced motion the global override collapses this to a fast fade. */
export function reveal(el: HTMLElement) {
	el.classList.add('reveal-init');
	const io = new IntersectionObserver(
		([entry]) => {
			if (entry.isIntersecting) {
				el.classList.add('revealed');
				io.disconnect();
			}
		},
		/* the huge top margin counts anything already scrolled past as seen,
		   so instant jumps (anchors, restored scroll) can't strand content
		   invisible above the viewport */
		{ threshold: 0.2, rootMargin: '10000px 0px 0px 0px' }
	);
	io.observe(el);
	return { destroy: () => io.disconnect() };
}
