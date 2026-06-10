import { getSettings } from '$lib/sanity/queries';
import type { LayoutServerLoad } from './$types';

/* Site settings feed the contact overlay and fat footer on every page. */
export const load: LayoutServerLoad = async () => {
	const { email, instagram, cityLine } = await getSettings();
	return { contact: { email, instagram, cityLine } };
};
