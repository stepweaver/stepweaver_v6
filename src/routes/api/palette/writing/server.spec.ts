import { describe, expect, it } from 'vitest';
import { paletteWritingBody } from '$lib/server/writing/palette-search';
import { FIXTURE_DRAFT_TITLE, fixtureEntries } from '$lib/writing/fixtures';
import { GET } from './+server';

describe('palette writing response', () => {
	it('returns an empty list when writing is not configured and fails closed when it is down', () => {
		expect(paletteWritingBody({ status: 'unconfigured', stale: false, posts: [] })).toEqual({
			status: 200,
			posts: []
		});
		expect(
			paletteWritingBody({ status: 'unavailable', stale: false, posts: fixtureEntries() })
		).toEqual({
			status: 503,
			posts: []
		});
	});

	it('returns only the published fields the palette searches', () => {
		const body = paletteWritingBody({ status: 'ok', stale: false, posts: fixtureEntries() });
		expect(body.status).toBe(200);
		const handoff = body.posts.find((post) => post.slug === 'workflow-handoffs');
		expect(handoff).toEqual({
			slug: 'workflow-handoffs',
			title: 'Workflow handoffs',
			excerpt: 'Where a handoff drops the work, and what the system has to remember.',
			tags: ['systems', 'operations']
		});
		expect(body.posts.map((post) => post.title)).not.toContain(FIXTURE_DRAFT_TITLE);
		for (const post of body.posts) {
			expect(Object.keys(post).sort()).toEqual(['excerpt', 'slug', 'tags', 'title']);
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
		const body = (await response.json()) as { posts: { slug: string }[] };
		expect(body.posts.map((post) => post.slug)).toContain('workflow-handoffs');
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
		expect(await response.json()).toEqual({ posts: [] });
	});
});
