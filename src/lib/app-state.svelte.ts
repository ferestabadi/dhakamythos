/* Shared shell state — frozen contract consumed by the build agents.
 * ready: flips true when the intro preloader finishes (or immediately when
 *        skipped); the deck gates its intro sweep on it.
 * covered: true while the home-arrival ground flash still hides the deck
 *        (grammar §6.3) — the deck holds its intro sweep until the flash
 *        starts its fade-out, so the sweep plays inside the reveal.
 * contactOpen: mirrors the contact overlay.
 * theme: header ink over light ground vs inverse over dark media. */
export const appState = $state({
	ready: false,
	covered: false,
	contactOpen: false,
	theme: 'ink' as 'ink' | 'inverse'
});
