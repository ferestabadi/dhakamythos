import { getScraps } from '$lib/sanity/queries';
import type { PageServerLoad } from './$types';

/* Server load: queries (and fixtures) stay out of the client bundle; all
 * scraps are prerendered into the page, images lazy-load below the fold. */
export const load: PageServerLoad = async () => {
	return { scraps: await getScraps() };
};
