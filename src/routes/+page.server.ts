import { getWorks } from '$lib/sanity/queries';
import type { WorkCard } from '$lib/sanity/types';
import type { PageServerLoad } from './$types';

/* Server load: queries (and fixtures) stay out of the client bundle, and
 * only the card slice of each work lands in the page payload. */
export const load: PageServerLoad = async () => {
	const works: WorkCard[] = (await getWorks()).map(
		({ title, slug, year, tags, cover, coverLoop }) => ({
			title,
			slug,
			year,
			tags,
			cover,
			...(coverLoop ? { coverLoop } : {})
		})
	);
	return { works };
};
