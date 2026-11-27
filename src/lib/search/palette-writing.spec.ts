import { describe, expect, it, vi } from 'vitest';
import {
	loadPaletteWriting,
	paletteWritingPosts,
	requestPaletteWriting,
	type PaletteWritingRequest
} from './palette-writing';

const post = {
	slug: 'workflow-handoffs',
	title: 'Workflow handoffs',
	excerpt: 'Where a handoff drops the work.',
	tags: ['systems']
};

describe('palette writing payload', () => {
	it('keeps the fields the palette searches', () => {
		expect(paletteWritingPosts({ posts: [post] })).toEqual([post]);
		expect(
			paletteWritingPosts({
				status: 'ok',
				posts: [{ ...post, date: '2026-09-01', updated: '2026-09-02' }]
			})
		).toEqual([post]);
	});

	it('rejects a payload that is not a list of published search fields', () => {
		expect(paletteWritingPosts(null)).toBeNull();
		expect(paletteWritingPosts({ posts: [{ ...post, title: 1 }] })).toBeNull();
		expect(paletteWritingPosts({ posts: [{ ...post, tags: ['systems', 2] }] })).toBeNull();
	});
});

describe('palette writing requests', () => {
	it('shares one request until it succeeds', async () => {
		const load = vi.fn(async () => [post]);
		const first = requestPaletteWriting({ phase: 'empty' }, load);
		const second = requestPaletteWriting(first, load);
		expect(second).toBe(first);
		expect(load).toHaveBeenCalledTimes(1);
		expect(first.phase).toBe('pending');
		if (first.phase !== 'pending') return;
		const ready = await first.request;
		expect(ready).toEqual({ phase: 'ready', posts: [post] });
		expect(requestPaletteWriting(ready, load)).toBe(ready);
		expect(load).toHaveBeenCalledTimes(1);
	});

	it('keeps an empty published catalog without asking again', async () => {
		const load = vi.fn(async () => []);
		const pending = requestPaletteWriting({ phase: 'empty' }, load);
		if (pending.phase !== 'pending') throw new Error('expected a request');
		const ready = await pending.request;
		expect(ready).toEqual({ phase: 'ready', posts: [] });
		expect(requestPaletteWriting(ready, load)).toBe(ready);
		expect(load).toHaveBeenCalledTimes(1);
	});

	it('tries again after a failed response', async () => {
		const load = vi.fn(async () => null);
		const pending = requestPaletteWriting({ phase: 'empty' }, load);
		if (pending.phase !== 'pending') throw new Error('expected a request');
		const failed = await pending.request;
		expect(failed).toEqual({ phase: 'failed' });
		const retry = requestPaletteWriting(failed, load);
		expect(retry.phase).toBe('pending');
		expect(load).toHaveBeenCalledTimes(2);
	});

	it('tries again when the loader throws', async () => {
		const load = vi.fn(async () => {
			throw new Error('offline');
		});
		const pending = requestPaletteWriting({ phase: 'failed' }, load);
		if (pending.phase !== 'pending') throw new Error('expected a request');
		expect(await pending.request).toEqual({ phase: 'failed' });
	});

	it('treats a non-ok response as a retryable failure and a valid one as ready', async () => {
		const fetchImpl = vi.fn(async () => new Response('nope', { status: 503 }));
		expect(await loadPaletteWriting(fetchImpl)).toBeNull();
		fetchImpl.mockResolvedValueOnce(Response.json({ posts: [post] }));
		expect(await loadPaletteWriting(fetchImpl)).toEqual([post]);
		fetchImpl.mockResolvedValueOnce(Response.json({ posts: [{ title: 'missing slug' }] }));
		expect(await loadPaletteWriting(fetchImpl)).toBeNull();
	});
});

describe('request identity', () => {
	it('does not start work from a ready or pending value', () => {
		const ready: PaletteWritingRequest = { phase: 'ready', posts: [post] };
		const load = vi.fn(async () => [post]);
		expect(requestPaletteWriting(ready, load)).toBe(ready);
		expect(load).not.toHaveBeenCalled();
	});
});
