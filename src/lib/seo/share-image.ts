import { absoluteSiteUrl } from './origin';

/**
 * Measured from static/images/lambda-share.jpg.
 * The unit test reads the file and fails if these values drift.
 * Source artwork is the v5 homepage card (1536×1024), reframed to 1200×630.
 */
export const SHARE_CARD = {
	path: '/images/lambda-share.jpg',
	width: 1200,
	height: 630,
	type: 'image/jpeg'
} as const;

const VERIFIED_SHARE_ASSETS: Record<string, typeof SHARE_CARD> = {
	[SHARE_CARD.path]: SHARE_CARD
};

export type ShareImage = {
	url: string;
	width: number;
	height: number;
	type: string;
	alt: string;
};

/** Local path of a share asset whose dimensions were measured. Remote URLs are never accepted. */
export function verifiedSharePath(cover: string | null | undefined): string | null {
	const candidate = cover?.trim() ?? '';
	if (!Object.prototype.hasOwnProperty.call(VERIFIED_SHARE_ASSETS, candidate)) return null;
	return candidate;
}

/**
 * Social cards use a measured static image.
 * Notion file URLs are signed and expire. Other remote URLs are not fetched, proxied, or given dimensions.
 * A local file that is not a registered share asset (for example the portrait mark) is not a large-card image.
 */
export function shareImageFor(cover: string | null | undefined, alt: string): ShareImage {
	const path = verifiedSharePath(cover) ?? SHARE_CARD.path;
	const asset = VERIFIED_SHARE_ASSETS[path] ?? SHARE_CARD;
	return {
		url: absoluteSiteUrl(asset.path),
		width: asset.width,
		height: asset.height,
		type: asset.type,
		alt
	};
}
