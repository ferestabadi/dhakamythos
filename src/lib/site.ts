import { env } from '$env/dynamic/public';

/* Canonical origin for sitemap entries and og: URLs, which must be
 * absolute. Override with PUBLIC_SITE_URL once a domain is attached. */
export const SITE_URL = env.PUBLIC_SITE_URL || 'https://dhakamythos.vercel.app';

/** Absolute URL for a path or an already-absolute URL (CDN images). */
export function absUrl(pathOrUrl: string): string {
	return new URL(pathOrUrl, SITE_URL).toString();
}
