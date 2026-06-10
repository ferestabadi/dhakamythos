import { error } from '@sveltejs/kit';
import { getOpenCall, getOpenCalls } from '$lib/sanity/queries';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = async () =>
	(await getOpenCalls()).map((c) => ({ slug: c.slug }));

export const load: PageServerLoad = async ({ params }) => {
	const call = await getOpenCall(params.slug);
	if (!call) error(404, 'Lost in the myth');
	return { call };
};
