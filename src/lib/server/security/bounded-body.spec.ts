import { describe, expect, it } from 'vitest';
import { BodyTimeoutError, readBoundedBody, readBoundedJson } from './bounded-body';

describe('bounded JSON', () => {
	it('counts UTF-8 bytes when Content-Length is absent', async () => {
		const request = new Request('https://stepweaver.dev/api/chat', {
			method: 'POST',
			body: '"λλ"'
		});
		expect(request.headers.has('content-length')).toBe(false);
		await expect(readBoundedJson(request, 5)).rejects.toThrow(RangeError);
	});

	it('stops reading when the body stalls', async () => {
		const request = new Request('https://stepweaver.dev/api/chat', {
			method: 'POST',
			body: new ReadableStream({
				pull() {
					return new Promise(() => {});
				}
			}),
			duplex: 'half'
		} as RequestInit);
		await expect(readBoundedBody(request, 100, 20)).rejects.toBeInstanceOf(BodyTimeoutError);
	});

	it('accepts JSON exactly at the byte limit', async () => {
		const request = new Request('https://stepweaver.dev/api/chat', {
			method: 'POST',
			body: '"λλ"'
		});
		await expect(readBoundedJson(request, 6)).resolves.toBe('λλ');
	});
});
