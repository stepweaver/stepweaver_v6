import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockMailer } from './mail';
import { clearMemoryRateLimit } from './rate-limit';
import { submitContact, type ContactEnv } from './submit';
import { TURNSTILE_TEST_PASS_SECRET, TURNSTILE_TEST_PASS_TOKEN } from './turnstile';

const env: ContactEnv = {
	turnstileSecret: 'secret',
	adapter: 'mock'
};

function request(fields: Record<string, string>, headers: Record<string, string> = {}): Request {
	const body = new URLSearchParams(fields);
	return new Request('http://localhost:4173/contact', {
		method: 'POST',
		headers: {
			'content-type': 'application/x-www-form-urlencoded',
			origin: 'http://localhost:4173',
			...headers
		},
		body
	});
}

function fields(overrides: Record<string, string> = {}): Record<string, string> {
	return {
		name: 'Ada Lovelace',
		email: 'ada@example.com',
		message: 'The handoff between intake and scheduling is dropping work.',
		intent: 'consult',
		company_website: '',
		opened_at: '1000',
		cf_turnstile_response: 'token',
		...overrides
	};
}

async function submit(overrides: {
	fields?: Record<string, string>;
	dev?: boolean;
	env?: ContactEnv;
	now?: number;
	ip?: string;
	mailer?: ReturnType<typeof createMockMailer>;
	verify?: (token: string, ip: string, secret: string) => Promise<boolean>;
	rateLimiter?: { limit: () => Promise<{ success: boolean }> } | null;
	headers?: Record<string, string>;
	realVerifier?: boolean;
}) {
	return submitContact({
		request: request(overrides.fields ?? fields(), overrides.headers),
		clientAddress: overrides.ip ?? '203.0.113.10',
		dev: overrides.dev ?? true,
		env: overrides.env ?? env,
		now: overrides.now ?? 10_000,
		rateLimiter: overrides.rateLimiter,
		mailer: overrides.mailer,
		...(overrides.realVerifier ? {} : { verifyTurnstile: overrides.verify ?? (async () => true) })
	});
}

