/* Shared shell state — frozen contract consumed by the build agents.
 * ready: flips true when the intro preloader finishes (or immediately when
 *        skipped); the deck gates its intro sweep on it.
 * contactOpen: mirrors the contact overlay.
 * theme: header ink over light ground vs inverse over dark media. */
export const appState = $state({
	ready: false,
	contactOpen: false,
	theme: 'ink' as 'ink' | 'inverse'
});
