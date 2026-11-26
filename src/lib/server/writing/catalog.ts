import { fixtureArticleBlocks, fixtureEntries } from '$lib/writing/fixtures';
import { findBySlug, toWritingEntries } from '$lib/writing/entries';
import type { RenderBlock, WritingCatalog, WritingEntry } from '$lib/writing/types';
import {
	fetchPageBlocks,
	fetchPublishedPages,
	NotionRequestError,
	type NotionFetcher
} from './notion';

import {
	cachedWriting,
	clearCache,
	peekWriting,
	within,
	type CacheHitSource,
	type CacheOptions
} from './cache';

export function clearWritingCache(): void {
	clearCache();
}

function isPosts(value: unknown): value is WritingEntry[] {
	return (
		Array.isArray(value) &&
		value.every(
			(post) =>
				post &&
				typeof post === 'object' &&
				[
					'id',
					'title',
					'slug',
					'date',
					'updated',
					'revisedAt',
					'excerpt',
					'summary',
					'cover'
				].every((key) => typeof post[key] === 'string') &&
				typeof post.featured === 'boolean' &&
				Array.isArray(post.tags) &&
				post.tags.every((tag: unknown) => typeof tag === 'string') &&
				Array.isArray(post.legacySlugs) &&
				post.legacySlugs.every((slug: unknown) => typeof slug === 'string')
		)
	);
}

function isSpans(value: unknown): boolean {
	return (
		Array.isArray(value) &&
		value.every(
			(span) =>
				span &&
				typeof span.text === 'string' &&
				(span.href === undefined || typeof span.href === 'string') &&
				['bold', 'italic', 'code'].every(
					(key) => span[key] === undefined || typeof span[key] === 'boolean'
				)
		)
	);
}

function isBlocks(value: unknown): value is RenderBlock[] {
	return (
		Array.isArray(value) &&
		value.every((block) => {
			if (!block || typeof block !== 'object') return false;
			switch (block.type) {
				case 'paragraph':
				case 'quote':
					return isSpans(block.spans);
				case 'heading':
					return (
						[2, 3, 4].includes(block.level) &&
						typeof block.text === 'string' &&
						typeof block.id === 'string'
					);
				case 'code':
					return typeof block.text === 'string' && typeof block.language === 'string';
				case 'divider':
					return true;
				case 'list':
					return (
						typeof block.ordered === 'boolean' &&
						Array.isArray(block.items) &&
						block.items.every(isSpans)
					);
				case 'image':
					return typeof block.src === 'string' && typeof block.alt === 'string';
				case 'unsupported':
					return typeof block.name === 'string';
				default:
					return false;
			}
		})
	);
}

/** One budget for the entire paginated operation, including JSON body reads. */
async function notionOperation<T>(
	request: CatalogRequest,
	operation: string,
	load: (fetcher: NotionFetcher) => Promise<T>
): Promise<T> {
	const controller = new AbortController();
	const fetcher: NotionFetcher = (url, init) => {
		controller.signal.throwIfAborted();
		return (request.fetcher ?? fetch)(url, {
			...init,
			signal: controller.signal,
			redirect: 'manual'
		});
	};
	try {
		return await within(load(fetcher), 8_000);
	} catch (error) {
		logWritingFailure(error, operation);
		throw error;
	} finally {
		controller.abort();
	}
}

function logWritingFailure(error: unknown, operation: string): void {
	if (error instanceof NotionRequestError) {
		console.error(error.operation, error.status);
		return;
	}
	console.error(operation);
}

export type CatalogRequest = CacheOptions & {
	source?: string;
	apiKey?: string;
	databaseId?: string;
	fetcher?: NotionFetcher;
	now?: number;
};

type CatalogSource = CacheHitSource | 'none';

/**
 * Body snapshots are keyed by the full Notion revision, not the calendar day.
 * Older keys that ended in `updated` (`YYYY-MM-DD`) are left to expire.
 * A catalog snapshot without `revisedAt` fails `isPosts` and is not reused.
 */
export function articleBodyCacheKey(
	databaseId: string | undefined,
	pageId: string,
	revisedAt: string | undefined
): string | null {
	const database = databaseId?.trim() ?? '';
	const revision = revisedAt?.trim() ?? '';
	if (!database || !pageId || !revision) return null;
	return `writing:v1:${database}:blocks:${pageId}:rev:${encodeURIComponent(revision)}`;
}

