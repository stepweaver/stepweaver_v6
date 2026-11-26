import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { workPageCopy } from '$lib/projects/work-copy';
import { fixtureEntries } from '$lib/writing/fixtures';

import {
	ARTICLE_DESCRIPTION_FALLBACK,
	FIELD_JOURNAL_DESCRIPTION,
	FIELD_JOURNAL_TITLE,
	HOME_DESCRIPTION,
	HOME_TITLE,
	articleDescription,
	isoDate,
	resolvePageMetadata
} from './metadata';
import { SHARE_CARD, verifiedSharePath } from './share-image';

const shareUrl = `https://www.stepweaver.dev${SHARE_CARD.path}`;

function jpegSize(bytes: Uint8Array): { width: number; height: number } {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	expect(view.getUint8(0)).toBe(0xff);
	expect(view.getUint8(1)).toBe(0xd8);
	let offset = 2;
	while (offset + 8 < bytes.byteLength) {
		expect(view.getUint8(offset)).toBe(0xff);
		const marker = view.getUint8(offset + 1);
		const length = view.getUint16(offset + 2);
		if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
			return {
				height: view.getUint16(offset + 5),
				width: view.getUint16(offset + 7)
			};
		}
		offset += 2 + length;
	}
	throw new Error('JPEG frame missing');
}

const draftPost = {
	id: 'draft',
	title: 'Unpublished operations note',
	slug: 'unpublished-operations-note',
	legacySlugs: [],
	date: '2026-10-01',
	updated: '2026-10-01',
	revisedAt: '2026-10-01T12:00:00.000Z',
	excerpt: 'This draft must not appear on the site.',
	summary: 'This draft must not appear on the site.',
	featured: false,
	cover: '',
	tags: ['systems']
};

describe('share card file', () => {
	it('matches the measured 1200 by 630 JPEG', () => {
		const path = join(
			dirname(fileURLToPath(import.meta.url)),
			'../../../static/images/lambda-share.jpg'
		);
		const bytes = readFileSync(path);
		expect(bytes.byteLength).toBeLessThan(400_000);
		expect(jpegSize(bytes)).toEqual({ width: SHARE_CARD.width, height: SHARE_CARD.height });
		expect(SHARE_CARD.type).toBe('image/jpeg');
	});
});

describe('share image selection', () => {
	it('keeps only a measured local share asset', () => {
		expect(verifiedSharePath('/images/lambda-share.jpg')).toBe('/images/lambda-share.jpg');
		expect(verifiedSharePath('/images/lambda_stepweaver.png')).toBeNull();
		expect(verifiedSharePath('/images/../secret.jpg')).toBeNull();
		expect(verifiedSharePath('https://cdn.example.com/a.png')).toBeNull();
		expect(
			verifiedSharePath(
				'https://prod-files-secure.s3.us-west-2.amazonaws.com/x?X-Amz-Signature=abc&X-Amz-Expires=3600'
			)
		).toBeNull();
	});
});

describe('article descriptions and dates', () => {
	it('prefers an authored excerpt, then a summary, then a branded fallback', () => {
		expect(articleDescription({ excerpt: 'Authored.', summary: 'Shorter.' })).toBe('Authored.');
		expect(articleDescription({ excerpt: '  ', summary: 'A boundary you can name.' })).toBe(
			'A boundary you can name.'
		);
		expect(articleDescription({ excerpt: '', summary: '' })).toBe(ARTICLE_DESCRIPTION_FALLBACK);
		expect(isoDate('2026-09-01')).toBe('2026-09-01');
		expect(isoDate('2026-02-31')).toBeNull();
		expect(isoDate('2026-09-01T12:00:00.000Z')).toBeNull();
		expect(isoDate('')).toBeNull();
	});
});

