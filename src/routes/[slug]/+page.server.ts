import { error } from '@sveltejs/kit';
import { getWork, getWorks } from '$lib/sanity/queries';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = async () =>
	(await getWorks()).map((w) => ({ slug: w.slug }));

export const load: PageServerLoad = async ({ params }) => {
	const result = await getWork(params.slug);
	if (!result) error(404, 'Lost in the myth');
	return result;
};
