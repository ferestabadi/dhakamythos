/* Typed content accessors — the whole site reads the CMS through these.
 * With no projectId configured the same calls answer from local fixtures,
 * so every page renders before the collective's Sanity project exists. */
import { client } from './client';
import * as fixtures from './fixtures';
import type {
	Block,
	Img,
	LegalPage,
	Member,
	OpenCall,
	Scrap,
	SiteSettings,
	Work
} from './types';

/* GROQ fragment projecting an image field into the normalized Img shape. */
const IMG = `{
	"alt": coalesce(alt, ''),
	caption,
	"url": asset->url,
	"ref": asset->_id,
	"width": asset->metadata.dimensions.width,
	"height": asset->metadata.dimensions.height,
	"lqip": asset->metadata.lqip
}`;

const BLOCKS = `[]{
	...,
	_type == "image" => ${IMG}
}`;

const WORK = `{
	title,
	"slug": slug.current,
	year,
	publishedAt,
	medium,
	"descriptors": coalesce(descriptors, []),
	standfirst,
	"cover": cover ${IMG},
	"coverLoop": coverLoop { "url": asset->url },
	hero { kind, embedUrl, "poster": poster ${IMG} },
	"gallery": coalesce(gallery[] ${IMG}, []),
	"body": coalesce(body ${BLOCKS}, []),
	"credits": coalesce(credits[]{ role, names }, []),
	"interactive": coalesce(interactive, false),
	componentKey
}`;

/* ---- raw → normalized ---- */

type RawImg = {
	alt: string;
	caption?: string;
	url: string;
	ref: string;
	width: number;
	height: number;
	lqip?: string;
};

function toImg(raw: RawImg | null | undefined): Img | undefined {
	if (!raw?.url) return undefined;
	return {
		url: raw.url,
		width: Math.round(raw.width),
		height: Math.round(raw.height),
		alt: raw.alt ?? '',
		caption: raw.caption ?? undefined,
		lqip: raw.lqip ?? undefined,
		sanityRef: raw.ref
	};
}

/* Portable text, reduced to the shapes the site renders. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toBlocks(raw: any[] | null | undefined): Block[] {
	if (!raw) return [];
	const blocks: Block[] = [];
	for (const b of raw) {
		if (b._type === 'image') {
			const image = toImg(b);
			if (image) blocks.push({ kind: 'image', image });
			continue;
		}
		if (b._type !== 'block') continue;
		const styles = ['normal', 'h2', 'h3', 'blockquote'] as const;
		const style = styles.includes(b.style) ? b.style : 'normal';
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const spans = (b.children ?? []).map((c: any) => {
			const marks: string[] = c.marks ?? [];
			const link = b.markDefs?.find(
				(d: { _key: string; _type: string }) => marks.includes(d._key) && d._type === 'link'
			);
			return {
				text: c.text ?? '',
				em: marks.includes('em') || undefined,
				strong: marks.includes('strong') || undefined,
				href: link?.href
			};
		});
		blocks.push({ kind: 'text', style, spans });
	}
	return blocks;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toWork(raw: any): Work {
	const cover = toImg(raw.cover);
	if (!cover) throw new Error(`work "${raw.slug}" has no cover`);
	const poster = toImg(raw.hero?.poster);
	return {
		title: raw.title,
		slug: raw.slug,
		year: raw.year,
		publishedAt: raw.publishedAt,
		medium: raw.medium,
		descriptors: raw.descriptors,
		tags: [raw.medium, ...raw.descriptors],
		standfirst: raw.standfirst,
		cover,
		coverLoop: raw.coverLoop?.url ? { url: raw.coverLoop.url } : undefined,
		hero:
			raw.hero?.kind === 'embed' && raw.hero.embedUrl
				? { kind: 'embed', embedUrl: raw.hero.embedUrl, poster }
				: { kind: 'cover' },
		gallery: (raw.gallery ?? []).map(toImg).filter(Boolean) as Img[],
		body: toBlocks(raw.body),
		credits: raw.credits ?? [],
		interactive: raw.interactive,
		componentKey: raw.componentKey ?? undefined
	};
}

/* ---- accessors ---- */

export async function getWorks(): Promise<Work[]> {
	if (!client) return fixtures.works;
	const raw = await client.fetch(
		`*[_type == "work" && defined(slug.current)] | order(publishedAt desc) ${WORK}`
	);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return raw.map((r: any) => toWork(r));
}

/** A work plus its next-newest neighbour (wrapping) for the Next-work row. */
export async function getWork(
	slug: string
): Promise<{ work: Work; next: { title: string; slug: string } } | null> {
	const works = await getWorks();
	const i = works.findIndex((w) => w.slug === slug);
	if (i === -1) return null;
	const next = works[(i + 1) % works.length];
	return { work: works[i], next: { title: next.title, slug: next.slug } };
}

export async function getScraps(): Promise<Scrap[]> {
	if (!client) return fixtures.scraps;
	const raw = await client.fetch(
		`*[_type == "archiveScrap"] | order(date desc) { "image": image ${IMG}, note, date }`
	);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return raw
		.map((r: any) => ({ image: toImg(r.image), note: r.note ?? undefined, date: r.date ?? undefined }))
		.filter((s: Scrap) => s.image);
}

const OPEN_CALL = `{
	title,
	"slug": slug.current,
	status,
	deadline,
	summary,
	"brief": coalesce(brief ${BLOCKS}, []),
	submissionUrl,
	"results": coalesce(results[]->{ title, "slug": slug.current }, [])
}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toOpenCall(raw: any): OpenCall {
	return {
		title: raw.title,
		slug: raw.slug,
		status: raw.status,
		deadline: raw.deadline ?? undefined,
		summary: raw.summary,
		brief: toBlocks(raw.brief),
		submissionUrl: raw.submissionUrl ?? undefined,
		results: raw.results
	};
}

export async function getOpenCalls(): Promise<OpenCall[]> {
	if (!client) return fixtures.openCalls;
	// status desc puts "open" before "closed"
	const raw = await client.fetch(
		`*[_type == "openCall" && defined(slug.current)] | order(status desc, deadline desc) ${OPEN_CALL}`
	);
	return raw.map(toOpenCall);
}

export async function getOpenCall(slug: string): Promise<OpenCall | null> {
	const calls = await getOpenCalls();
	return calls.find((c) => c.slug === slug) ?? null;
}

export async function getMembers(): Promise<Member[]> {
	if (!client) return fixtures.members;
	return client.fetch(`*[_type == "member"] | order(order asc) { name, role, link }`);
}

export async function getLegalPages(): Promise<LegalPage[]> {
	if (!client) return fixtures.legalPages;
	const raw = await client.fetch(
		`*[_type == "legalPage" && defined(slug.current)] { title, "slug": slug.current, "body": coalesce(body ${BLOCKS}, []) }`
	);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return raw.map((r: any) => ({ title: r.title, slug: r.slug, body: toBlocks(r.body) }));
}

export async function getSettings(): Promise<SiteSettings> {
	if (!client) return fixtures.settings;
	const raw = await client.fetch(
		`*[_type == "siteSettings"][0] {
			siteTitle, "manifesto": coalesce(manifesto ${BLOCKS}, []), email, instagram, cityLine,
			"press": coalesce(press[]{ label, url }, [])
		}`
	);
	if (!raw) return fixtures.settings;
	return { ...raw, manifesto: toBlocks(raw.manifesto) };
}
