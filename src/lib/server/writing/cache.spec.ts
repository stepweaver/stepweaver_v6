import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cachedWriting, clearCache, FRESH_MS, MAX_AGE_MS, type WritingKV } from './cache';
import { getArticleBlocks, getWritingCatalog } from './catalog';
import { fixtureEntries } from '$lib/writing/fixtures';
import type { NotionFetcher } from './notion';

const valid = (value: unknown): value is string[] =>
	Array.isArray(value) && value.every((v) => typeof v === 'string');
function kv() {
	const data = new Map<string, string>();
	return {
		data,
		get: vi.fn(async (key: string) => data.get(key) ?? null),
		put: vi.fn(async (key: string, value: string) => {
			data.set(key, value);
		})
	} satisfies WritingKV & { data: Map<string, string> };
}
function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((done) => {
		resolve = done;
	});
	return { promise, resolve };
}
const options = { apiKey: 'test-secret', databaseId: 'db' };
const emptyPublished: NotionFetcher = async (url) =>
	Response.json(
		url.endsWith('/query')
			? { results: [], has_more: false }
			: { properties: { Status: { type: 'select' } } }
	);

beforeEach(() => {
	clearCache();
});
afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe('persistent writing cache', () => {
	it('serves a KV snapshot after Worker memory is cleared without calling Notion', async () => {
		const cache = kv();
		await cachedWriting('key', { cache, now: 1_000 }, valid, async () => ['published']);
		clearCache();
		const load = vi.fn(async () => ['wrong']);
		expect(await cachedWriting('key', { cache, now: 2_000 }, valid, load)).toEqual({
			value: ['published'],
			stale: false
		});
		expect(load).not.toHaveBeenCalled();
		expect(cache.put).toHaveBeenCalledWith('key', expect.any(String), {
			expirationTtl: MAX_AGE_MS / 1000
		});
	});

	it('returns stale data before a blocked refresh completes and persists the new copy', async () => {
		const cache = kv();
		cache.data.set('key', JSON.stringify({ at: 1_000, value: ['old'] }));
		const fetch = deferred<string[]>();
		const tasks: Promise<unknown>[] = [];
		const request = {
			cache,
			now: 1_000 + FRESH_MS,
			waitUntil: (p: Promise<unknown>) => {
				tasks.push(p);
			}
		};
		expect(await cachedWriting('key', request, valid, () => fetch.promise)).toEqual({
			value: ['old'],
			stale: true
		});
		fetch.resolve(['new']);
		await Promise.all(tasks);
		expect(JSON.parse(cache.data.get('key')!).value).toEqual(['new']);
	});

	it('returns a cold homepage without waiting on Notion, then warms the next request', async () => {
		const query = deferred<Response>();
		const tasks: Promise<unknown>[] = [];
		const request = {
			...options,
			cache: kv(),
			nonBlocking: true,
			waitUntil: (p: Promise<unknown>) => {
				tasks.push(p);
			},
			fetcher: async (url: string) =>
				url.endsWith('/query') ? Response.json({ results: [], has_more: false }) : query.promise
		};
		expect((await getWritingCatalog(request)).status).toBe('unavailable');
		query.resolve(Response.json({}));
		// The next request sees the completed public catalog.
		await Promise.all(tasks);
		expect((await getWritingCatalog(request)).status).toBe('ok');
	});

	it('does not refresh concurrently within an isolate', async () => {
		const work = deferred<string[]>();
		const load = vi.fn(() => work.promise);
		const tasks: Promise<unknown>[] = [];
		const request = {
			nonBlocking: true,
			waitUntil: (p: Promise<unknown>) => {
				tasks.push(p);
			}
		};
		await Promise.all([
			cachedWriting('key', request, valid, load),
			cachedWriting('key', request, valid, load)
		]);
		expect(load).toHaveBeenCalledTimes(1);
		work.resolve(['done']);
		await Promise.all(tasks);
	});

	it('keeps a good copy on failure and backs off instead of retrying every visitor', async () => {
		const cache = kv();
		cache.data.set('key', JSON.stringify({ at: 1_000, value: ['old'] }));
		const load = vi.fn(async () => {
			throw new Error('down');
		});
		const request = { cache, now: FRESH_MS + 1_000 };
		expect(await cachedWriting('key', request, valid, load)).toEqual({
			value: ['old'],
			stale: true
		});
		await cachedWriting('key', request, valid, load);
		expect(load).toHaveBeenCalledTimes(1);
		expect(cache.put).not.toHaveBeenCalled();
	});

	it('refuses data beyond the maximum stale age', async () => {
		const cache = kv();
		cache.data.set('key', JSON.stringify({ at: 1_000, value: ['old'] }));
		expect(
			await cachedWriting('key', { cache, now: MAX_AGE_MS + 1_000 }, valid, async () => {
				throw new Error('down');
			})
		).toBeUndefined();
	});

	it.each(['broken json', '{}', '{"at":1000,"value":[3]}', '{"at":9999999,"value":["future"]}'])(
		'ignores corrupt or future-dated KV values: %s',
		async (raw) => {
			const cache = kv();
			cache.data.set('key', raw);
			vi.spyOn(console, 'error').mockImplementation(() => {});
			expect(
				await cachedWriting('key', { cache, now: 2_000 }, valid, async () => ['good'])
			).toEqual({ value: ['good'], stale: false });
		}
	);

	it('bounds a hung KV read to 300ms on the homepage', async () => {
		vi.useFakeTimers();
		const cache = kv();
		cache.get.mockImplementation(() => new Promise(() => {}));
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const tasks: Promise<unknown>[] = [];
		const result = cachedWriting(
			'key',
			{
				cache,
				nonBlocking: true,
				waitUntil: (p) => {
					tasks.push(p);
				}
			},
			valid,
			async () => ['good']
		);
		await vi.advanceTimersByTimeAsync(300);
		expect(await result).toBeUndefined();
		await Promise.all(tasks);
	});

	it('does not discard good content when KV writes fail', async () => {
		const cache = kv();
		cache.put.mockRejectedValue(new Error('KV down'));
		vi.spyOn(console, 'error').mockImplementation(() => {});
		expect(await cachedWriting('key', { cache }, valid, async () => ['good'])).toEqual({
			value: ['good'],
			stale: false
		});
	});

	it('aborts a hung Notion operation within eight seconds', async () => {
		vi.useFakeTimers();
		vi.spyOn(console, 'error').mockImplementation(() => {});
		let signal: AbortSignal | null | undefined;
		const pending = getWritingCatalog({
			...options,
			fetcher: async (_url, init) => {
				signal = init?.signal;
				return new Promise(() => {});
			}
		});
		await vi.advanceTimersByTimeAsync(8_000);
		expect((await pending).status).toBe('unavailable');
		expect(signal?.aborted).toBe(true);
	});

	it('does not follow redirects or send credentials to redirect targets', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const fetcher = vi.fn(async (_url: string, init?: RequestInit) => {
			expect(init?.redirect).toBe('manual');
			return new Response(null, { status: 302, headers: { Location: 'https://example.com' } });
		});
		expect((await getWritingCatalog({ ...options, fetcher })).status).toBe('unavailable');
		expect(fetcher.mock.calls.every(([url]) => url.startsWith('https://api.notion.com/'))).toBe(
			true
		);
	});

	it('refreshes to an empty catalog and stops serving an unpublished cached article', async () => {
		const cache = kv();
		const post = fixtureEntries()[0];
		cache.data.set('writing:v1:db:catalog', JSON.stringify({ at: 1_000, value: [post] }));
		cache.data.set(
			`writing:v1:db:blocks:${post.id}:${post.updated}`,
			JSON.stringify({ at: 1_000, value: [{ type: 'divider' }] })
		);
		const request = { ...options, cache, now: FRESH_MS + 1_000, fetcher: emptyPublished };
		expect((await getWritingCatalog(request)).posts).toEqual([]);
		expect(await getArticleBlocks(request, post.id)).toEqual({ status: 'unavailable', blocks: [] });
		clearCache();
		expect((await getWritingCatalog(request)).posts).toEqual([]);
	});

	it('reads cached article blocks in a new Worker and separates databases', async () => {
		const cache = kv();
		const post = fixtureEntries()[0];
		cache.data.set('writing:v1:db:catalog', JSON.stringify({ at: 1_000, value: [post] }));
		cache.data.set(
			`writing:v1:db:blocks:${post.id}:${post.updated}`,
			JSON.stringify({ at: 1_000, value: [{ type: 'divider' }] })
		);
		const fetcher = vi.fn(emptyPublished);
		expect(await getArticleBlocks({ ...options, cache, now: 2_000, fetcher }, post.id)).toEqual({
			status: 'ok',
			blocks: [{ type: 'divider' }],
			stale: false
		});
		expect(fetcher).not.toHaveBeenCalled();
		expect(
			(await getWritingCatalog({ ...options, databaseId: 'other', cache, now: 2_000, fetcher }))
				.posts
		).toEqual([]);
	});
});

describe('page loaders', () => {
	it('returns the homepage and shared layout while Notion is still blocked', async () => {
		const { load: home } = await import('../../../routes/(marketing)/+page.server');
		const { load: layout } = await import('../../../routes/(marketing)/+layout.server');
		const pending = deferred<Response>();
		const tasks: Promise<unknown>[] = [];
		vi.stubGlobal('fetch', async (url: string) =>
			url.endsWith('/query') ? Response.json({ results: [], has_more: false }) : pending.promise
		);
		try {
			const event = {
				platform: {
					env: { NOTION_API_KEY: 'test', NOTION_BLOG_DB_ID: 'db' },
					ctx: {
						waitUntil: (p: Promise<unknown>) => {
							tasks.push(p);
						}
					}
				},
				depends: vi.fn(),
				setHeaders: vi.fn()
			};
			const [page, shell] = await Promise.all([home(event as never), layout(event as never)]);
			expect(page).toMatchObject({ writingPending: true });
			expect(shell).toHaveProperty('commandPalette');
			pending.resolve(Response.json({}));
			await Promise.all(tasks);
			expect(await home(event as never)).toMatchObject({ writingPending: false });
		} finally {
			vi.unstubAllGlobals();
		}
	});
});
