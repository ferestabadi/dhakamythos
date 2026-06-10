import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

/* Publish loop: the Sanity webhook POSTs here with the shared secret, and
 * this triggers the Vercel deploy hook so the static site rebuilds with the
 * fresh content (~1 min). Keeping the deploy-hook URL server-side means the
 * Sanity webhook config never has to carry it.
 *
 * Env (Vercel project settings): SANITY_REVALIDATE_SECRET — also set on the
 * Sanity webhook; VERCEL_DEPLOY_HOOK_URL — from Vercel → Settings → Git →
 * Deploy Hooks. */
export const prerender = false;

export async function POST({ url }) {
	const secret = env.SANITY_REVALIDATE_SECRET;
	const hook = env.VERCEL_DEPLOY_HOOK_URL;
	if (!secret || !hook) error(503, 'Rebuild hook not configured');
	if (url.searchParams.get('secret') !== secret) error(401, 'Bad secret');

	const res = await fetch(hook, { method: 'POST' });
	if (!res.ok) error(502, 'Deploy hook refused');
	return json({ rebuilding: true });
}
