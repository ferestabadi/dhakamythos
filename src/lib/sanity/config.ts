import { env } from '$env/dynamic/public';

/* Project coordinates only — safe for the client bundle. The API client
 * (server-side queries) and the image URL builder both read these; without
 * a projectId the site runs on local fixtures (kickoff fallback). */
export const projectId = env.PUBLIC_SANITY_PROJECT_ID || undefined;
export const dataset = env.PUBLIC_SANITY_DATASET || 'production';
