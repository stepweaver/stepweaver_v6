import { fixtureArticleBlocks, fixtureEntries } from '$lib/writing/fixtures';
import { toWritingEntries } from '$lib/writing/entries';
import type { RenderBlock, WritingCatalog, WritingEntry } from '$lib/writing/types';
import {
	fetchPageBlocks,
	fetchPublishedPages,
	NotionRequestError,
	type NotionFetcher
} from './notion';

import { cachedWriting, clearCache, within, type CacheOptions } from './cache';

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
				['id', 'title', 'slug', 'date', 'updated', 'excerpt', 'summary', 'cover'].every(
					(key) => typeof post[key] === 'string'
				) &&
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

export async function getWritingCatalog(request: CatalogRequest = {}): Promise<WritingCatalog> {
	const source = request.source?.trim().toLowerCase();
	if (source === 'fixture') {
		return { status: 'ok', stale: false, posts: fixtureEntries() };
	}
	if (source === 'unavailable') {
		return { status: 'unavailable', stale: false, posts: [] };
	}

	const apiKey = request.apiKey?.trim();
	const databaseId = request.databaseId?.trim();
	if (!apiKey || !databaseId) {
		return { status: 'unconfigured', stale: false, posts: [] };
	}

	const result = await cachedWriting(`writing:v1:${databaseId}:catalog`, request, isPosts, () =>
		notionOperation(request, 'fetch published pages', async (fetcher) =>
			toWritingEntries(await fetchPublishedPages(fetcher, apiKey, databaseId))
		)
	);
	return result
		? { status: 'ok', stale: result.stale, posts: result.value }
		: { status: 'unavailable', stale: false, posts: [] };
}

/**
 * Publication decision for a direct article URL.
 *
 * Trustworthy only when `status` is `ok`. That means a successful Notion
 * published-set read younger than five minutes (`FRESH_MS`), or the fixture source.
 * A stale catalog, including one kept because Notion failed, is not
 * authorization. Callers must not deliver the article otherwise.
 * Unpublication is visible after that fresh window once Notion answers.
 * It is not instantaneous inside the window.
 */
export async function getPublicationCatalog(request: CatalogRequest = {}): Promise<WritingCatalog> {
	return getWritingCatalog({ ...request, acceptStale: false, nonBlocking: false });
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
	const apiKey = request.apiKey?.trim();
	if (!apiKey || source === 'unavailable') return { status: 'unavailable', blocks: [] };

	// A body cache is not permission to publish. Require a fresh published-set read.
	const catalog = await getPublicationCatalog(request);
	if (catalog.status !== 'ok' || !catalog.posts.some((post) => post.id === pageId)) {
		return { status: 'unavailable', blocks: [] };
	}
	const post = catalog.posts.find((post) => post.id === pageId)!;
	const result = await cachedWriting(
		`writing:v1:${request.databaseId?.trim()}:blocks:${pageId}:${post.updated}`,
		request,
		isBlocks,
		() =>
			notionOperation(request, 'fetch page blocks', (fetcher) =>
				fetchPageBlocks(fetcher, apiKey, pageId)
			)
	);
	return result
		? { status: 'ok', blocks: result.value, stale: result.stale }
		: { status: 'unavailable', blocks: [] };
}
