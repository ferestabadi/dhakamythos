/* Fixture-mode content — generated from seed/content.mjs by seed/build.mjs.
 * Same normalized shapes the live GROQ queries produce, so pages cannot
 * tell the difference. Edit seed/content.mjs, not the JSON. */
import data from './fixtures-data.json';
import type { LegalPage, Member, OpenCall, Scrap, SiteSettings, Work } from './types';

export const works = data.works as Work[];
export const openCalls = data.openCalls as OpenCall[];
export const scraps = data.scraps as Scrap[];
export const members = data.members as Member[];
export const legalPages = data.legalPages as LegalPage[];
export const settings = data.settings as SiteSettings;
