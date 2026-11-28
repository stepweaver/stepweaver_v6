import { describe, expect, it, vi } from 'vitest';
import { holdRequest } from '$lib/search/palette-writing';
import {
	CODEX_LIBRARY_DEADLINE_MS,
	commandNeedsWriting,
	codexLibraryFromPayload,
	loadCodexLibrary
} from './writing';

const post = {
	slug: 'workflow-handoffs',
	title: 'Workflow handoffs',
	excerpt: 'Where a handoff drops the work.',
	tags: ['systems', 'operations'],
	date: '2026-09-01',
	updated: '2026-09-02'
};

describe('commands that read the writing catalog', () => {
	it('fetches for codex and for codex commands that read posts', () => {
		expect(commandNeedsWriting('shell', 'codex')).toBe(true);
		expect(commandNeedsWriting('shell', '  CODEX  ')).toBe(true);
		expect(commandNeedsWriting('shell', 'codex now')).toBe(true);
		expect(commandNeedsWriting('codex', 'ls')).toBe(true);
		expect(commandNeedsWriting('codex', 'dir')).toBe(true);
		expect(commandNeedsWriting('codex', 'grep systems')).toBe(true);
		expect(commandNeedsWriting('codex', 'filter operations')).toBe(true);
		expect(commandNeedsWriting('codex', 'cat 1')).toBe(true);
		expect(commandNeedsWriting('codex', 'cat workflow-handoffs')).toBe(true);
	});

	it('leaves static shell commands and codex chrome alone', () => {
		for (const input of [
			'help',
			'clear',
			'resume',
			'cd',
			'cd resume',
			'cd writing',
			'cd codex',
			'roll 1d6',
			'weather South Bend',
			'contact',
			'chat hello',
			'blackjack',
			'bj',
			'zork',
			'cancel',
			''
		]) {
			expect(commandNeedsWriting('shell', input)).toBe(false);
		}
		for (const input of [
			'help',
			'?',
			'pwd',
			'clear',
			'exit',
			'quit',
			'cancel',
			'grep',
			'cat',
			''
		]) {
			expect(commandNeedsWriting('codex', input)).toBe(false);
		}
		expect(commandNeedsWriting('contact', 'ls')).toBe(false);
		expect(commandNeedsWriting('blackjack', 'codex')).toBe(false);
	});
});

describe('codex library payload', () => {
	it('keeps published listing fields, including the dates ls prints', () => {
		expect(codexLibraryFromPayload({ status: 'ok', posts: [post] })).toEqual({
			status: 'ok',
			posts: [post]
		});
		expect(codexLibraryFromPayload({ status: 'ok', posts: [] })).toEqual({
			status: 'ok',
			posts: []
		});
		expect(codexLibraryFromPayload({ status: 'unconfigured', posts: [] })).toEqual({
			status: 'unconfigured',
			posts: []
		});
	});

	it('treats an unavailable or malformed payload as a failed load', () => {
		expect(codexLibraryFromPayload({ status: 'unavailable', posts: [post] })).toBeNull();
		expect(codexLibraryFromPayload({ status: 'ok', posts: [{ ...post, date: 1 }] })).toBeNull();
		expect(codexLibraryFromPayload({ status: 'unconfigured', posts: [post] })).toBeNull();
		expect(codexLibraryFromPayload({ posts: [post] })).toBeNull();
		expect(codexLibraryFromPayload(null)).toBeNull();
	});
});

describe('codex library requests', () => {
	it('shares one request and keeps a successful catalog', async () => {
		const load = vi.fn(async () => ({ status: 'ok' as const, posts: [post] }));
		const first = holdRequest({ phase: 'empty' }, load);
		const second = holdRequest(first, load);
		expect(second).toBe(first);
		expect(load).toHaveBeenCalledTimes(1);
		if (first.phase !== 'pending') throw new Error('expected a request');
		const ready = await first.request;
		expect(ready).toEqual({ phase: 'ready', value: { status: 'ok', posts: [post] } });
		expect(holdRequest(ready, load)).toBe(ready);
		expect(load).toHaveBeenCalledTimes(1);
	});

	it('tries again after a failed response and keeps an unconfigured catalog', async () => {
		const fetchImpl = vi.fn(async () => new Response('nope', { status: 503 }));
		const pending = holdRequest({ phase: 'empty' }, () => loadCodexLibrary(fetchImpl));
		if (pending.phase !== 'pending') throw new Error('expected a request');
		const failed = await pending.request;
		expect(failed).toEqual({ phase: 'failed' });
		expect(fetchImpl).toHaveBeenCalledTimes(1);

		fetchImpl.mockResolvedValueOnce(Response.json({ status: 'unconfigured', posts: [] }));
		const retry = holdRequest(failed, () => loadCodexLibrary(fetchImpl));
		if (retry.phase !== 'pending') throw new Error('expected a retry');
		expect(await retry.request).toEqual({
			phase: 'ready',
			value: { status: 'unconfigured', posts: [] }
		});
		expect(fetchImpl).toHaveBeenCalledTimes(2);
	});

	it('treats a stalled catalog body as unavailable so the next command can retry', async () => {
		vi.useFakeTimers();
		try {
			let stalled = true;
			const fetchImpl = vi.fn(async () => {
				if (!stalled) return Response.json({ status: 'ok', posts: [post] });
				return new Response(
					new ReadableStream({
						start() {
							/* headers arrived; the body never finishes */
						}
					}),
					{ status: 200, headers: { 'content-type': 'application/json' } }
				);
			});
			const pending = holdRequest({ phase: 'empty' }, () => loadCodexLibrary(fetchImpl));
			if (pending.phase !== 'pending') throw new Error('expected a request');
			let settled = false;
			const result = pending.request.then((value) => {
				settled = true;
				return value;
			});
			await vi.advanceTimersByTimeAsync(CODEX_LIBRARY_DEADLINE_MS - 1);
			expect(settled).toBe(false);
			await vi.advanceTimersByTimeAsync(1);
			expect(await result).toEqual({ phase: 'failed' });

			stalled = false;
			const retry = holdRequest({ phase: 'failed' }, () => loadCodexLibrary(fetchImpl));
			if (retry.phase !== 'pending') throw new Error('expected a retry');
			expect(await retry.request).toEqual({
				phase: 'ready',
				value: { status: 'ok', posts: [post] }
			});
		} finally {
			vi.useRealTimers();
		}
	});

	it('reads a published catalog and rejects a body that is not JSON', async () => {
		const fetchImpl = vi.fn(async () => Response.json({ status: 'ok', posts: [post] }));
		expect(await loadCodexLibrary(fetchImpl)).toEqual({ status: 'ok', posts: [post] });
		fetchImpl.mockRejectedValueOnce(new Error('offline'));
		expect(await loadCodexLibrary(fetchImpl)).toBeNull();
	});
});
