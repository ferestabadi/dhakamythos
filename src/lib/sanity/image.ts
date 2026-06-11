/* All image-delivery policy lives here (grammar §7.2): each role is a fixed
 * logical box; srcset candidates are the box's DPR ladder expressed as width
 * descriptors; every image ships as a webp <source> + fallback <img> pair.
 * Components ask for props and spread them — they never build CDN URLs. */
import imageUrlBuilder from '@sanity/image-url';
import { projectId, dataset } from './config';
import type { Img } from './types';

export type ImgRole = 'card' | 'hero' | 'thumb' | 'body' | 'lightbox';

/* Boxes per grammar §7.2: grid 256 q75 · card/deck 720 q80 · lightbox 2048
 * q75 · hero/full 2048 q90. `sizes` keeps layout truth so the browser's own
 * DPR arithmetic lands on the matching candidate. */
const ROLES: Record<ImgRole, { box: number; q: number; sizes: string }> = {
	thumb: { box: 256, q: 75, sizes: '(max-width: 192px) 100vw, 192px' },
	card: { box: 720, q: 80, sizes: '(min-width: 1024px) 38vw, 85vw' },
	body: { box: 720, q: 80, sizes: '(min-width: 768px) 68ch, 100vw' },
	hero: { box: 2048, q: 90, sizes: '100vw' },
	lightbox: { box: 2048, q: 75, sizes: '(max-width: 928px) 100vw, 928px' }
};

const DPR_STEPS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];
const MIN_CANDIDATE = 50; // px — below this a candidate is LQIP territory

const builder = projectId ? imageUrlBuilder({ projectId, dataset }) : null;

type ImgAttrs = {
	src: string;
	srcset?: string;
	sizes?: string;
	width: number;
	height: number;
	alt: string;
};

export type PictureAttrs = {
	/** webp <source> entries; empty when the asset has no ladder */
	sources: { type: string; srcset: string; sizes: string }[];
	/** fallback <img> attributes — safe to spread on a bare <img> */
	img: ImgAttrs;
};

/* Widths the CDN delivers fitting `img` into `box` across the DPR steps.
 * Sub-50px candidates and anything past the intrinsic width are dropped;
 * the dpr-1 width always survives (it becomes `src`). */
function ladderWidths(img: Img, box: number): { base: number; widths: number[] } {
	const base = Math.round(img.width * Math.min(box / img.width, box / img.height, 1));
	const widths = DPR_STEPS.map((dpr) => Math.round(base * dpr)).filter(
		(w) => w === base || (w >= MIN_CANDIDATE && w <= img.width)
	);
	return { base, widths: [...new Set(widths)] };
}

function livePicture(img: Img, role: ImgRole): PictureAttrs {
	const { box, q, sizes } = ROLES[role];
	const { base, widths } = ladderWidths(img, box);
	/* each DPR step is requested as its precomputed width — same output
	 * pixels as constant box + dpr params, immune to CDN dpr clamping */
	const url = (w: number, webp: boolean) => {
		const b = builder!.image(img.sanityRef!).width(w).fit('max').quality(q);
		return (webp ? b.format('webp') : b.auto('format')).url();
	};
	const srcset = (webp: boolean) => widths.map((w) => `${url(w, webp)} ${w}w`).join(', ');
	return {
		sources: [{ type: 'image/webp', srcset: srcset(true), sizes }],
		img: {
			src: url(base, false),
			srcset: srcset(false),
			sizes,
			width: img.width,
			height: img.height,
			alt: img.alt
		}
	};
}

function fixturePicture(img: Img, role: ImgRole): PictureAttrs {
	const intrinsic = { width: img.width, height: img.height, alt: img.alt };
	if (!img.variants?.length) return { sources: [], img: { src: img.url, ...intrinsic } };
	const { box, sizes } = ROLES[role];
	const { base, widths } = ladderWidths(img, box);
	/* same descriptor math as live mode, served from the nearest
	 * pre-generated width (generate-images.py emits the exact ladder) */
	const nearest = (w: number) =>
		img.variants!.reduce((a, b) => (Math.abs(b.width - w) < Math.abs(a.width - w) ? b : a));
	const picks = [...new Map(widths.map((w) => [nearest(w).url, nearest(w)])).values()];
	const srcset = picks.map((v) => `${v.url} ${v.width}w`).join(', ');
	return {
		sources: [{ type: 'image/webp', srcset, sizes }],
		img: { src: nearest(base).url, srcset, sizes, ...intrinsic }
	};
}

/** Full <picture> pairing for a role: webp <source> + fallback <img>. */
export function pictureProps(img: Img, role: ImgRole): PictureAttrs {
	return builder && img.sanityRef ? livePicture(img, role) : fixturePicture(img, role);
}

/** Fallback <img> attributes alone — for posters and other bare-<img>
 * spots. Same candidates as pictureProps; LqipImage renders the full pair. */
export function imgProps(img: Img, role: ImgRole): ImgAttrs {
	return pictureProps(img, role).img;
}

/** <link rel="preload" as="image"> attributes matching what the <picture>
 * will actually request, so an LCP preload never double-fetches. */
export function preloadProps(
	img: Img,
	role: ImgRole
): { href: string; imagesrcset?: string; imagesizes?: string; type?: string } {
	const { sources, img: fallback } = pictureProps(img, role);
	return sources.length
		? {
				href: fallback.src,
				imagesrcset: sources[0].srcset,
				imagesizes: sources[0].sizes,
				type: sources[0].type
			}
		: { href: fallback.src };
}

/** OG/sharing image at the fixed 1200×675 crop. */
export function ogImageUrl(img: Img): string {
	if (!builder || !img.sanityRef) return img.url;
	return builder.image(img.sanityRef).width(1200).height(675).fit('crop').auto('format').url();
}
