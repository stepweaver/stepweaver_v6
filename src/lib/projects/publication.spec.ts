import { describe, expect, it } from 'vitest';
import { getAllProjects } from './registry';
import {
	APPROVED_PUBLIC_SLUGS,
	getCatalogRecords,
	getPublicCaseStudies,
	getPublicWorkCards,
	getPublicWorkPage,
	publicationFor
} from './publication';
import { privateProjectSlugs, publicMetadataBlob, publicSitemapPaths } from '$lib/seo/site';

describe('project publication', () => {
	it('keeps all 23 registry records and publishes none of them', () => {
		const all = getCatalogRecords();
		expect(all).toHaveLength(23);
		expect(APPROVED_PUBLIC_SLUGS).toEqual([]);
		expect(getPublicWorkCards()).toEqual([]);
		expect(getPublicCaseStudies()).toEqual([]);
		expect(all.every((project) => project.publication === 'draft')).toBe(true);
		expect(all.every((project) => project.verification === 'unknown')).toBe(true);
	});

	it('does not treat registry status live as publication', () => {
		const live = getCatalogRecords().filter((project) => project.registryStatus === 'live');
		expect(live.length).toBeGreaterThan(0);
		expect(live.every((project) => project.publication === 'draft')).toBe(true);
		expect(getPublicWorkPage('silent-auction')).toBeNull();
		expect(getPublicWorkPage('stepweaver-dev')).toBeNull();
		expect(getPublicWorkPage('not-a-real-slug')).toBeNull();
	});

	it('keeps the implemented case study unpublished until the allow-list says otherwise', () => {
		expect(getAllProjects().map((project) => project.slug)).toContain('stepweaver-dev');
		expect(getPublicCaseStudies()).toEqual([]);
	});

	it('publishes a slug only from an explicit allow-list', () => {
		expect(publicationFor('parcel-sweep', [])).toBe('draft');
		expect(publicationFor('parcel-sweep', ['parcel-sweep'])).toBe('public');
		expect(publicationFor('parcel-sweep', ['silent-auction'])).toBe('draft');
	});

	it('keeps project slugs out of the sitemap and structured data', () => {
		const blob = publicMetadataBlob();
		expect(publicSitemapPaths().some((path) => path.startsWith('/work/'))).toBe(false);
		expect(blob.includes('github.com/stepweaver')).toBe(true);
		expect(blob.includes('github.com/stephen')).toBe(false);
		for (const slug of privateProjectSlugs()) {
			expect(blob.includes(slug)).toBe(false);
		}
	});
});
