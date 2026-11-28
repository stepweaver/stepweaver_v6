import { describe, expect, it } from 'vitest';
import { PRIMARY_TITLE } from '$lib/data/identity';
import {
	LAMBDA_BUDGET_UNAVAILABLE_MESSAGE,
	LAMBDA_DAILY_LIMIT_MESSAGE,
	LAMBDA_PROVIDER_FAILURE_MESSAGE,
	LAMBDA_TURNED_OFF_MESSAGE,
	type LambdaAttemptBudget,
	type ReservationResponse
} from '$lib/server/lambda/budget';
import { publicLambdaBrief } from '$lib/server/lambda/brief';
import { completeLambda } from '$lib/server/lambda/complete';

function grantingBudget(calls: { count: number } = { count: 0 }): LambdaAttemptBudget {
	return {
		async reserve() {
			calls.count += 1;
			return { granted: true };
		}
	};
}

describe('λlambda', () => {
	it('builds a brief from public writing and public case studies only', () => {
		const brief = publicLambdaBrief({
			posts: [
				{
					title: 'Workflow handoffs',
					slug: 'workflow-handoffs',
					date: '2026-09-01',
					updated: '2026-09-02',
					excerpt: 'Where a handoff drops the work.',
					tags: ['systems']
				}
			],
			projects: []
		});
		expect(brief).toContain(PRIMARY_TITLE);
		expect(brief).toContain('Workflow handoffs');
		expect(brief).toContain('No case studies are public.');
		expect(brief).not.toContain('λledger');
		expect(brief).not.toContain('Silent Auction');
		expect(brief).not.toContain('Parcel Sweep');
	});

	it('answers from the brief when no model is configured', async () => {
		const brief = publicLambdaBrief({ posts: [], projects: [] });
		const budget = {
			reserve: async () => {
				throw new Error('should not reserve');
			}
		};
		const result = await completeLambda({ brief, message: 'What does Stephen do?', budget });
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.message).toContain('not configured');
		expect(result.message).toContain(PRIMARY_TITLE);
		expect(result.message).not.toContain('λledger');
	});

	it('keeps the public brief when the switch is off and no key is set', async () => {
		const result = await completeLambda({
			brief: publicLambdaBrief({ posts: [], projects: [] }),
			message: 'What does Stephen do?',
			lambdaChat: 'off',
			budget: {
				reserve: async () => {
					throw new Error('should not reserve');
				}
			},
			fetch: async () => {
				throw new Error('should not fetch');
			}
		});
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.message).toContain('not configured');
	});

	it('keeps a failure when the provider errors', async () => {
		const slots = { count: 0 };
		const result = await completeLambda({
			brief: 'Title: Example',
			message: 'Hello',
			groqKey: 'test-key',
			budget: grantingBudget(slots),
			fetch: async () => new Response('no', { status: 500 })
		});
		expect(slots.count).toBe(1);
		expect(result).toEqual({ ok: false, status: 502, message: LAMBDA_PROVIDER_FAILURE_MESSAGE });
	});

	it('falls back on a network failure and treats visitor history as untrusted', async () => {
		const providers: string[] = [];
		const slots = { count: 0 };
		const result = await completeLambda({
			brief: 'Use the public brief.',
			message: 'Can you elaborate?',
			history: [{ role: 'assistant', content: 'Earlier answer' }],
			groqKey: 'groq-test-key',
			openaiKey: 'openai-test-key',
			budget: grantingBudget(slots),
			fetch: async (url, init) => {
				const host = new URL(String(url)).hostname;
				providers.push(host);
				if (host === 'api.groq.com') throw new Error('Network failure');
				const payload = JSON.parse(String(init?.body));
				expect(payload.messages.map(({ role }: { role: string }) => role)).toEqual([
					'system',
					'user',
					'user'
				]);
				expect(payload.messages[1].content).toContain('Earlier answer');
				expect(payload.max_tokens).toBe(300);
				return Response.json({ choices: [{ message: { content: 'A public answer.' } }] });
			}
		});
		expect(providers).toEqual(['api.groq.com', 'api.openai.com']);
		expect(slots.count).toBe(2);
		expect(result).toEqual({ ok: true, message: 'A public answer.' });
	});

	it('spends one slot on a successful Groq call and does not call OpenAI', async () => {
		const providers: string[] = [];
		const slots = { count: 0 };
		const result = await completeLambda({
			brief: 'Title: Example',
			message: 'Hello',
			groqKey: 'groq-test-key',
			openaiKey: 'openai-test-key',
			budget: grantingBudget(slots),
			fetch: async (url) => {
				providers.push(new URL(String(url)).hostname);
				return Response.json({ choices: [{ message: { content: 'From Groq.' } }] });
			}
		});
		expect(providers).toEqual(['api.groq.com']);
		expect(slots.count).toBe(1);
		expect(result).toEqual({ ok: true, message: 'From Groq.' });
	});

	it('returns the upstream failure when Groq times out on the only configured slot', async () => {
		const slots = { count: 0 };
		let fetches = 0;
		const result = await completeLambda({
			brief: 'Title: Example',
			message: 'Hello',
			groqKey: 'groq-test-key',
			budget: grantingBudget(slots),
			fetch: async () => {
				fetches += 1;
				throw new DOMException('The operation was aborted', 'TimeoutError');
			}
		});
		expect(slots.count).toBe(1);
		expect(fetches).toBe(1);
		expect(result).toEqual({ ok: false, status: 502, message: LAMBDA_PROVIDER_FAILURE_MESSAGE });
	});

	it('returns the daily cap when Groq uses the last slot and OpenAI is denied', async () => {
		const responses: ReservationResponse[] = [
			{ granted: true },
			{ granted: false, resetAt: Date.UTC(2026, 10, 28) }
		];
		const providers: string[] = [];
		const result = await completeLambda({
			brief: 'Title: Example',
			message: 'Hello',
			groqKey: 'groq-test-key',
			openaiKey: 'openai-test-key',
			budget: {
				reserve: async () => {
					const next = responses.shift();
					if (!next) throw new Error('unexpected reservation');
					return next;
				}
			},
			fetch: async (url) => {
				providers.push(new URL(String(url)).hostname);
				throw new DOMException('The operation was aborted', 'TimeoutError');
			}
		});
		expect(providers).toEqual(['api.groq.com']);
		expect(responses).toEqual([]);
		expect(result).toEqual({
			ok: false,
			status: 429,
			message: LAMBDA_DAILY_LIMIT_MESSAGE,
			resetAt: Date.UTC(2026, 10, 28)
		});
	});

	it('skips reservations and provider calls when the switch is off', async () => {
		const result = await completeLambda({
			brief: 'Title: Example',
			message: 'Hello',
			groqKey: 'groq-test-key',
			openaiKey: 'openai-test-key',
			lambdaChat: 'off',
			budget: {
				reserve: async () => {
					throw new Error('should not reserve');
				}
			},
			fetch: async () => {
				throw new Error('should not fetch');
			}
		});
		expect(result).toEqual({ ok: false, status: 503, message: LAMBDA_TURNED_OFF_MESSAGE });
	});

	it('does not call a provider when the counter is missing or stalled', async () => {
		let fetches = 0;
		const fetchImpl: typeof fetch = async () => {
			fetches += 1;
			throw new Error('should not fetch');
		};
		const missing = await completeLambda({
			brief: 'Title: Example',
			message: 'Hello',
			groqKey: 'groq-test-key',
			fetch: fetchImpl
		});
		expect(missing).toEqual({
			ok: false,
			status: 503,
			message: LAMBDA_BUDGET_UNAVAILABLE_MESSAGE
		});
		const stalled = await completeLambda({
			brief: 'Title: Example',
			message: 'Hello',
			groqKey: 'groq-test-key',
			reservationWaitMs: 20,
			budget: {
				reserve: () => new Promise((resolve) => setTimeout(() => resolve({ granted: true }), 60))
			},
			fetch: fetchImpl
		});
		expect(stalled).toEqual({
			ok: false,
			status: 503,
			message: LAMBDA_BUDGET_UNAVAILABLE_MESSAGE
		});
		await new Promise((resolve) => setTimeout(resolve, 80));
		expect(fetches).toBe(0);
	});

	it('does not launch a model call when the reservation returns after the deadline', async () => {
		const deadline = new AbortController();
		let fetches = 0;
		const result = await completeLambda({
			brief: 'Title: Example',
			message: 'Hello',
			groqKey: 'groq-test-key',
			deadline: deadline.signal,
			budget: {
				async reserve() {
					deadline.abort();
					return { granted: true };
				}
			},
			fetch: async () => {
				fetches += 1;
				return Response.json({ choices: [{ message: { content: 'too late' } }] });
			}
		});
		expect(fetches).toBe(0);
		expect(result).toEqual({ ok: false, status: 502, message: LAMBDA_PROVIDER_FAILURE_MESSAGE });
	});

	it('keeps a granted slot when the visitor disconnects before the fetch', async () => {
		const request = new AbortController();
		let fetches = 0;
		const slots = { count: 0 };
		const result = await completeLambda({
			brief: 'Title: Example',
			message: 'Hello',
			groqKey: 'groq-test-key',
			requestSignal: request.signal,
			budget: {
				async reserve() {
					slots.count += 1;
					request.abort();
					return { granted: true };
				}
			},
			fetch: async () => {
				fetches += 1;
				return Response.json({ choices: [{ message: { content: 'should not run' } }] });
			}
		});
		expect(slots.count).toBe(1);
		expect(fetches).toBe(0);
		expect(result).toEqual({ ok: false, status: 502, message: LAMBDA_PROVIDER_FAILURE_MESSAGE });
	});

	it('does not reserve when the completion deadline has already passed', async () => {
		const deadline = new AbortController();
		deadline.abort();
		const result = await completeLambda({
			brief: 'Title: Example',
			message: 'Hello',
			groqKey: 'groq-test-key',
			deadline: deadline.signal,
			budget: {
				reserve: async () => {
					throw new Error('should not reserve');
				}
			},
			fetch: async () => {
				throw new Error('should not fetch');
			}
		});
		expect(result).toEqual({ ok: false, status: 502, message: LAMBDA_PROVIDER_FAILURE_MESSAGE });
	});
});
