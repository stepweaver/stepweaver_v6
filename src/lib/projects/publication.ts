import registry from './registry.json';
import { getAllProjects, getProjectBySlug } from './registry';
import type { Project, ProjectStatus } from './types';

export type RegistryStatus = ProjectStatus;
export type Publication = 'draft' | 'public' | 'retired';
export type Verification = 'unknown' | 'verified' | 'failed';

export type CatalogRecord = {
	sourceFile: string;
	slug: string;
	title: string;
	description: string;
	/** Stored registry value. Never treat this as permission to publish. */
	registryStatus: RegistryStatus;
	publication: Publication;
	verification: Verification;
	tags: readonly string[];
	link: string;
	liveUrl: string;
	demoUrl: string;
	repoUrl: string;
	githubRepo: string;
};

type RawRecord = {
	file: string;
	slug: string;
	title: string;
	status: string;
	description: string;
	link: string;
	liveUrl: string;
	demoUrl: string;
	repoUrl: string;
	githubRepo: string;
	tags: string[];
};

const REGISTRY_STATUSES = new Set<RegistryStatus>(['live', 'demo', 'coming-soon', 'archived']);

/**
 * Explicit publication allow-list. Empty until a row in docs/PROJECT_REVIEW.md
 * is reviewed and the owner approves it. Registry status is not consulted.
 */
export const APPROVED_PUBLIC_SLUGS: readonly string[] = [];

export function publicationFor(
	slug: string,
	approved: readonly string[] = APPROVED_PUBLIC_SLUGS
): Publication {
	return approved.includes(slug) ? 'public' : 'draft';
}

function asRegistryStatus(value: string): RegistryStatus {
	if (REGISTRY_STATUSES.has(value as RegistryStatus)) return value as RegistryStatus;
	return 'archived';
}

function toRecord(raw: RawRecord): CatalogRecord {
	return {
		sourceFile: raw.file,
		slug: raw.slug,
		title: raw.title,
		description: raw.description,
		registryStatus: asRegistryStatus(raw.status),
		publication: publicationFor(raw.slug),
		verification: 'unknown',
		tags: raw.tags,
		link: raw.link,
		liveUrl: raw.liveUrl,
		demoUrl: raw.demoUrl,
		repoUrl: raw.repoUrl,
		githubRepo: raw.githubRepo
	};
}

const CATALOG: CatalogRecord[] = (registry as RawRecord[]).map(toRecord);

/** Full private catalog, including drafts. Do not pass this to a public page. */
export function getCatalogRecords(): readonly CatalogRecord[] {
	return CATALOG;
}

export function isPublicSlug(slug: string): boolean {
	return publicationFor(slug) === 'public';
}

/** Case-study bodies that are both implemented and explicitly approved. */
export function getPublicCaseStudies(): readonly Project[] {
	return getAllProjects().filter((project) => isPublicSlug(project.slug));
}

export function getPublicCatalogRecords(): readonly CatalogRecord[] {
	return CATALOG.filter((record) => record.publication === 'public');
}

export type PublicWorkCard = {
	slug: string;
	title: string;
	description: string;
	status: RegistryStatus;
	tags: readonly string[];
};

/** The only project collection public pages may render. */
export function getPublicWorkCards(): readonly PublicWorkCard[] {
	const cards = new Map<string, PublicWorkCard>();
	for (const record of getPublicCatalogRecords()) {
		cards.set(record.slug, {
			slug: record.slug,
			title: record.title,
			description: record.description,
			status: record.registryStatus,
			tags: record.tags
		});
	}
	for (const project of getPublicCaseStudies()) {
		cards.set(project.slug, {
			slug: project.slug,
			title: project.title,
			description: project.description,
			status: project.status,
			tags: project.tags
		});
	}
	return [...cards.values()];
}

export type PublicWorkPage =
	| { kind: 'case-study'; project: Project }
	| { kind: 'record'; card: PublicWorkCard; url: string; repo: string };

/** Missing and unpublished slugs are the same result: null. Callers must not render a record. */
export function getPublicWorkPage(slug: string): PublicWorkPage | null {
	if (!isPublicSlug(slug)) return null;
	const project = getProjectBySlug(slug);
	if (project) return { kind: 'case-study', project };
	const record = CATALOG.find((item) => item.slug === slug);
	if (!record || record.publication !== 'public') return null;
	return {
		kind: 'record',
		card: {
			slug: record.slug,
			title: record.title,
			description: record.description,
			status: record.registryStatus,
			tags: record.tags
		},
		url: record.liveUrl || record.demoUrl || record.link,
		repo: recordedRepo(record)
	};
}

export function recordedRepo(record: CatalogRecord): string {
	const raw = record.repoUrl || record.githubRepo;
	if (!raw) return '';
	if (raw.startsWith('http://') || raw.startsWith('https://')) return raw.replace(/\.git$/, '');
	return `https://github.com/${raw.replace(/\.git$/, '')}`;
}

export function privateProjectSlugs(): string[] {
	const slugs = new Set<string>(CATALOG.map((record) => record.slug));
	for (const project of getAllProjects()) slugs.add(project.slug);
	return [...slugs];
}
