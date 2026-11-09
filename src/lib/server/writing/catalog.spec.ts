import { describe, expect, it } from 'vitest';
import { clearWritingCache, getArticleBlocks, getWritingCatalog } from './catalog';
import { fetchPublishedPages } from './notion';
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
		let calls = 0;
		const fetcher = async () => {
			calls += 1;
			if (calls === 1) {
				return new Response(
					JSON.stringify({
						data_sources: [{ id: 'ds-1' }],
						properties: { Status: { type: 'select' } }
					}),
					{ status: 200 }
				);
			}
			if (calls === 2) {
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
			async (url) => {
				if (url.includes('/databases/')) {
					return new Response(
						JSON.stringify({
							data_sources: [{ id: 'source-1', name: 'codex' }],
							properties: { Status: { type: 'select' } }
						}),
						{ status: 200 }
					);
				}
				const request = JSON.parse(
					(await Promise.resolve(url), '{"filter":{"property":"Status"}}')
				);
				expect(url).toContain('/data_sources/source-1/query');
				expect(request).toBeTruthy();
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
