import { describe, expect, it } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getAllProjects } from './registry';
import {
	APPROVED_PUBLIC_SLUGS,
	getCatalogRecords,
	getPublicCaseStudies,
	getPublicWorkCards,
	getPublicWorkPage,
	publicationFor
} from './publication';
import { privateProjectSlugs, publicMetadataBlob, publicSitemapPaths } from '$lib/seo/site.server';

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
		expect(publicSitemapPaths()).toContain('/dice-roller');
		expect(publicSitemapPaths()).toContain('/terminal');
		expect(publicSitemapPaths()).not.toContain('/lab');
		expect(publicSitemapPaths()).not.toContain('/play');
		expect(blob.includes('github.com/stepweaver')).toBe(true);
		expect(blob.includes('github.com/stephen')).toBe(false);
		for (const slug of privateProjectSlugs()) {
			expect(blob.includes(slug)).toBe(false);
		}
	});
});

describe('project publication boundary', () => {
	it('keeps private project modules out of client-imported source', async () => {
		const root = join(process.cwd(), 'src');
		const violations: string[] = [];
		async function walk(directory: string) {
			for (const entry of await readdir(directory, { withFileTypes: true })) {
				const path = join(directory, entry.name);
				if (entry.isDirectory()) {
					await walk(path);
					continue;
				}
				const relative = path.slice(root.length + 1).replaceAll('\\', '/');
				if (!isClientSource(relative) || isRegistryImplementation(relative)) continue;
				const source = await readFile(path, 'utf8');
				for (const specifier of valueSpecifiers(source)) {
					if (isPrivateProjectModule(specifier)) violations.push(`${relative} -> ${specifier}`);
				}
			}
		}
		await walk(root);
		expect(violations).toEqual([]);
	});
});

function isClientSource(path: string): boolean {
	if (!/\.(svelte|ts|js)$/.test(path)) return false;
	if (path.endsWith('.spec.ts') || path.endsWith('.server.ts') || path.endsWith('+server.ts'))
		return false;
	if (path.includes('lib/server/')) return false;
	return true;
}

function isRegistryImplementation(path: string): boolean {
	return (
		path === 'lib/projects/publication.ts' ||
		path === 'lib/projects/registry.ts' ||
		path.startsWith('lib/projects/data/')
	);
}

function isPrivateProjectModule(specifier: string): boolean {
	const spec = specifier.replaceAll('\\', '/');
	return (
		/(^|\/)publication(\.server)?$/.test(spec) ||
		/(^|\/)registry(\.server)?$/.test(spec) ||
		spec.endsWith('/registry.json') ||
		spec.includes('/projects/data/') ||
		spec.includes('stepweaver-dev') ||
		spec.includes('unpublished-references')
	);
}

function valueSpecifiers(source: string): string[] {
	const found: string[] = [];
	const from = /(?:^|\n)\s*(?:import|export)\s+(type\s+)?[\s\S]*?\sfrom\s+['"]([^'"]+)['"]/g;
	for (const match of source.matchAll(from)) {
		if (match[1]) continue;
		if (match[2]) found.push(match[2]);
	}
	const side = /(?:^|\n)\s*import\s+['"]([^'"]+)['"]/g;
	for (const match of source.matchAll(side)) {
		if (match[1]) found.push(match[1]);
	}
	return found;
}
