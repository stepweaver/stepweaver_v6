import { describe, expect, it } from 'vitest';
import {
	APPROVED_PUBLIC_SLUGS,
	getAllProjects,
	getPublicProjectBySlug,
	getPublicProjects,
	publicationFor,
	workSlugAvailability
} from './index.ts';
import { privateProjectSlugs, publicMetadataBlob, publicSitemapPaths } from '#lib/seo/site.ts';

describe('project publication', () => {
	it('keeps all 23 registry records and publishes none of them', () => {
		const all = getAllProjects();
		expect(all).toHaveLength(23);
		expect(APPROVED_PUBLIC_SLUGS).toEqual([]);
		expect(getPublicProjects()).toEqual([]);
		expect(all.every((project) => project.publication === 'draft')).toBe(true);
		expect(all.every((project) => project.verification === 'unknown')).toBe(true);
	});

	it('does not treat registry status live as publication', () => {
		const live = getAllProjects().filter((project) => project.registryStatus === 'live');
		expect(live.length).toBeGreaterThan(0);
		expect(live.every((project) => project.publication === 'draft')).toBe(true);
		expect(getPublicProjectBySlug('silent-auction')).toBeUndefined();
		expect(workSlugAvailability('silent-auction')).toBe('unavailable');
		expect(workSlugAvailability('not-a-real-slug')).toBe('unavailable');
	});

	it('publishes a slug only from an explicit allow-list', () => {
		expect(publicationFor('parcel-sweep', [])).toBe('draft');
		expect(publicationFor('parcel-sweep', ['parcel-sweep'])).toBe('public');
		expect(publicationFor('parcel-sweep', ['silent-auction'])).toBe('draft');
	});

	it('keeps project slugs out of the sitemap and structured data', () => {
		const blob = publicMetadataBlob();
		expect(publicSitemapPaths().some((path) => path.startsWith('/work/'))).toBe(false);
		for (const slug of privateProjectSlugs()) {
			expect(blob.includes(slug)).toBe(false);
		}
	});
});
