/* Seed QA — invariants the schema enforces in the studio, checked here so
 * fixture mode and the NDJSON import can't drift from them.
 * Run: node seed/validate.mjs (build.mjs artifacts must exist). */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = JSON.parse(readFileSync(join(here, '../src/lib/sanity/fixtures-data.json'), 'utf8'));
const ndjson = readFileSync(join(here, 'production.ndjson'), 'utf8').trim().split('\n').map(JSON.parse);

const RESERVED = ['index', 'archive', 'collective', 'open-calls', 'legal'];
const MEDIUMS = ['Text', 'Photo', 'Video', 'Interactive', 'Mixed'];
const failures = [];
const check = (ok, msg) => ok || failures.push(msg);

check(fixtures.works.length === 6, 'exactly 6 seed works');
check(fixtures.scraps.length === 8, 'exactly 8 archive scraps');
check(fixtures.openCalls.length === 1, 'exactly 1 open call');

const slugs = fixtures.works.map((w) => w.slug);
check(new Set(slugs).size === slugs.length, 'work slugs unique');
check(slugs.every((s) => !RESERVED.includes(s)), 'no reserved slugs');

const coveredMediums = new Set(fixtures.works.map((w) => w.medium));
check(MEDIUMS.every((m) => coveredMediums.has(m)), 'one work per medium');
check(fixtures.works.some((w) => w.interactive && w.componentKey), 'interactive stub present');

for (const w of fixtures.works) {
	check(w.standfirst.length <= 240, `standfirst <= 240: ${w.slug}`);
	check((w.descriptors ?? []).length <= 3, `max 3 descriptors: ${w.slug}`);
	check(!!w.cover?.alt, `cover alt text: ${w.slug}`);
	check(w.cover?.width >= 1600, `cover >= 1600px wide: ${w.slug}`);
	check(w.tags[0] === w.medium, `compound tag starts with medium: ${w.slug}`);
	for (const g of w.gallery ?? []) check(!!g.alt, `gallery alt text: ${w.slug}`);
	const sorted = [...fixtures.works].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
	check(sorted[0] === fixtures.works[0], 'works ordered newest first');
}
for (const s of fixtures.scraps) check(!!s.image?.alt, `scrap alt text: ${s.note}`);
check(!!fixtures.settings.email, 'settings email present');

check(ndjson.length === 21, 'ndjson doc count');
check(
	ndjson.filter((d) => d._type === 'work').every((d) => d.cover?._sanityAsset),
	'ndjson work covers reference assets'
);

if (failures.length) {
	console.error('Seed validation FAILED:\n' + failures.map((f) => `  - ${f}`).join('\n'));
	process.exit(1);
}
console.log(`Seed valid: ${fixtures.works.length} works, ${fixtures.scraps.length} scraps, ${ndjson.length} docs.`);
