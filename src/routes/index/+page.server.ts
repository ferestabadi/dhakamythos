import { getWorks } from '$lib/sanity/queries';
import type { PageServerLoad } from './$types';

/* Server load: queries (and fixtures) stay out of the client bundle, and
 * only the catalogue row of each work — title, slug, year, tags, plus the
 * cover that feeds the desktop hover-preview figure — lands in the payload. */
export const load: PageServerLoad = async () => {
	const works = (await getWorks()).map(({ title, slug, year, tags, cover }) => ({
		title,
		slug,
		year,
		tags,
		cover
	}));
	return { works };
};