describe('contact submission', () => {
	beforeEach(() => clearMemoryRateLimit());

	it('rejects an invalid email and does not send', async () => {
		const mailer = createMockMailer();
		const result = await submit({ fields: fields({ email: 'not-an-email' }), mailer });
		expect(result.ok).toBe(false);
		expect(result.status).toBe(400);
		expect(result.body.success).toBe(false);
		expect(result.body.fieldErrors.email).toBeTruthy();
		expect(mailer.sent).toHaveLength(0);
	});

	it('rejects a filled honeypot without reporting success', async () => {
		const mailer = createMockMailer();
		const result = await submit({
			fields: fields({ company_website: 'https://spam.example' }),
			mailer
		});
		expect(result.body.success).toBe(false);
		expect(result.body.message).toBe('The message was not sent.');
		expect(mailer.sent).toHaveLength(0);
	});

	it('rejects a submission that arrives too quickly', async () => {
		const mailer = createMockMailer();
		const result = await submit({ fields: fields({ opened_at: '9900' }), now: 10_000, mailer });
		expect(result.body.success).toBe(false);
		expect(mailer.sent).toHaveLength(0);
	});

	it('fails closed when the bot check is not configured', async () => {
		const mailer = createMockMailer();
		const result = await submit({ env: { adapter: 'mock' }, mailer });
		expect(result.status).toBe(503);
		expect(result.body.success).toBe(false);
		expect(result.body.message).toContain('bot check');
		expect(mailer.sent).toHaveLength(0);
	});

	it('accepts the documented dummy token in development without calling siteverify', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		try {
			const mailer = createMockMailer();
			const result = await submit({
				realVerifier: true,
				dev: true,
				env: { turnstileSecret: TURNSTILE_TEST_PASS_SECRET, adapter: 'mock' },
				mailer,
				fields: fields({ cf_turnstile_response: TURNSTILE_TEST_PASS_TOKEN })
			});
			expect(result.ok).toBe(true);
			expect(result.body.message).toBe('Your message was sent. I will read it and reply.');
			expect(mailer.sent).toHaveLength(1);
			expect(fetchMock).not.toHaveBeenCalled();
		} finally {
			vi.unstubAllGlobals();
		}
	});

	it('rejects the documented test siteverify payload outside development', async () => {
		const fetchMock = vi.fn(
			async () =>
				new Response(
					JSON.stringify({ success: true, hostname: 'example.com', 'error-codes': [] }),
					{ status: 200, headers: { 'content-type': 'application/json' } }
				)
		);
		vi.stubGlobal('fetch', fetchMock);
		try {
			const send = vi.fn();
			const result = await submit({
				realVerifier: true,
				dev: false,
				env: {
					turnstileSecret: TURNSTILE_TEST_PASS_SECRET,
					email: { send },
					from: 'contact@stepweaver.dev',
					to: 'inbox@example.com'
				},
				rateLimiter: { limit: async () => ({ success: true }) },
				fields: fields({ cf_turnstile_response: TURNSTILE_TEST_PASS_TOKEN })
			});
			expect(result.ok).toBe(false);
			expect(result.status).toBe(403);
			expect(result.body.message).toBe('The bot check did not pass. Try again.');
			expect(send).not.toHaveBeenCalled();
			expect(fetchMock).toHaveBeenCalledOnce();
		} finally {
			vi.unstubAllGlobals();
		}
	});

	it('does not treat an arbitrary token as the development fixture', async () => {
		const fetchMock = vi.fn(
			async () =>
				new Response(
					JSON.stringify({ success: false, 'error-codes': ['invalid-input-response'] }),
					{
						status: 200,
						headers: { 'content-type': 'application/json' }
					}
				)
		);
		vi.stubGlobal('fetch', fetchMock);
		try {
			const mailer = createMockMailer();
			const result = await submit({
				realVerifier: true,
				dev: true,
				env: { turnstileSecret: TURNSTILE_TEST_PASS_SECRET, adapter: 'mock' },
				mailer,
				fields: fields({ cf_turnstile_response: 'not-the-dummy-token' })
			});
			expect(result.status).toBe(403);
			expect(mailer.sent).toHaveLength(0);
			expect(fetchMock).toHaveBeenCalledOnce();
		} finally {
			vi.unstubAllGlobals();
		}
	});

	it('does not send when the bot check fails', async () => {
		const mailer = createMockMailer();
		const result = await submit({ mailer, verify: async () => false });
		expect(result.status).toBe(403);
		expect(result.body.success).toBe(false);
		expect(mailer.sent).toHaveLength(0);
	});

	it('reports success only after the mock mailer accepts the message', async () => {
		const mailer = createMockMailer();
		const result = await submit({ fields: fields({ intent: 'hire' }), mailer });
		expect(result.ok).toBe(true);
		expect(result.body.success).toBe(true);
		expect(result.body.message).toContain('Your message was sent');
		expect(mailer.sent).toHaveLength(1);
		expect(mailer.sent[0]?.subject).toContain('Hiring conversation');
		expect(mailer.sent[0]?.replyTo).toBe('ada@example.com');
	});

	it('does not report success when delivery fails', async () => {
		const mailer = createMockMailer();
		const result = await submit({
			fields: fields({ message: 'Please fail [[force-fail]]' }),
			mailer
		});
		expect(result.status).toBe(502);
		expect(result.body.success).toBe(false);
		expect(result.body.message).toContain('Nothing was delivered');
		expect(mailer.sent).toHaveLength(0);
	});

	it('fails closed in production without the rate limiter or a production mailer', async () => {
		const missingLimit = await submit({
			dev: false,
			env: { turnstileSecret: 'secret' }
		});
		expect(missingLimit.status).toBe(503);
		expect(missingLimit.body.success).toBe(false);
		expect(missingLimit.body.message).toContain('rate limiting');

		const mockInProduction = await submit({
			dev: false,
			env: { turnstileSecret: 'secret', adapter: 'mock' },
			rateLimiter: { limit: async () => ({ success: true }) }
		});
		expect(mockInProduction.status).toBe(503);
		expect(mockInProduction.body.message).toContain('cannot send mail');
		expect(mockInProduction.body.success).toBe(false);
	});

	it('sends through Cloudflare with the configured destination and visitor reply address', async () => {
		const send = vi.fn().mockResolvedValue({ messageId: 'test-message' });
		const contactEnv = {
			turnstileSecret: 'secret',
			email: { send },
			from: 'contact@stepweaver.dev',
			to: 'inbox@example.com'
		};
		const rateLimiter = { limit: async () => ({ success: true }) };
		const sent = await submit({ dev: false, env: contactEnv, rateLimiter });
		expect(sent.body.success).toBe(true);
		expect(send).toHaveBeenCalledExactlyOnceWith({
			from: 'contact@stepweaver.dev',
			to: 'inbox@example.com',
			replyTo: 'ada@example.com',
			subject: 'Consulting inquiry from Ada Lovelace',
			text: expect.stringContaining('The handoff between intake and scheduling'),
			html: expect.stringContaining('The handoff between intake and scheduling')
		});

		send.mockRejectedValueOnce(new Error('Cloudflare rejected the message'));
		const failed = await submit({ dev: false, env: contactEnv, rateLimiter });
		expect(failed.body.success).toBe(false);
		expect(failed.status).toBe(502);

		send.mockClear();
		const missingDestination = await submit({
			dev: false,
			env: { ...contactEnv, to: undefined },
			rateLimiter
		});
		expect(missingDestination.status).toBe(503);
		expect(send).not.toHaveBeenCalled();
	});

	it('rejects a limited client before validating the message', async () => {
		const result = await submit({
			dev: false,
			fields: fields({ email: 'not-an-email' }),
			rateLimiter: { limit: async () => ({ success: false }) }
		});
		expect(result.status).toBe(429);
		expect(result.body.fieldErrors.email).toBeUndefined();
	});

	it('rate limits repeated dev submissions', async () => {
		const mailer = createMockMailer();
		let last = await submit({ mailer, ip: '198.51.100.8', now: 10_000 });
		for (let i = 0; i < 4; i += 1) {
			last = await submit({ mailer, ip: '198.51.100.8', now: 10_000 + i });
		}
		expect(last.body.success).toBe(true);
		const blocked = await submit({ mailer, ip: '198.51.100.8', now: 10_500 });
		expect(blocked.status).toBe(429);
		expect(blocked.body.success).toBe(false);
	});
});
