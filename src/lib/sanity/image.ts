/* All image-delivery policy from docs/PERFORMANCE.md lives here: srcset
 * widths per role, AVIF/WebP via auto(format), quality 75, DPR capped by
 * the width ladders themselves. Components ask for props and spread them
 * onto an <img>; they never build CDN URLs. */
import imageUrlBuilder from '@sanity/image-url';
import { projectId, dataset } from './config';
import type { Img } from './types';

const ROLES: Record<string, { widths: readonly number[]; sizes: string }> = {
	card: { widths: [480, 768, 1080], sizes: '(min-width: 1024px) 38vw, 85vw' },
	hero: { widths: [768, 1080, 1440, 1920], sizes: '100vw' },
	thumb: { widths: [256, 512], sizes: '(min-width: 1024px) 18vw, 45vw' },
	body: { widths: [480, 768, 1080], sizes: '(min-width: 768px) 68ch, 100vw' }
};

export type ImgRole = 'card' | 'hero' | 'thumb' | 'body';

const builder = projectId ? imageUrlBuilder({ projectId, dataset }) : null;

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
	const { widths, sizes } = ROLES[role];

	if (!builder || !img.sanityRef) {
		// fixture image — pre-generated local variants stand in for the CDN
		if (!img.variants?.length) return { src: img.url, ...base };
		const usable = img.variants.filter((v) => widths.includes(v.width));
		const list = usable.length ? usable : img.variants;
		const mid = list[Math.min(1, list.length - 1)];
		return {
			src: mid.url,
			srcset: list.map((v) => `${v.url} ${v.width}w`).join(', '),
			sizes,
			...base
		};
	}

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
