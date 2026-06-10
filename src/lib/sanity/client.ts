import { createClient, type SanityClient } from '@sanity/client';
import { projectId, dataset } from './config';

/* Server-side only (queries run in load functions at build time) — keeping
 * @sanity/client out of the browser bundle is a first-load JS budget rule.
 * queries.ts switches to fixtures when this is null. */
export const client: SanityClient | null = projectId
	? createClient({
			projectId,
			dataset,
			apiVersion: '2026-06-01',
			useCdn: true,
			perspective: 'published'
		})
	: null;
