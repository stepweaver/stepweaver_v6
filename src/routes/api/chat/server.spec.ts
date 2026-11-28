import { afterEach, describe, expect, it } from 'vitest';
import {
	LAMBDA_BUDGET_UNAVAILABLE_MESSAGE,
	LAMBDA_DAILY_LIMIT_MESSAGE,
	LAMBDA_PROVIDER_FAILURE_MESSAGE,
	LAMBDA_TURNED_OFF_MESSAGE,
	type ReservationResponse
} from '$lib/server/lambda/budget';
import { POST } from './+server';

const originalFetch = globalThis.fetch;

const previous = {
	groq: process.env.GROQ_API_KEY,
	openai: process.env.OPENAI_API_KEY,
	chat: process.env.LAMBDA_CHAT,
	writing: process.env.WRITING_SOURCE
};

afterEach(() => {
	restore('GROQ_API_KEY', previous.groq);
	restore('OPENAI_API_KEY', previous.openai);
	restore('LAMBDA_CHAT', previous.chat);
	restore('WRITING_SOURCE', previous.writing);
	globalThis.fetch = originalFetch;
});

describe('POST /api/chat', () => {
	it('keeps the per-IP rejection ahead of the daily budget', async () => {
		const response = await post({
			groqKey: 'groq-test-key',
			limit: 429,
			budget: () => {
				throw new Error('should not reserve');
			},
			fetchImpl: async () => {
				throw new Error('should not fetch');
			}
		});
		expect(response.status).toBe(429);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(response.headers.get('retry-after')).toBe('60');
		expect(await response.json()).toEqual({ error: 'Too many messages. Try again in a minute.' });
	});

	it('answers from the public brief when both keys are absent, including with the switch off', async () => {
		const response = await post({
			groqKey: '',
			openaiKey: '',
			lambdaChat: 'off',
			budget: () => {
				throw new Error('should not reserve');
			},
			fetchImpl: async () => {
				throw new Error('should not fetch');
			}
		});
		expect(response.status).toBe(200);
		expect(response.headers.get('cache-control')).toBe('no-store');
		const body = (await response.json()) as { message: string };
		expect(body.message).toContain('not configured');
	});

	it('returns 503 without a reservation when the switch is off', async () => {
		const response = await post({
			groqKey: 'groq-test-key',
			lambdaChat: 'off',
			budget: () => {
				throw new Error('should not reserve');
			},
			fetchImpl: async () => {
				throw new Error('should not fetch');
			}
		});
		expect(response.status).toBe(503);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(response.headers.get('retry-after')).toBeNull();
		expect(await response.json()).toEqual({ error: LAMBDA_TURNED_OFF_MESSAGE });
	});

	it('returns 503 when the daily counter binding is missing', async () => {
		const response = await post({
			groqKey: 'groq-test-key',
			binding: false,
			fetchImpl: async () => {
				throw new Error('should not fetch');
			}
		});
		expect(response.status).toBe(503);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(await response.json()).toEqual({ error: LAMBDA_BUDGET_UNAVAILABLE_MESSAGE });
	});

	it('returns 429 with Retry-After until the reset time when the cap is exhausted', async () => {
		const resetAt = Date.now() + 120_000;
		const response = await post({
			groqKey: 'groq-test-key',
			openaiKey: 'openai-test-key',
			budget: async () => ({ granted: false, resetAt }),
			fetchImpl: async () => {
				throw new Error('should not fetch');
			}
		});
		expect(response.status).toBe(429);
		expect(response.headers.get('cache-control')).toBe('no-store');
		const retryAfter = Number(response.headers.get('retry-after'));
		expect(retryAfter).toBeGreaterThanOrEqual(119);
		expect(retryAfter).toBeLessThanOrEqual(120);
		expect(await response.json()).toEqual({ error: LAMBDA_DAILY_LIMIT_MESSAGE });
	});

	it('returns the mocked Groq reply and keeps no-store', async () => {
		let reserved = 0;
		const providers: string[] = [];
		const response = await post({
			groqKey: 'groq-test-key',
			openaiKey: 'openai-test-key',
			budget: async () => {
				reserved += 1;
				return { granted: true };
			},
			fetchImpl: async (url) => {
				providers.push(new URL(String(url)).hostname);
				return Response.json({ choices: [{ message: { content: 'Mocked Groq reply.' } }] });
			}
		});
		expect(response.status).toBe(200);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(reserved).toBe(1);
		expect(providers).toEqual(['api.groq.com']);
		expect(await response.json()).toEqual({ message: 'Mocked Groq reply.' });
	});

	it('preserves the upstream failure when the mocked provider fails', async () => {
		const response = await post({
			groqKey: 'groq-test-key',
			budget: async () => ({ granted: true }),
			fetchImpl: async () => new Response('no', { status: 500 })
		});
		expect(response.status).toBe(502);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(await response.json()).toEqual({ error: LAMBDA_PROVIDER_FAILURE_MESSAGE });
	});
});

function restore(key: string, value: string | undefined) {
	if (value === undefined) delete process.env[key];
	else process.env[key] = value;
}

function post(input: {
	groqKey?: string;
	openaiKey?: string;
	lambdaChat?: string;
	limit?: 200 | 429;
	binding?: boolean;
	budget?: () => Promise<ReservationResponse> | ReservationResponse;
	fetchImpl: typeof fetch;
}) {
	process.env.WRITING_SOURCE = 'fixture';
	process.env.GROQ_API_KEY = input.groqKey ?? '';
	process.env.OPENAI_API_KEY = input.openaiKey ?? '';
	process.env.LAMBDA_CHAT = input.lambdaChat ?? '';
	globalThis.fetch = input.fetchImpl;
	const request = new Request('https://stepweaver.dev/api/chat', {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			origin: 'https://stepweaver.dev'
		},
		body: JSON.stringify({
			channel: 'widget',
			messages: [{ role: 'user', content: 'Hello from the test' }]
		})
	});
	const env: Record<string, unknown> = {
		WRITING_SOURCE: 'fixture',
		GROQ_API_KEY: input.groqKey ?? '',
		OPENAI_API_KEY: input.openaiKey ?? '',
		LAMBDA_CHAT: input.lambdaChat ?? '',
		CHAT_RATE_LIMITER: {
			limit: async () => ({ success: (input.limit ?? 200) === 200 })
		}
	};
	if (input.binding !== false && input.budget) {
		env.LAMBDA_DAILY_BUDGET = {
			getByName: () => ({ reserve: input.budget })
		};
	}
	return POST({
		request,
		platform: { env },
		getClientAddress: () => '203.0.113.10'
	} as never);
}
