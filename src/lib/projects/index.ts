import registry from './registry.json';

export type RegistryStatus = 'live' | 'demo' | 'coming-soon' | 'archived';
export type Publication = 'draft' | 'public' | 'retired';
export type Verification = 'unknown' | 'verified' | 'failed';
export type Reality = 'needs-verification';

export type ProjectRecord = {
	sourceFile: string;
	slug: string;
	title: string;
	description: string;
	/** v5 registry value. Never treat this as permission to publish. */
	registryStatus: RegistryStatus;
	publication: Publication;
	verification: Verification;
	reality: Reality;
	tags: string[];
	link: string;
	liveUrl: string;
	demoUrl: string;
	repoUrl: string;
	githubRepo: string;
	imageUrl: string;
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
	imageUrl: string;
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

function toRecord(raw: RawRecord): ProjectRecord {
	return {
		sourceFile: raw.file,
		slug: raw.slug,
		title: raw.title,
		description: raw.description,
		registryStatus: asRegistryStatus(raw.status),
		publication: publicationFor(raw.slug),
		verification: 'unknown',
		reality: 'needs-verification',
		tags: raw.tags,
		link: raw.link,
		liveUrl: raw.liveUrl,
		demoUrl: raw.demoUrl,
		repoUrl: raw.repoUrl,
		githubRepo: raw.githubRepo,
		imageUrl: raw.imageUrl
	};
}

const ALL_PROJECTS: ProjectRecord[] = (registry as RawRecord[]).map(toRecord);

/** Full private catalog, including drafts. Do not use this for a public page. */
export function getAllProjects(): ProjectRecord[] {
	return ALL_PROJECTS;
}

/** The only project collection public pages, sitemap, structured data, and future AI knowledge may use. */
export function getPublicProjects(): ProjectRecord[] {
	return ALL_PROJECTS.filter((project) => project.publication === 'public');
}

export function getPublicProjectBySlug(slug: string): ProjectRecord | undefined {
	return getPublicProjects().find((project) => project.slug === slug);
}

/** Missing and unpublished slugs are the same result. Callers must not render the record. */
export function workSlugAvailability(slug: string): 'public' | 'unavailable' {
	return getPublicProjectBySlug(slug) ? 'public' : 'unavailable';
}

export function recordedUrl(project: ProjectRecord): string {
	return project.liveUrl || project.demoUrl || project.link;
}

export function recordedRepo(project: ProjectRecord): string {
	const raw = project.repoUrl || project.githubRepo;
	if (!raw) return '';
	if (raw.startsWith('http://') || raw.startsWith('https://')) return raw.replace(/\.git$/, '');
	return `https://github.com/${raw.replace(/\.git$/, '')}`;
}
