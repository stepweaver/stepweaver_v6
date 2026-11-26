import { identity } from '$lib/data/identity';
import { workPageCopy } from '$lib/projects/work-copy';
import type { WritingEntry } from '$lib/writing/types';

import { absoluteSiteUrl } from './origin';
import { SHARE_CARD, shareImageFor, type ShareImage } from './share-image';

export const SITE_NAME = 'λstepweaver';
export const SITE_LOCALE = 'en_US';
export const DEFAULT_IMAGE_ALT = SHARE_CARD.alt;
export const ARTICLE_DESCRIPTION_FALLBACK = 'A published note by Stephen Weaver on λstepweaver.';

export const HOME_TITLE = `${identity.name} | ${identity.title}`;
export const HOME_DESCRIPTION = `${identity.name}. ${identity.positioning.short} ${identity.positioning.lede}`;

const PAGE_TITLE_SUFFIX = ` | ${SITE_NAME}`;

type StaticPage = {
	title: string;
	description: string;
};

const STATIC_PAGES: Record<string, StaticPage> = {
	'/about': {
		title: 'About',
		description:
			'Stephen Weaver is a Business Systems Developer and Systems Integration Consultant. The work is the system: analysis, integration, automation, custom software, and applied AI.'
	},
	'/resume': {
		title: 'Resume',
		description:
			'Stephen Weaver, Business Systems Developer and Systems Integration Consultant. Professional background in analysis, integration, automation, and business-facing software.'
	},
	'/services': {
		title: 'Services',
		description:
			'Business analysis, systems integration, automation, custom software, and applied AI for real operations.'
	},
	'/contact': {
		title: 'Contact',
		description: 'Consulting inquiries, hiring conversations, and general notes for Stephen Weaver.'
	},
	'/terminal': {
		title: 'Terminal',
		description:
			'A command console for this site: résumé, published writing, page navigation, and dice.'
	},
	'/dice-roller': {
		title: 'Dice roller',
		description:
			'Roll RPG dice with the same notation, advantage, and saved history as the terminal.'
	},
	'/privacy': {
		title: 'Privacy',
		description:
			'This site does not run analytics. Theme preference stays in local storage, chat messages are not stored on the server, and personal data is not sold.'
	}
};

const WRITING_DESCRIPTION =
	'Notes on systems, integration, automation, and the decisions around the work.';

export const FIELD_JOURNAL_TITLE = 'Field Journal — The Long Walk';
export const FIELD_JOURNAL_DESCRIPTION =
	'A personal record of miles walked: distance over time, endurance, and the days that were written down.';

export type PageMetadata = {
	title: string;
	description: string;
	canonical: string;
	robots: string | null;
	ogTitle: string;
	ogDescription: string;
	ogType: 'website' | 'article';
	ogUrl: string;
	siteName: string;
	locale: string;
	image: ShareImage;
	twitterCard: 'summary_large_image';
	publishedTime: string | null;
	modifiedTime: string | null;
	tags: string[];
	jsonLd: unknown[];
};

export type MetadataRequest = {
	pathname: string;
	status: number;
	message?: string;
	data: unknown;
};

/** A real calendar date, or null. Partial timestamps and impossible days are omitted. */
export function isoDate(value: string | null | undefined): string | null {
	if (!value) return null;
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
	if (!match) return null;
	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const date = new Date(Date.UTC(year, month - 1, day));
	if (
		date.getUTCFullYear() !== year ||
		date.getUTCMonth() !== month - 1 ||
		date.getUTCDate() !== day
	) {
		return null;
	}
	return `${match[1]}-${match[2]}-${match[3]}`;
}

export function articleDescription(post: { excerpt?: string; summary?: string }): string {
	const excerpt = post.excerpt?.trim() ?? '';
	if (excerpt) return excerpt;
	const summary = post.summary?.trim() ?? '';
	if (summary) return summary;
	return ARTICLE_DESCRIPTION_FALLBACK;
}

function asRecord(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== 'object') return null;
	return value as Record<string, unknown>;
}

function isWritingPost(value: unknown): value is WritingEntry {
	const record = asRecord(value);
	if (!record) return false;
	return (
		typeof record.title === 'string' &&
		typeof record.slug === 'string' &&
		typeof record.excerpt === 'string' &&
		typeof record.summary === 'string' &&
		typeof record.date === 'string' &&
		typeof record.updated === 'string' &&
		typeof record.revisedAt === 'string' &&
		typeof record.cover === 'string' &&
		Array.isArray(record.tags) &&
		record.tags.every((tag) => typeof tag === 'string')
	);
}

function isPublicCard(value: unknown): value is {
	slug: string;
	title: string;
	description: string;
	imageUrl?: string;
} {
	const record = asRecord(value);
	if (!record) return false;
	return (
		typeof record.slug === 'string' &&
		typeof record.title === 'string' &&
		typeof record.description === 'string' &&
		(record.imageUrl === undefined || typeof record.imageUrl === 'string')
	);
}

function normalizePath(pathname: string): string {
	if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1);
	return pathname || '/';
}

function documentTitle(title: string): string {
	if (title === HOME_TITLE || title === SITE_NAME || title.endsWith(PAGE_TITLE_SUFFIX))
		return title;
	return `${title}${PAGE_TITLE_SUFFIX}`;
}

