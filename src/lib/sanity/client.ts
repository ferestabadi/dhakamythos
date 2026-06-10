import { createClient, type SanityClient } from '@sanity/client';
import { env } from '$env/dynamic/public';

/* Without a projectId the site runs on local fixtures (kickoff fallback) —
 * queries.ts switches on `client` being null, nothing else needs to know. */
export const projectId = env.PUBLIC_SANITY_PROJECT_ID || undefined;
export const dataset = env.PUBLIC_SANITY_DATASET || 'production';

export const client: SanityClient | null = projectId
	? createClient({
			projectId,
			dataset,
			apiVersion: '2026-06-01',
			useCdn: true,
			perspective: 'published'
		})
	: null;
