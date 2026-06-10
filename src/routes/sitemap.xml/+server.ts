import { getLegalPages, getOpenCalls, getWorks } from '$lib/sanity/queries';
import { SITE_URL } from '$lib/site';

export const prerender = true;

export async function GET() {
	const [works, calls, legal] = await Promise.all([
		getWorks(),
		getOpenCalls(),
		getLegalPages()
	]);

	const paths = [
		'/',
		'/index/',
		'/archive',
		'/collective',
		'/open-calls',
		...works.map((w) => `/${w.slug}`),
		...calls.map((c) => `/open-calls/${c.slug}`),
		...legal.map((l) => `/legal/${l.slug}`)
	];

	const xml =
		`<?xml version="1.0" encoding="UTF-8"?>\n` +
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
		paths.map((p) => `\t<url><loc>${SITE_URL}${p}</loc></url>`).join('\n') +
		`\n</urlset>\n`;

	return new Response(xml, {
		headers: { 'Content-Type': 'application/xml' }
	});
}
