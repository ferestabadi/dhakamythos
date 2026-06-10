/* All image-delivery policy from docs/PERFORMANCE.md lives here: srcset
 * widths per role, AVIF/WebP via auto(format), quality 75, DPR capped by
 * the width ladders themselves. Components ask for props and spread them
 * onto an <img>; they never build CDN URLs. */
import imageUrlBuilder from '@sanity/image-url';
import { client } from './client';
import type { Img } from './types';

const ROLES = {
	card: { widths: [480, 768, 1080], sizes: '(min-width: 1024px) 38vw, 85vw' },
	hero: { widths: [768, 1080, 1440, 1920], sizes: '100vw' },
	thumb: { widths: [256, 512], sizes: '(min-width: 1024px) 18vw, 45vw' },
	body: { widths: [480, 768, 1080], sizes: '(min-width: 768px) 68ch, 100vw' }
} as const;

export type ImgRole = keyof typeof ROLES;

const builder = client ? imageUrlBuilder(client) : null;

type ImgAttrs = {
	src: string;
	srcset?: string;
	sizes?: string;
	width: number;
	height: number;
	alt: string;
};

export function imgProps(img: Img, role: ImgRole): ImgAttrs {
	const base = { width: img.width, height: img.height, alt: img.alt };
	if (!builder || !img.sanityRef) {
		// fixture image — a local static file, served as-is
		return { src: img.url, ...base };
	}
	const { widths, sizes } = ROLES[role];
	const url = (w: number) =>
		builder.image(img.sanityRef!).width(w).auto('format').quality(75).url();
	return {
		src: url(widths[Math.min(1, widths.length - 1)]),
		srcset: widths.map((w) => `${url(w)} ${w}w`).join(', '),
		sizes,
		...base
	};
}

/** OG/sharing image at the fixed 1200×675 crop. */
export function ogImageUrl(img: Img): string {
	if (!builder || !img.sanityRef) return img.url;
	return builder.image(img.sanityRef).width(1200).height(675).fit('crop').auto('format').url();
}