function pageMetadata(input: {
	title: string;
	description: string;
	canonical: string;
	robots?: string | null;
	ogTitle?: string;
	ogType?: 'website' | 'article';
	image: ShareImage;
	publishedTime?: string | null;
	modifiedTime?: string | null;
	tags?: string[];
	jsonLd?: unknown[];
}): PageMetadata {
	const title = documentTitle(input.title);
	const ogTitle = input.ogTitle ?? title;
	return {
		title,
		description: input.description,
		canonical: input.canonical,
		robots: input.robots ?? null,
		ogTitle,
		ogDescription: input.description,
		ogType: input.ogType ?? 'website',
		ogUrl: input.canonical,
		siteName: SITE_NAME,
		locale: SITE_LOCALE,
		image: input.image,
		twitterCard: 'summary_large_image',
		publishedTime: input.publishedTime ?? null,
		modifiedTime: input.modifiedTime ?? null,
		tags: input.tags ?? [],
		jsonLd: input.jsonLd ?? []
	};
}

function structuredBlocks(data: Record<string, unknown> | null): unknown[] {
	const structured = asRecord(data?.structuredData);
	if (!structured) return [];
	return [structured.website, structured.person].filter((block) => block != null);
}

function writingCanonical(data: Record<string, unknown>): string {
	const tag = typeof data.tag === 'string' && data.tag.trim() ? data.tag.trim() : '';
	const page =
		typeof data.page === 'number' && Number.isFinite(data.page) ? Math.trunc(data.page) : 1;
	const params = new URLSearchParams();
	if (tag) params.set('tag', tag);
	if (page > 1) params.set('page', String(page));
	const query = params.toString();
	const path = absoluteSiteUrl('/writing');
	return query ? `${path}?${query}` : path;
}

function articleMetadata(post: WritingEntry, data: Record<string, unknown>): PageMetadata {
	const description = articleDescription(post);
	const canonical = absoluteSiteUrl(`/writing/${post.slug}`);
	const publishedTime = isoDate(post.date);
	const modifiedTime = isoDate(post.updated);
	const tags = post.tags.map((tag) => tag.trim()).filter(Boolean);
	const image = shareImageFor(post.cover);
	const article: Record<string, unknown> = {
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: post.title,
		description,
		url: canonical,
		image: {
			'@type': 'ImageObject',
			url: image.url,
			width: image.width,
			height: image.height
		},
		author: { '@type': 'Person', name: identity.name },
		mainEntityOfPage: canonical
	};
	if (publishedTime) article.datePublished = publishedTime;
	if (modifiedTime) article.dateModified = modifiedTime;
	if (tags.length > 0) article.keywords = tags.join(', ');
	return pageMetadata({
		title: post.title,
		ogTitle: post.title,
		description,
		canonical,
		ogType: 'article',
		image,
		publishedTime,
		modifiedTime,
		tags,
		jsonLd: [...structuredBlocks(data), article]
	});
}

export function resolvePageMetadata(request: MetadataRequest): PageMetadata {
	const pathname = normalizePath(request.pathname);
	const data = asRecord(request.data);
	const image = shareImageFor(null);

	if (request.status >= 400) {
		const message = request.message?.trim() || 'This page is not available.';
		return pageMetadata({
			title: message,
			description: message,
			canonical: absoluteSiteUrl(pathname),
			robots: 'noindex',
			image
		});
	}

	const post = data && isWritingPost(data.post) ? data.post : null;
	if (post && pathname === `/writing/${post.slug}`) {
		return articleMetadata(post, data ?? {});
	}

	if (data?.kind === 'case-study' && isPublicCard(data.project)) {
		if (pathname === `/work/${data.project.slug}`) {
			const projectImage = shareImageFor(data.project.imageUrl);
			return pageMetadata({
				title: data.project.title,
				description: data.project.description,
				canonical: absoluteSiteUrl(pathname),
				image: projectImage,
				jsonLd: structuredBlocks(data)
			});
		}
	}

	if (data?.kind === 'record' && isPublicCard(data.card)) {
		if (pathname === `/work/${data.card.slug}`) {
			return pageMetadata({
				title: data.card.title,
				description: data.card.description,
				canonical: absoluteSiteUrl(pathname),
				image: shareImageFor(null),
				jsonLd: structuredBlocks(data)
			});
		}
	}

	if (pathname === '/') {
		return pageMetadata({
			title: HOME_TITLE,
			description: HOME_DESCRIPTION,
			canonical: absoluteSiteUrl('/'),
			image,
			jsonLd: structuredBlocks(data)
		});
	}

	if (pathname === '/writing') {
		return pageMetadata({
			title: 'Writing',
			description: WRITING_DESCRIPTION,
			canonical: writingCanonical(data ?? {}),
			robots: data?.status === 'ok' ? null : 'noindex',
			image,
			jsonLd: structuredBlocks(data)
		});
	}

	if (pathname === '/field-journal') {
		const journal = asRecord(data?.journal);
		const status = journal?.status;
		const indexable = status === 'ok' || status === 'empty';
		return pageMetadata({
			title: FIELD_JOURNAL_TITLE,
			description: FIELD_JOURNAL_DESCRIPTION,
			canonical: absoluteSiteUrl('/field-journal'),
			robots: indexable ? null : 'noindex',
			image,
			jsonLd: structuredBlocks(data)
		});
	}

	if (pathname === '/work') {
		const count = Array.isArray(data?.projects) ? data.projects.length : 0;
		return pageMetadata({
			title: 'Work',
			description: workPageCopy(count).description,
			canonical: absoluteSiteUrl('/work'),
			robots: 'noindex',
			image,
			jsonLd: structuredBlocks(data)
		});
	}

	const page = STATIC_PAGES[pathname];
	if (page) {
		return pageMetadata({
			title: page.title,
			description: page.description,
			canonical: absoluteSiteUrl(pathname),
			image,
			jsonLd: structuredBlocks(data)
		});
	}

	return pageMetadata({
		title: SITE_NAME,
		description: HOME_DESCRIPTION,
		canonical: absoluteSiteUrl(pathname),
		robots: 'noindex',
		image
	});
}