async function readCatalog(
	request: CatalogRequest,
	mode: 'listing' | 'authorize' | 'revalidate'
): Promise<{ catalog: WritingCatalog; source: CatalogSource }> {
	const source = request.source?.trim().toLowerCase();
	if (source === 'fixture') {
		return { catalog: { status: 'ok', stale: false, posts: fixtureEntries() }, source: 'load' };
	}
	if (source === 'unavailable') {
		return { catalog: { status: 'unavailable', stale: false, posts: [] }, source: 'none' };
	}

	const apiKey = request.apiKey?.trim();
	const databaseId = request.databaseId?.trim();
	if (!apiKey || !databaseId) {
		return { catalog: { status: 'unconfigured', stale: false, posts: [] }, source: 'none' };
	}

	const sink: { source?: CacheHitSource } = {};
	const result = await cachedWriting(
		`writing:v1:${databaseId}:catalog`,
		{
			...request,
			acceptStale: mode === 'listing' ? request.acceptStale : false,
			nonBlocking: mode === 'listing' ? request.nonBlocking : false,
			revalidate: mode === 'revalidate'
		},
		isPosts,
		() =>
			notionOperation(request, 'fetch published pages', async (fetcher) =>
				toWritingEntries(await fetchPublishedPages(fetcher, apiKey, databaseId))
			),
		sink
	);
	if (!result) {
		return { catalog: { status: 'unavailable', stale: false, posts: [] }, source: 'none' };
	}
	return {
		catalog: { status: 'ok', stale: result.stale, posts: result.value },
		source: sink.source ?? 'cache'
	};
}

export async function getWritingCatalog(request: CatalogRequest = {}): Promise<WritingCatalog> {
	return (await readCatalog(request, 'listing')).catalog;
}

/**
 * Publication catalog for a direct article URL.
 *
 * Trustworthy only when `status` is `ok`: a successful Notion published-set
 * read younger than five minutes (`FRESH_MS`), or the fixture source.
 * A stale catalog, including one kept because Notion failed, is not
 * authorization. A fresh catalog may serve a body already stored for that
 * revision. It does not authorize a Notion block fetch. See `loadArticleBySlug`.
 */
export async function getPublicationCatalog(request: CatalogRequest = {}): Promise<WritingCatalog> {
	return (await readCatalog(request, 'authorize')).catalog;
}

type ResolvedBody =
	| { status: 'ok'; post: WritingEntry; blocks: RenderBlock[]; stale: boolean }
	| { status: 'missing' }
	| { status: 'unavailable' }
	| { status: 'body-failed'; post: WritingEntry };

async function fetchBlocks(
	request: CatalogRequest,
	post: WritingEntry
): Promise<{ status: 'ok'; blocks: RenderBlock[]; stale: boolean } | { status: 'failed' }> {
	const apiKey = request.apiKey?.trim();
	if (!apiKey) return { status: 'failed' };
	const load = () =>
		notionOperation(request, 'fetch page blocks', (fetcher) =>
			fetchPageBlocks(fetcher, apiKey, post.id)
		);
	const key = articleBodyCacheKey(request.databaseId, post.id, post.revisedAt);
	if (!key) {
		try {
			return { status: 'ok', blocks: await load(), stale: false };
		} catch {
			return { status: 'failed' };
		}
	}
	const result = await cachedWriting(
		key,
		{ ...request, acceptStale: false, nonBlocking: false, revalidate: false },
		isBlocks,
		load
	);
	return result
		? { status: 'ok', blocks: result.value, stale: result.stale }
		: { status: 'failed' };
}

/**
 * Serve a cached body for `post` when the caller already holds a fresh
 * publication catalog. On a miss, require a Notion read from this request
 * before fetching blocks. A miss never reads the previous calendar-date key.
 */
