import { describe, expect, it } from 'vitest';
import { paletteWritingBody } from '$lib/server/writing/palette-search';
import { FIXTURE_DRAFT_TITLE, fixtureEntries } from '$lib/writing/fixtures';
import { GET } from './+server';

describe('palette writing response', () => {
	it('returns an empty list when writing is not configured and fails closed when it is down', () => {
		expect(paletteWritingBody({ status: 'unconfigured', stale: false, posts: [] })).toEqual({
			httpStatus: 200,
			status: 'unconfigured',
			posts: []
		});
		expect(
			paletteWritingBody({ status: 'unavailable', stale: false, posts: fixtureEntries() })
		).toEqual({
			httpStatus: 503,
			status: 'unavailable',
			posts: []
		});
	});

	it('returns published listing fields and hides drafts', () => {
		const body = paletteWritingBody({ status: 'ok', stale: false, posts: fixtureEntries() });
		expect(body.httpStatus).toBe(200);
		expect(body.status).toBe('ok');
		const handoff = body.posts.find((post) => post.slug === 'workflow-handoffs');
		expect(handoff).toEqual({
			slug: 'workflow-handoffs',
			title: 'Workflow handoffs',
			excerpt: 'Where a handoff drops the work, and what the system has to remember.',
			tags: ['systems', 'operations'],
			date: '2026-09-01',
			updated: '2026-09-02'
		});
		expect(body.posts.map((post) => post.title)).not.toContain(FIXTURE_DRAFT_TITLE);
		for (const post of body.posts) {
			expect(Object.keys(post).sort()).toEqual([
				'date',
				'excerpt',
				'slug',
				'tags',
				'title',
				'updated'
			]);
		}
	});
});

describe('GET /api/palette/writing', () => {
	it('serves the fixture catalog without draft records', async () => {
		const response = await GET({
			platform: { env: { WRITING_SOURCE: 'fixture' } }
		} as never);
		expect(response.status).toBe(200);
		expect(response.headers.get('cache-control')).toBe('no-store');
		const body = (await response.json()) as {
			status: string;
			posts: { slug: string; date: string; updated: string }[];
		};
		expect(body.status).toBe('ok');
		expect(body.posts.map((post) => post.slug)).toContain('workflow-handoffs');
		expect(body.posts.find((post) => post.slug === 'workflow-handoffs')).toMatchObject({
			date: '2026-09-01',
			updated: '2026-09-02'
		});
		expect(JSON.stringify(body)).not.toContain(FIXTURE_DRAFT_TITLE);
		expect(JSON.stringify(body)).not.toContain('revisedAt');
		expect(JSON.stringify(body)).not.toContain('fixture000');
	});

	it('answers 503 when the writing source is unavailable', async () => {
		const response = await GET({
			platform: { env: { WRITING_SOURCE: 'unavailable' } }
		} as never);
		expect(response.status).toBe(503);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(await response.json()).toEqual({ status: 'unavailable', posts: [] });
	});
});
