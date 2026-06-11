import { getMembers, getScraps, getSettings } from '$lib/sanity/queries';
import type { PageServerLoad } from './$types';

/* Only the slices this page renders cross into the payload — contact fields
 * already travel via the layout's settings load. The studio artwork is the
 * archive's square study: the grammar wants an exact 1:1 crop (§5.2, §7.1),
 * so the first square image in the archive serves as the page's figure. */
export const load: PageServerLoad = async () => {
	const [settings, members, scraps] = await Promise.all([
		getSettings(),
		getMembers(),
		getScraps()
	]);
	const artwork = scraps.find((s) => s.image.width === s.image.height)?.image;
	return { manifesto: settings.manifesto, press: settings.press, members, artwork };
};
