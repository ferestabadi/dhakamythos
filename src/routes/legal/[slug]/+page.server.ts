import { error } from '@sveltejs/kit';
import { getLegalPages } from '$lib/sanity/queries';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = async () =>
	(await getLegalPages()).map((p) => ({ slug: p.slug }));

export const load: PageServerLoad = async ({ params }) => {
	const page = (await getLegalPages()).find((p) => p.slug === params.slug);
	if (!page) error(404, 'Lost in the myth');
	return { page };
};