async function resolvePublishedPost(
	request: CatalogRequest,
	post: WritingEntry,
	catalogSource: CatalogSource
): Promise<ResolvedBody> {
	let current = post;
	const key = articleBodyCacheKey(request.databaseId, current.id, current.revisedAt);
	if (key) {
		const peeked = await peekWriting(key, request, isBlocks);
		if (peeked) return { status: 'ok', post: current, blocks: peeked.value, stale: peeked.stale };
	}

	if (catalogSource !== 'load') {
		const live = await readCatalog(request, 'revalidate');
		if (live.catalog.status !== 'ok') return { status: 'unavailable' };
		const again = live.catalog.posts.find((entry) => entry.id === post.id);
		if (!again) return { status: 'missing' };
		current = again;
		const liveKey = articleBodyCacheKey(request.databaseId, current.id, current.revisedAt);
		if (liveKey && liveKey !== key) {
			const peeked = await peekWriting(liveKey, request, isBlocks);
			if (peeked) {
				return { status: 'ok', post: current, blocks: peeked.value, stale: peeked.stale };
			}
		}
	}

	const fetched = await fetchBlocks(request, current);
	if (fetched.status === 'failed') return { status: 'body-failed', post: current };
	return { status: 'ok', post: current, blocks: fetched.blocks, stale: fetched.stale };
}

export async function getArticleBlocks(
	request: CatalogRequest,
	pageId: string
): Promise<{ status: 'ok' | 'unavailable'; blocks: RenderBlock[]; stale?: boolean }> {
	const source = request.source?.trim().toLowerCase();
	if (source === 'fixture') {
		const published = fixtureEntries().some((post) => post.id === pageId);
		return published
			? { status: 'ok', blocks: fixtureArticleBlocks(pageId) }
			: { status: 'unavailable', blocks: [] };
	}
	if (!request.apiKey?.trim() || source === 'unavailable') {
		return { status: 'unavailable', blocks: [] };
	}

	const read = await readCatalog(request, 'authorize');
	if (read.catalog.status !== 'ok') return { status: 'unavailable', blocks: [] };
	const post = read.catalog.posts.find((entry) => entry.id === pageId);
	if (!post) return { status: 'unavailable', blocks: [] };
	const body = await resolvePublishedPost(request, post, read.source);
	if (body.status !== 'ok') return { status: 'unavailable', blocks: [] };
	return { status: 'ok', blocks: body.blocks, stale: body.stale };
}

export type ArticlePage =
	| { kind: 'unconfigured' }
	| { kind: 'unavailable' }
	| { kind: 'missing' }
	| { kind: 'redirect'; slug: string }
	| {
			kind: 'published';
			post: WritingEntry;
			blocks: RenderBlock[];
			blocksUnavailable: boolean;
			stale: boolean;
	  };

/**
 * One publication flow for `/writing/[slug]`.
 *
 * A fresh catalog may satisfy a body that is already stored for `revisedAt`.
 * Fetching a missing body waits for a published-set read in this request.
 * That read is skipped when the catalog read above already waited on Notion.
 * Denial and an unconfirmed read return no post, so the route cannot render
 * the title or article sharing metadata.
 */
export async function loadArticleBySlug(
	request: CatalogRequest,
	slug: string
): Promise<ArticlePage> {
	const source = request.source?.trim().toLowerCase();
	if (source === 'fixture') {
		const match = findBySlug(fixtureEntries(), slug);
		if (match.kind === 'redirect') return { kind: 'redirect', slug: match.slug };
		if (match.kind === 'missing') return { kind: 'missing' };
		return {
			kind: 'published',
			post: match.post,
			blocks: fixtureArticleBlocks(match.post.id),
			blocksUnavailable: false,
			stale: false
		};
	}

	const read = await readCatalog(request, 'authorize');
	if (read.catalog.status === 'unconfigured') return { kind: 'unconfigured' };
	if (read.catalog.status !== 'ok') return { kind: 'unavailable' };
	const match = findBySlug(read.catalog.posts, slug);
	if (match.kind === 'redirect') return { kind: 'redirect', slug: match.slug };
	if (match.kind === 'missing') return { kind: 'missing' };

	const body = await resolvePublishedPost(request, match.post, read.source);
	if (body.status === 'missing') return { kind: 'missing' };
	if (body.status === 'unavailable') return { kind: 'unavailable' };
	if (body.post.slug !== slug) return { kind: 'redirect', slug: body.post.slug };
	if (body.status === 'body-failed') {
		return {
			kind: 'published',
			post: body.post,
			blocks: [],
			blocksUnavailable: true,
			stale: true
		};
	}
	return {
		kind: 'published',
		post: body.post,
		blocks: body.blocks,
		blocksUnavailable: false,
		stale: body.stale
	};
}
