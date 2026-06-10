import { getMembers, getSettings } from '$lib/sanity/queries';
import type { PageServerLoad } from './$types';

/* Only the slices this page renders cross into the payload — contact fields
 * already travel via the layout's settings load. */
export const load: PageServerLoad = async () => {
	const [settings, members] = await Promise.all([getSettings(), getMembers()]);
	return { manifesto: settings.manifesto, press: settings.press, members };
};
