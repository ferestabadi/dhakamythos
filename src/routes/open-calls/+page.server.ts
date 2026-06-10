import { getOpenCalls } from '$lib/sanity/queries';
import type { PageServerLoad } from './$types';

/* The list renders row anatomy only, so briefs and result links stay out of
 * the serialized payload (same trim the Deck applies via WorkCard). */
export const load: PageServerLoad = async () => ({
	calls: (await getOpenCalls()).map(({ title, slug, status, deadline, summary }) => ({
		title,
		slug,
		status,
		deadline,
		summary
	}))
});
