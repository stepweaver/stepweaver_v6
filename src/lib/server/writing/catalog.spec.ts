import { describe, expect, it, vi } from 'vitest';
import { clearWritingCache, getArticleBlocks, getWritingCatalog } from './catalog';
import { fetchPublishedPages, pageToRaw } from './notion';
import { FIXTURE_DRAFT_TITLE } from '$lib/writing/fixtures';

describe('writing catalog', () => {
	it('does not crash or pretend the archive is empty when Notion is not configured', async () => {
		clearWritingCache();
		const catalog = await getWritingCatalog({});
		expect(catalog.status).toBe('unconfigured');
		expect(catalog.posts).toEqual([]);
	});

	it('serves fixture posts and hides the unpublished fixture', async () => {
		const catalog = await getWritingCatalog({ source: 'fixture' });
		expect(catalog.status).toBe('ok');
		expect(catalog.posts.some((post) => post.title === FIXTURE_DRAFT_TITLE)).toBe(false);
		expect(catalog.posts[0]?.slug).toBe('workflow-handoffs');
		const renamed = catalog.posts.find((post) => post.slug === 'original-stable-slug');
		expect(renamed?.legacySlugs).toContain('renamed-after-publication');
	});

	it('keeps the last good copy when Notion fails after a success', async () => {
		clearWritingCache();
		let queries = 0;
		const fetcher = async (url: string) => {
			if (url.includes('/databases/') && !url.includes('/query')) {
				return new Response(
					JSON.stringify({
						data_sources: [{ id: 'ds-1' }],
						properties: { Status: { type: 'select' } }
					}),
					{ status: 200 }
				);
			}
			if (url.includes('/data_sources/') && !url.includes('/query')) {
				return new Response(JSON.stringify({ properties: { Status: { type: 'select' } } }), {
					status: 200
				});
			}
			queries += 1;
			if (queries === 1) {
				return new Response(
					JSON.stringify({
						results: [
							{
								id: 'page-1',
								created_time: '2026-02-01T00:00:00.000Z',
								last_edited_time: '2026-02-02T00:00:00.000Z',
								properties: {
									Title: { type: 'title', title: [{ plain_text: 'Live note' }] },
									Status: { type: 'select', select: { name: 'Published' } },
									Excerpt: { type: 'rich_text', rich_text: [{ plain_text: 'Excerpt' }] },
									Tags: { type: 'multi_select', multi_select: [{ name: 'systems' }] },
									Date: { type: 'created_time' }
								}
							},
							{
								id: 'page-2',
								created_time: '2026-03-01T00:00:00.000Z',
								properties: {
									Title: { type: 'title', title: [{ plain_text: 'Secret draft' }] },
									Status: { type: 'select', select: { name: 'Draft' } }
								}
							}
						],
						has_more: false
					}),
					{ status: 200 }
				);
			}
			return new Response('nope', { status: 503 });
		};

		const first = await getWritingCatalog({
			apiKey: 'test-key',
			databaseId: 'db-1',
			fetcher,
			now: 1_000
		});
		expect(first.status).toBe('ok');
		expect(first.posts.map((post) => post.title)).toEqual(['Live note']);
		expect(first.stale).toBe(false);

		const second = await getWritingCatalog({
			apiKey: 'test-key',
			databaseId: 'db-1',
			fetcher,
			now: 1_000 + 300_000
		});
		expect(second.status).toBe('ok');
		expect(second.stale).toBe(true);
		expect(second.posts.map((post) => post.title)).toEqual(['Live note']);
	});

	it('reports unavailable instead of an empty archive when the first fetch fails', async () => {
		clearWritingCache();
		const catalog = await getWritingCatalog({
			apiKey: 'test-key',
			databaseId: 'db-missing',
			fetcher: async () => new Response('down', { status: 500 }),
			now: 5_000
		});
		expect(catalog.status).toBe('unavailable');
		expect(catalog.posts).toEqual([]);
	});

	it('queries the data source and still drops a non-published row', async () => {
		const pages = await fetchPublishedPages(
			async (url, init) => {
				if (url.includes('/databases/')) {
					return new Response(
						JSON.stringify({
							data_sources: [{ id: 'source-1', name: 'codex' }],
							properties: { Status: { type: 'select' } }
						}),
						{ status: 200 }
					);
				}
				if (!url.includes('/query')) {
					return new Response(JSON.stringify({ properties: { Status: { type: 'select' } } }), {
						status: 200
					});
				}
				const request = JSON.parse(String(init?.body));
				expect(url).toContain('/data_sources/source-1/query');
				expect(request.filter).toEqual({ property: 'Status', select: { equals: 'Published' } });
				return new Response(
					JSON.stringify({
						results: [
							{
								id: 'published-1',
								created_time: '2026-01-02T00:00:00.000Z',
								last_edited_time: '2026-01-02T00:00:00.000Z',
								properties: {
									Title: { type: 'title', title: [{ plain_text: 'Visible' }] },
									Status: { type: 'select', select: { name: 'Published' } },
									Excerpt: { type: 'rich_text', rich_text: [] },
									Tags: { type: 'multi_select', multi_select: [] }
								}
							}
						],
						has_more: false
					}),
					{ status: 200 }
				);
			},
			'token',
			'db'
		);
		expect(pages.map((page) => page.title)).toEqual(['Visible']);
	});

	it('reads a status property from the data source when the database response has none', async () => {
		const calls: string[] = [];
		const pages = await fetchPublishedPages(
			async (url, init) => {
				calls.push(url);
				const version = new Headers(init?.headers).get('Notion-Version');
				if (url.endsWith('/databases/db')) {
					expect(version).toBe('2025-09-03');
					return new Response(
						JSON.stringify({ data_sources: [{ id: 'source-status', name: 'codex' }] }),
						{ status: 200 }
					);
				}
				if (url.endsWith('/data_sources/source-status')) {
					expect(version).toBe('2025-09-03');
					return new Response(JSON.stringify({ properties: { Status: { type: 'status' } } }), {
						status: 200
					});
				}
				expect(url).toBe('https://api.notion.com/v1/data_sources/source-status/query');
				expect(version).toBe('2025-09-03');
				expect(JSON.parse(String(init?.body)).filter).toEqual({
					property: 'Status',
					status: { equals: 'Published' }
				});
				return new Response(
					JSON.stringify({
						results: [
							{
								id: 'published-status',
								created_time: '2026-04-01T00:00:00.000Z',
								last_edited_time: '2026-04-02T00:00:00.000Z',
								properties: {
									Title: { type: 'title', title: [{ plain_text: 'Status note' }] },
									Status: { type: 'status', status: { name: 'Published' } }
								}
							}
						],
						has_more: false
					}),
					{ status: 200 }
				);
			},
			'token',
			'db'
		);
		expect(calls).toEqual([
			'https://api.notion.com/v1/databases/db',
			'https://api.notion.com/v1/data_sources/source-status',
			'https://api.notion.com/v1/data_sources/source-status/query'
		]);
		expect(pages.map((page) => page.title)).toEqual(['Status note']);
	});

	it('keeps the legacy database query when data source discovery fails', async () => {
		const pages = await fetchPublishedPages(
			async (url, init) => {
				if (!init?.method) return new Response('old api', { status: 400 });
				expect(url).toBe('https://api.notion.com/v1/databases/db/query');
				expect(new Headers(init.headers).get('Notion-Version')).toBe('2022-06-28');
				expect(JSON.parse(String(init.body)).filter).toEqual({
					property: 'Status',
					select: { equals: 'Published' }
				});
				return new Response(
					JSON.stringify({
						results: [
							{
								id: 'legacy-1',
								created_time: '2026-01-01T00:00:00.000Z',
								properties: {
									Title: { type: 'title', title: [{ plain_text: 'Legacy note' }] },
									Status: { type: 'select', select: { name: 'Published' } }
								}
							}
						],
						has_more: false
					}),
					{ status: 200 }
				);
			},
			'token',
			'db'
		);
		expect(pages.map((page) => page.title)).toEqual(['Legacy note']);
	});

	it('surfaces an access failure and logs only the operation and status', async () => {
		clearWritingCache();
		const urls: string[] = [];
		const logged: unknown[][] = [];
		const spy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
			logged.push(args);
		});
		try {
			const catalog = await getWritingCatalog({
				apiKey: 'test-key',
				databaseId: 'db-locked',
				now: 8_000,
				fetcher: async (url) => {
					urls.push(url);
					if (url.includes('/databases/') && !url.includes('/query')) {
						return new Response(JSON.stringify({ data_sources: [{ id: 'ds-locked' }] }), {
							status: 200
						});
					}
					if (!url.includes('/query')) {
						return new Response(JSON.stringify({ properties: { Status: { type: 'status' } } }), {
							status: 200
						});
					}
					return new Response('integration token rejected', { status: 403 });
				}
			});
			expect(catalog.status).toBe('unavailable');
			expect(catalog.posts).toEqual([]);
			expect(urls.some((url) => url.includes('/databases/db-locked/query'))).toBe(false);
			expect(logged).toEqual([['query data source', 403]]);
		} finally {
			spy.mockRestore();
		}
	});

	it('reads optional editorial fields and still maps a note that lacks them', () => {
		const marked = pageToRaw({
			id: 'page-marked',
			created_time: '2026-01-02T00:00:00.000Z',
			last_edited_time: '2026-01-03T00:00:00.000Z',
			cover: { type: 'external', external: { url: 'http://insecure.example/cover.jpg' } },
			properties: {
				Title: { type: 'title', title: [{ plain_text: 'Marked' }] },
				Status: { type: 'select', select: { name: 'Published' } },
				Excerpt: { type: 'rich_text', rich_text: [{ plain_text: 'Excerpt text' }] },
				Description: { type: 'rich_text', rich_text: [{ plain_text: 'Description text' }] },
				'TL;DR': { type: 'rich_text', rich_text: [{ plain_text: 'Short version' }] },
				Featured: { type: 'checkbox', checkbox: true },
				Cover: {
					type: 'files',
					files: [{ type: 'file', file: { url: 'https://cdn.example.com/cover.jpg' } }]
				},
				Date: { type: 'created_time' }
			}
		});
		expect(marked).toMatchObject({
			title: 'Marked',
			status: 'Published',
			excerpt: 'Excerpt text',
			description: 'Description text',
			tldr: 'Short version',
			featured: true,
			cover: 'https://cdn.example.com/cover.jpg',
			created: '2026-01-02T00:00:00.000Z'
		});

		const bare = pageToRaw({
			id: 'page-bare',
			created_time: '2024-05-01T12:00:00.000Z',
			properties: {
				Name: { type: 'title', title: [{ plain_text: 'Older title' }] },
				Status: { type: 'select', select: { name: 'Published' } }
			}
		});
		expect(bare).toMatchObject({
			title: 'Older title',
			excerpt: '',
			description: '',
			tldr: '',
			featured: false,
			cover: '',
			created: '2024-05-01T12:00:00.000Z'
		});

		const pageCover = pageToRaw({
			id: 'page-cover',
			cover: { type: 'external', external: { url: 'https://cdn.example.com/page.jpg' } },
			properties: {
				Title: { type: 'title', title: [{ plain_text: 'Cover' }] },
				Featured: { type: 'select', select: { name: 'Yes' } }
			}
		});
		expect(pageCover).toMatchObject({
			featured: true,
			cover: 'https://cdn.example.com/page.jpg'
		});
	});

	it('does not invent article blocks when the block fetch fails', async () => {
		const result = await getArticleBlocks(
			{
				apiKey: 'test-key',
				fetcher: async () => new Response('down', { status: 500 })
			},
			'page-1'
		);
		expect(result).toEqual({ status: 'unavailable', blocks: [] });
	});
});