describe('page metadata', () => {
	it('describes the homepage with the canonical identity and the measured card', () => {
		const meta = resolvePageMetadata({ pathname: '/', status: 200, data: {} });
		expect(meta.title).toBe(HOME_TITLE);
		expect(meta.description).toBe(HOME_DESCRIPTION);
		expect(meta.canonical).toBe('https://www.stepweaver.dev/');
		expect(meta.ogTitle).toBe(HOME_TITLE);
		expect(meta.ogType).toBe('website');
		expect(meta.siteName).toBe('λstepweaver');
		expect(meta.locale).toBe('en_US');
		expect(meta.image).toEqual({
			url: shareUrl,
			width: 1200,
			height: 630,
			type: 'image/jpeg',
			alt: SHARE_CARD.alt
		});
		expect(meta.twitterCard).toBe('summary_large_image');
		expect(meta.robots).toBeNull();
		expect(meta.publishedTime).toBeNull();
	});

	it('uses the article title, excerpt, dates, and tags, and ignores an expiring cover', () => {
		const meta = resolvePageMetadata({
			pathname: '/writing/notes',
			status: 200,
			data: {
				post: {
					id: '1',
					title: 'λ & "quotes"',
					slug: 'notes',
					legacySlugs: [],
					date: '2024-06-01',
					updated: '2024-06-04',
					revisedAt: '2024-06-04T12:00:00.000Z',
					excerpt: 'Systems & <handoffs> — "notes".',
					summary: 'Do not prefer this.',
					featured: false,
					cover:
						'https://prod-files-secure.s3.us-west-2.amazonaws.com/x?X-Amz-Signature=abc&X-Amz-Expires=3600',
					tags: ['systems', '']
				}
			}
		});
		expect(meta.title).toBe('λ & "quotes" | λstepweaver');
		expect(meta.ogTitle).toBe('λ & "quotes"');
		expect(meta.description).toBe('Systems & <handoffs> — "notes".');
		expect(meta.canonical).toBe('https://www.stepweaver.dev/writing/notes');
		expect(meta.ogType).toBe('article');
		expect(meta.publishedTime).toBe('2024-06-01');
		expect(meta.modifiedTime).toBe('2024-06-04');
		expect(meta.tags).toEqual(['systems']);
		expect(meta.image).toEqual({
			url: shareUrl,
			width: 1200,
			height: 630,
			type: 'image/jpeg',
			alt: SHARE_CARD.alt
		});
		expect(meta.image.alt).not.toContain('quotes');
		const article = meta.jsonLd.find(
			(block) =>
				typeof block === 'object' &&
				block !== null &&
				(block as { '@type'?: string })['@type'] === 'BlogPosting'
		) as { datePublished?: string; image?: { width?: number } };
		expect(article.datePublished).toBe('2024-06-01');
		expect(article.image?.width).toBe(1200);
	});

	it('falls back when an article has no authored summary and an impossible date', () => {
		const meta = resolvePageMetadata({
			pathname: '/writing/bare',
			status: 200,
			data: {
				post: {
					id: '2',
					title: 'Bare note',
					slug: 'bare',
					legacySlugs: [],
					date: '2026-02-31',
					updated: 'not-a-date',
					revisedAt: 'not-a-date',
					excerpt: '',
					summary: '',
					featured: false,
					cover: '/images/lambda_stepweaver.png',
					tags: []
				}
			}
		});
		expect(meta.description).toBe(ARTICLE_DESCRIPTION_FALLBACK);
		expect(meta.description).not.toBe('Bare note');
		expect(meta.publishedTime).toBeNull();
		expect(meta.modifiedTime).toBeNull();
		expect(meta.image.url).toBe(shareUrl);
		expect(meta.tags).toEqual([]);
	});

	it('keeps archive, service, and work-index metadata specific', () => {
		const archive = resolvePageMetadata({
			pathname: '/writing',
			status: 200,
			data: { status: 'ok', tag: 'systems', page: 2 }
		});
		expect(archive.canonical).toBe('https://www.stepweaver.dev/writing?tag=systems&page=2');
		expect(archive.robots).toBeNull();
		expect(archive.title).toBe('Writing | λstepweaver');

		const unavailable = resolvePageMetadata({
			pathname: '/writing',
			status: 200,
			data: { status: 'unavailable', tag: null, page: 1 }
		});
		expect(unavailable.robots).toBe('noindex');

		const services = resolvePageMetadata({ pathname: '/services', status: 200, data: {} });
		expect(services.title).toBe('Services | λstepweaver');
		expect(services.canonical).toBe('https://www.stepweaver.dev/services');
		expect(services.image.url).toBe(shareUrl);

		const work = resolvePageMetadata({ pathname: '/work', status: 200, data: { projects: [] } });
		expect(work.robots).toBe('noindex');
		expect(work.description).toBe(workPageCopy(0).description);
	});

	it('describes the field journal and hides it from indexing when mileage is not public', () => {
		const ready = resolvePageMetadata({
			pathname: '/field-journal',
			status: 200,
			data: { journal: { status: 'ok' } }
		});
		expect(ready.title).toBe(`${FIELD_JOURNAL_TITLE} | λstepweaver`);
		expect(ready.description).toBe(FIELD_JOURNAL_DESCRIPTION);
		expect(ready.canonical).toBe('https://www.stepweaver.dev/field-journal');
		expect(ready.ogTitle).toBe(ready.title);
		expect(ready.ogType).toBe('website');
		expect(ready.twitterCard).toBe('summary_large_image');
		expect(ready.image.url).toBe(shareUrl);
		expect(ready.robots).toBeNull();

		const down = resolvePageMetadata({
			pathname: '/field-journal',
			status: 200,
			data: { journal: { status: 'unavailable' } }
		});
		expect(down.robots).toBe('noindex');
		expect(down.description).toBe(FIELD_JOURNAL_DESCRIPTION);
	});

	it('describes an approved case study without trusting a remote image', () => {
		const meta = resolvePageMetadata({
			pathname: '/work/parcel-sweep',
			status: 200,
			data: {
				kind: 'case-study',
				project: {
					slug: 'parcel-sweep',
					title: 'Parcel Sweep',
					description: 'A reviewed public case study.',
					imageUrl: 'https://example.com/shot.png'
				}
			}
		});
		expect(meta.title).toBe('Parcel Sweep | λstepweaver');
		expect(meta.description).toBe('A reviewed public case study.');
		expect(meta.image.url).toBe(shareUrl);
		expect(meta.image.alt).toBe(SHARE_CARD.alt);
		expect(meta.image.alt).not.toContain('Parcel Sweep');
		expect(meta.ogType).toBe('website');
	});

	it('does not let a loaded project or draft replace another page', () => {
		const about = resolvePageMetadata({
			pathname: '/about',
			status: 200,
			data: {
				kind: 'case-study',
				project: {
					slug: 'parcel-sweep',
					title: 'Parcel Sweep',
					description: 'Hidden from this page.'
				}
			}
		});
		expect(about.title).toBe('About | λstepweaver');
		expect(about.description).not.toContain('Hidden');

		const missing = resolvePageMetadata({
			pathname: '/writing/unpublished-operations-note',
			status: 404,
			message: 'This note is not published.',
			data: { post: draftPost }
		});
		expect(missing.robots).toBe('noindex');
		expect(missing.title).toBe('This note is not published. | λstepweaver');
		expect(missing.description).not.toContain('draft');
		expect(missing.description).not.toContain('Unpublished');
		expect(missing.ogType).toBe('website');
		expect(missing.jsonLd).toEqual([]);
		expect(missing.tags).toEqual([]);
	});

	it('locks the escaping fixture to the public quotes slug', () => {
		const post = fixtureEntries().find((entry) => entry.slug === 'quotes');
		expect(post?.title).toBe('λ & "quotes"');
		expect(post?.excerpt).toContain('<handoffs>');
		expect(post?.date).toBe('2024-06-01');
		expect(post?.updated).toBe('2024-06-04');
	});
});
