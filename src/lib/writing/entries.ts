import { coverImageSrc } from './rich-text';
import { registrySlug } from './slug-registry';
import { normalizeTag, slugifyTitle } from './slug';
import type { WritingEntry, WritingSourceState } from './types';

export type RawWritingPage = {
	id: string;
	title: string;
	status: string | null;
	excerpt: string;
	description?: string;
	tldr?: string;
	featured?: boolean;
	cover?: string;
	tags: string[];
	slugProperty: string;
	created: string;
	edited: string;
};

export type HomeWritingCard = {
	slug: string;
	title: string;
	summary: string;
	cover: string;
};

export type HomeWritingView = {
	status: WritingSourceState;
	lead: HomeWritingCard | null;
	recent: HomeWritingCard[];
};

const PUBLISHED = 'published';

export function calendarDate(value: string | null | undefined): string {
	if (!value) return '';
	const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
	return match ? `${match[1]}-${match[2]}-${match[3]}` : '';
}

export function formatWritingDate(value: string): string {
	const date = calendarDate(value);
	return date ? `[${date}]` : '';
}

export function isPublishedStatus(status: string | null | undefined): boolean {
	return (status ?? '').trim().toLowerCase() === PUBLISHED;
}

function uniqueSlug(base: string, pageId: string, used: Set<string>): string {
	const normalized = slugifyTitle(base) || pageId.replace(/-/g, '').slice(0, 12);
	if (!used.has(normalized)) {
		used.add(normalized);
		return normalized;
	}
	const suffixed = slugifyTitle(`${normalized}-${pageId.replace(/-/g, '').slice(0, 8)}`);
	used.add(suffixed);
	return suffixed;
}

export function toWritingEntries(
	pages: RawWritingPage[],
	extraRegistry: Record<string, string> = {}
): WritingEntry[] {
	const published = pages.filter((page) => isPublishedStatus(page.status));
	const used = new Set<string>();
	const entries = published.map((page) => {
		const frozen = registrySlug(page.id, extraRegistry);
		const authored = page.slugProperty.trim();
		const canonical = uniqueSlug(frozen || authored || page.title, page.id, used);
		const titleSlug = slugifyTitle(page.title);
		const authoredSlug = authored ? slugifyTitle(authored) : '';
		const legacySlugs = [titleSlug, authoredSlug].filter(
			(slug, index, all) => Boolean(slug) && slug !== canonical && all.indexOf(slug) === index
		);
		const excerpt = page.excerpt.trim();
		const description = (page.description ?? '').trim();
		const tldr = (page.tldr ?? '').trim();
		return {
			id: page.id,
			title: page.title.trim() || 'Untitled',
			slug: canonical,
			legacySlugs,
			date: calendarDate(page.created),
			updated: calendarDate(page.edited) || calendarDate(page.created),
			revisedAt: page.edited.trim() || page.created.trim(),
			excerpt,
			summary: tldr || description || excerpt,
			featured: page.featured === true,
			cover: coverImageSrc(page.cover) ?? '',
			tags: page.tags.map((tag) => tag.trim()).filter(Boolean)
		};
	});
	return entries.sort((a, b) => {
		const byDate = b.date.localeCompare(a.date);
		if (byDate !== 0) return byDate;
		return a.title.localeCompare(b.title);
	});
}

export function findBySlug(
	posts: WritingEntry[],
	slug: string
):
	{ kind: 'exact'; post: WritingEntry } | { kind: 'redirect'; slug: string } | { kind: 'missing' } {
	const exact = posts.find((post) => post.slug === slug);
	if (exact) return { kind: 'exact', post: exact };
	const legacy = posts.find((post) => post.legacySlugs.includes(slug));
	if (legacy) return { kind: 'redirect', slug: legacy.slug };
	return { kind: 'missing' };
}

export function findByPageId(posts: WritingEntry[], pageId: string): WritingEntry | null {
	const key = pageId.replace(/-/g, '').toLowerCase();
	return posts.find((post) => post.id.replace(/-/g, '').toLowerCase() === key) ?? null;
}

export const WRITING_PAGE_SIZE = 5;

export function writingTags(posts: WritingEntry[]): string[] {
	const seen = new Map<string, string>();
	for (const post of posts) {
		for (const tag of post.tags) {
			const key = normalizeTag(tag);
			if (key && !seen.has(key)) seen.set(key, tag);
		}
	}
	return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

export function filterByTag(posts: WritingEntry[], tag: string | null): WritingEntry[] {
	const key = tag ? normalizeTag(tag) : '';
	if (!key) return posts;
	return posts.filter((post) => post.tags.some((item) => normalizeTag(item) === key));
}

export function paginateWriting(posts: WritingEntry[], page: number) {
	const total = posts.length;
	const pages = Math.max(1, Math.ceil(total / WRITING_PAGE_SIZE));
	const current = Number.isFinite(page) ? Math.min(Math.max(1, Math.trunc(page)), pages) : 1;
	const start = (current - 1) * WRITING_PAGE_SIZE;
	return {
		items: posts.slice(start, start + WRITING_PAGE_SIZE),
		page: current,
		pages,
		total
	};
}

export function latestWriting(posts: WritingEntry[], count = 3): WritingEntry[] {
	return posts.slice(0, count);
}

function byPublishDate(a: WritingEntry, b: WritingEntry): number {
	const byDate = b.date.localeCompare(a.date);
	if (byDate !== 0) return byDate;
	return a.title.localeCompare(b.title);
}

function homeCard(post: WritingEntry): HomeWritingCard {
	return {
		slug: post.slug,
		title: post.title,
		summary: post.summary,
		cover: post.cover
	};
}

/** Newest featured published note, else the newest published note. Recent posts exclude that lead. */
export function homeWriting(posts: WritingEntry[], recentCount = 3): HomeWritingView {
	const sorted = [...posts].sort(byPublishDate);
	const featured = sorted.filter((post) => post.featured);
	const lead = featured[0] ?? sorted[0] ?? null;
	const recent = lead ? sorted.filter((post) => post.id !== lead.id).slice(0, recentCount) : [];
	return {
		status: 'ok',
		lead: lead ? homeCard(lead) : null,
		recent: recent.map(homeCard)
	};
}

export function homeWritingView(
	status: WritingSourceState,
	posts: WritingEntry[]
): HomeWritingView {
	if (status !== 'ok') return { status, lead: null, recent: [] };
	return homeWriting(posts);
}
