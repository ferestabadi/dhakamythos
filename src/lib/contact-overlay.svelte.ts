/* The Contact overlay is a dialog with no route (docs/SITEMAP.md). Any
 * component may open it — nav, fat footer, deck empty state — so its state
 * lives here rather than threading through props. The overlay itself renders
 * once, in the root layout. */
class ContactOverlayState {
	isOpen = $state(false);

	open = () => {
		this.isOpen = true;
	};

	close = () => {
		this.isOpen = false;
	};
}

export const contactOverlay = new ContactOverlayState();
