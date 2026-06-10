/* Normalized content shapes — the only types pages and components see.
 * Raw Sanity document/asset shapes never cross this boundary: queries.ts
 * (live) and fixtures (mock) both produce these. */

/** A renderable image. `sanityRef` is present in live mode and lets
 * image.ts derive CDN-transformed srcsets; fixture images carry a local
 * /seed/… url and serve as-is. */
export type Img = {
	url: string;
	width: number;
	height: number;
	alt: string;
	caption?: string;
	/** tiny base64 preview rendered behind the real image */
	lqip?: string;
	sanityRef?: string;
	/** fixture mode only: pre-generated width variants standing in for the
	 * CDN's on-the-fly resizes, so srcset behavior matches live mode */
	variants?: { url: string; width: number }[];
};

/** One paragraph-level block of portable text, reduced to what the site
 * renders: styled text spans or an inline image. */
export type Block =
	| {
			kind: 'text';
			style: 'normal' | 'h2' | 'h3' | 'blockquote';
			spans: { text: string; em?: boolean; strong?: boolean; href?: string }[];
	  }
	| { kind: 'image'; image: Img };

export type Credit = { role: string; names: string[] };

/** The slice of a work the Deck serializes into the homepage payload —
 * card anatomy only, so galleries and article bodies never ship there. */
export type WorkCard = Pick<
	Work,
	'title' | 'slug' | 'year' | 'tags' | 'cover' | 'coverLoop'
>;

export type Work = {
	title: string;
	slug: string;
	year: number;
	publishedAt: string;
	medium: 'Text' | 'Photo' | 'Video' | 'Interactive' | 'Mixed';
	descriptors: string[];
	/** compound tag, medium first — rendered "Medium / Descriptor / …" */
	tags: string[];
	standfirst: string;
	cover: Img;
	coverLoop?: { url: string };
	hero: { kind: 'cover' } | { kind: 'embed'; embedUrl: string; poster?: Img };
	gallery: Img[];
	body: Block[];
	credits: Credit[];
	interactive: boolean;
	componentKey?: string;
};

export type OpenCall = {
	title: string;
	slug: string;
	status: 'open' | 'closed';
	deadline?: string;
	summary: string;
	brief: Block[];
	submissionUrl?: string;
	results: { title: string; slug: string }[];
};

export type Scrap = {
	image: Img;
	note?: string;
	date?: string;
};

export type Member = {
	name: string;
	role?: string;
	link?: string;
};

export type LegalPage = {
	title: string;
	slug: string;
	body: Block[];
};

export type SiteSettings = {
	siteTitle: string;
	manifesto: Block[];
	email: string;
	instagram?: string;
	cityLine?: string;
	press: { label: string; url: string }[];
};
