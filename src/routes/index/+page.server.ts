import { getWorks } from '$lib/sanity/queries';
import type { PageServerLoad } from './$types';

/* Server load: queries (and fixtures) stay out of the client bundle, and
 * only the catalogue row of each work — title, slug, year, tags — lands in
 * the page payload. */
export const load: PageServerLoad = async () => {
	const works = (await getWorks()).map(({ title, slug, year, tags }) => ({
		title,
		slug,
		year,
		tags
	}));
	return { works };
};
