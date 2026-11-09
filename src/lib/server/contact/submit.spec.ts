import { beforeEach, describe, expect, it } from 'vitest';
import { createMockMailer } from './mail';
import { clearMemoryRateLimit } from './rate-limit';
import { submitContact, type ContactEnv } from './submit';

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
}) {
	return submitContact({
		request: request(overrides.fields ?? fields(), overrides.headers),
		clientAddress: overrides.ip ?? '203.0.113.10',
		dev: overrides.dev ?? true,
		env: overrides.env ?? env,
		now: overrides.now ?? 10_000,
		rateLimiter: overrides.rateLimiter,
		mailer: overrides.mailer,
		verifyTurnstile: overrides.verify ?? (async () => true)
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

	it('fails closed in production when the rate limiter and email provider are missing', async () => {
		const missingLimit = await submit({
			dev: false,
			env: { turnstileSecret: 'secret', resendKey: 're_test', from: 'stephen@stepweaver.dev' }
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

	it('sends through Resend only when the provider accepts the message', async () => {
		const calls: string[] = [];
		const original = globalThis.fetch;
		globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
			calls.push(String(url));
			expect(init?.headers).toMatchObject({ Authorization: 'Bearer re_test' });
			return new Response('{}', { status: 200 });
		}) as typeof fetch;
		try {
			const sent = await submit({
				dev: false,
				env: {
					turnstileSecret: 'secret',
					resendKey: 're_test',
					from: 'Stephen Weaver <stephen@stepweaver.dev>',
					to: 'stephen@stepweaver.dev'
				},
				rateLimiter: { limit: async () => ({ success: true }) }
			});
			expect(sent.body.success).toBe(true);
			expect(calls[0]).toBe('https://api.resend.com/emails');

			globalThis.fetch = (async () => new Response('no', { status: 422 })) as typeof fetch;
			const failed = await submit({
				dev: false,
				env: {
					turnstileSecret: 'secret',
					resendKey: 're_test',
					from: 'stephen@stepweaver.dev'
				},
				rateLimiter: { limit: async () => ({ success: true }) },
				ip: '203.0.113.11'
			});
			expect(failed.body.success).toBe(false);
			expect(failed.status).toBe(502);
		} finally {
			globalThis.fetch = original;
		}
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
