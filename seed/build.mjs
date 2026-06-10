/* Builds the two seed artifacts from content.mjs:
 *   seed/production.ndjson         — `sanity dataset import` format
 *   src/lib/sanity/fixtures-data.json — normalized shapes for fixture mode
 * Run after editing content.mjs or regenerating images:  node seed/build.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as content from './content.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(join(here, '../src/lib/sanity/seed-manifest.json'), 'utf8'));

let keyCounter = 0;
const key = () => `seed${(keyCounter++).toString(36).padStart(4, '0')}`;

/* ---- Sanity document form ---- */

const assetImage = (img) =>
	img && {
		_type: 'image',
		_sanityAsset: `image@file://./images/${img.file}`,
		alt: img.alt,
		...(img.caption ? { caption: img.caption } : {})
	};

const portableText = (paras) =>
	(paras ?? []).map((p) => ({
		_type: 'block',
		_key: key(),
		style: p.style,
		markDefs: [],
		children: [{ _type: 'span', _key: key(), text: p.text, marks: [] }]
	}));

const ndjsonDocs = [
	...content.works.map((w) => ({
		_id: w._id,
		_type: 'work',
		title: w.title,
		slug: { _type: 'slug', current: w.slug },
		year: w.year,
		publishedAt: w.publishedAt,
		medium: w.medium,
		descriptors: w.descriptors,
		standfirst: w.standfirst,
		cover: assetImage(w.cover),
		...(w.coverLoop
			? { coverLoop: { _type: 'file', _sanityAsset: `file@file://./images/${w.coverLoop.file}` } }
			: {}),
		hero:
			w.hero?.kind === 'embed'
				? { kind: 'embed', embedUrl: w.hero.embedUrl, poster: assetImage(w.hero.poster) }
				: { kind: 'cover' },
		...(w.gallery
			? { gallery: w.gallery.map((g) => ({ ...assetImage(g), _key: key() })) }
			: {}),
		...(w.body ? { body: portableText(w.body) } : {}),
		...(w.credits
			? { credits: w.credits.map((c) => ({ ...c, _type: 'object', _key: key() })) }
			: {}),
		interactive: w.interactive ?? false,
		...(w.componentKey ? { componentKey: w.componentKey } : {})
	})),
	...content.openCalls.map((c) => ({
		_id: c._id,
		_type: 'openCall',
		title: c.title,
		slug: { _type: 'slug', current: c.slug },
		status: c.status,
		deadline: c.deadline,
		summary: c.summary,
		brief: portableText(c.brief),
		...(c.submissionUrl ? { submissionUrl: c.submissionUrl } : {}),
		...(c.cover ? { cover: assetImage(c.cover) } : {})
	})),
	...content.scraps.map((s) => ({
		_id: s._id,
		_type: 'archiveScrap',
		image: assetImage({ file: s.file, alt: s.alt }),
		note: s.note,
		date: s.date
	})),
	...content.members.map((m) => ({
		_id: m._id,
		_type: 'member',
		name: m.name,
		role: m.role,
		...(m.link ? { link: m.link } : {}),
		order: m.order
	})),
	...content.legalPages.map((l) => ({
		_id: l._id,
		_type: 'legalPage',
		title: l.title,
		slug: { _type: 'slug', current: l.slug },
		body: portableText(l.body)
	})),
	{
		_id: content.settings._id,
		_type: 'siteSettings',
		siteTitle: content.settings.siteTitle,
		manifesto: portableText(content.settings.manifesto),
		email: content.settings.email,
		instagram: content.settings.instagram,
		cityLine: content.settings.cityLine
	}
];

writeFileSync(
	join(here, 'production.ndjson'),
	ndjsonDocs.map((d) => JSON.stringify(d)).join('\n') + '\n'
);

/* ---- normalized fixture form (mirrors src/lib/sanity/types.ts) ---- */

const fixtureImg = (img) => {
	if (!img) return undefined;
	const m = manifest[img.file];
	if (!m) throw new Error(`no manifest entry for ${img.file} — run generate-images.py`);
	return {
		url: `/seed/${img.file}`,
		width: m.width,
		height: m.height,
		alt: img.alt,
		...(img.caption ? { caption: img.caption } : {}),
		lqip: m.lqip,
		...(m.variants?.length
			? { variants: m.variants.map((v) => ({ url: `/seed/${v.file}`, width: v.width })) }
			: {})
	};
};

const fixtureBlocks = (paras) =>
	(paras ?? []).map((p) => ({ kind: 'text', style: p.style, spans: [{ text: p.text }] }));

const fixtures = {
	works: content.works.map((w) => ({
		title: w.title,
		slug: w.slug,
		year: w.year,
		publishedAt: w.publishedAt,
		medium: w.medium,
		descriptors: w.descriptors,
		tags: [w.medium, ...w.descriptors],
		standfirst: w.standfirst,
		cover: fixtureImg(w.cover),
		...(w.coverLoop ? { coverLoop: { url: `/seed/${w.coverLoop.file}` } } : {}),
		hero:
			w.hero?.kind === 'embed'
				? { kind: 'embed', embedUrl: w.hero.embedUrl, poster: fixtureImg(w.hero.poster) }
				: { kind: 'cover' },
		gallery: (w.gallery ?? []).map(fixtureImg),
		body: fixtureBlocks(w.body),
		credits: w.credits ?? [],
		interactive: w.interactive ?? false,
		...(w.componentKey ? { componentKey: w.componentKey } : {})
	})),
	openCalls: content.openCalls.map((c) => ({
		title: c.title,
		slug: c.slug,
		status: c.status,
		deadline: c.deadline,
		summary: c.summary,
		brief: fixtureBlocks(c.brief),
		...(c.submissionUrl ? { submissionUrl: c.submissionUrl } : {}),
		results: []
	})),
	scraps: content.scraps.map((s) => ({
		image: fixtureImg({ file: s.file, alt: s.alt }),
		note: s.note,
		date: s.date
	})),
	members: content.members.map(({ name, role, link }) => ({ name, role, ...(link ? { link } : {}) })),
	legalPages: content.legalPages.map((l) => ({
		title: l.title,
		slug: l.slug,
		body: fixtureBlocks(l.body)
	})),
	settings: {
		siteTitle: content.settings.siteTitle,
		manifesto: fixtureBlocks(content.settings.manifesto),
		email: content.settings.email,
		instagram: content.settings.instagram,
		cityLine: content.settings.cityLine,
		press: content.settings.press
	}
};

writeFileSync(
	join(here, '../src/lib/sanity/fixtures-data.json'),
	JSON.stringify(fixtures, null, '\t') + '\n'
);

console.log(
	`production.ndjson: ${ndjsonDocs.length} docs · fixtures-data.json: ` +
		`${fixtures.works.length} works, ${fixtures.scraps.length} scraps, ${fixtures.openCalls.length} call(s)`
);
