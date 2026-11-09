import { fixtureArticleBlocks, fixtureEntries } from '$lib/writing/fixtures';
import { toWritingEntries } from '$lib/writing/entries';
import type { RenderBlock, WritingCatalog, WritingEntry } from '$lib/writing/types';
import { fetchPageBlocks, fetchPublishedPages, type NotionFetcher } from './notion';

const FRESH_MS = 300_000;

type CacheEntry = { at: number; posts: WritingEntry[] };
const catalogCache = new Map<string, CacheEntry>();
const blockCache = new Map<string, { at: number; blocks: RenderBlock[] }>();

export function clearWritingCache(): void {
	catalogCache.clear();
	blockCache.clear();
}

export type CatalogRequest = {
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

	const now = request.now ?? Date.now();
	const cacheKey = databaseId;
	const cached = catalogCache.get(cacheKey);
	if (cached && now - cached.at < FRESH_MS) {
		return { status: 'ok', stale: false, posts: cached.posts };
	}

	try {
		const fetcher = request.fetcher ?? fetch;
		const pages = await fetchPublishedPages(fetcher, apiKey, databaseId);
		const posts = toWritingEntries(pages);
		catalogCache.set(cacheKey, { at: now, posts });
		return { status: 'ok', stale: false, posts };
	} catch {
		if (cached) return { status: 'ok', stale: true, posts: cached.posts };
		return { status: 'unavailable', stale: false, posts: [] };
	}
}

export async function getArticleBlocks(
	request: CatalogRequest,
	pageId: string
): Promise<{ status: 'ok' | 'unavailable'; blocks: RenderBlock[] }> {
	const source = request.source?.trim().toLowerCase();
	if (source === 'fixture') {
		return { status: 'ok', blocks: fixtureArticleBlocks(pageId) };
	}
	const apiKey = request.apiKey?.trim();
	if (!apiKey || source === 'unavailable') return { status: 'unavailable', blocks: [] };

	const now = request.now ?? Date.now();
	const cached = blockCache.get(pageId);
	if (cached && now - cached.at < FRESH_MS) return { status: 'ok', blocks: cached.blocks };

	try {
		const fetcher = request.fetcher ?? fetch;
		const blocks = await fetchPageBlocks(fetcher, apiKey, pageId);
		blockCache.set(pageId, { at: now, blocks });
		return { status: 'ok', blocks };
	} catch {
		if (cached) return { status: 'ok', blocks: cached.blocks };
		return { status: 'unavailable', blocks: [] };
	}
}
