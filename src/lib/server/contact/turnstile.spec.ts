import { describe, expect, it } from 'vitest';
import { turnstileHostnames, verifyTurnstileToken } from './turnstile';

function siteverify(body: Record<string, unknown>, ok = true): typeof fetch {
	return async () =>
		new Response(JSON.stringify(body), {
			status: ok ? 200 : 500,
			headers: { 'content-type': 'application/json' }
		});
}

const expected = { hostnames: ['stepweaver.dev', 'www.stepweaver.dev'], action: 'contact' };

describe('turnstile verification', () => {
	it('accepts the apex and www hosts for one contact action', () => {
		expect(turnstileHostnames('www.stepweaver.dev', false)).toEqual([
			'www.stepweaver.dev',
			'stepweaver.dev'
		]);
		expect(turnstileHostnames('preview.example.workers.dev', false)).toEqual([
			'preview.example.workers.dev'
		]);
		expect(turnstileHostnames('localhost', true)).toEqual(['localhost', '127.0.0.1']);
	});

	it('requires a successful token for this host and the contact action', async () => {
		const passed = await verifyTurnstileToken(
			'token',
			'203.0.113.8',
			'secret',
			expected,
			siteverify({ success: true, hostname: 'WWW.STEPWEAVER.DEV', action: 'contact' })
		);
		expect(passed).toBe(true);

		const wrongHost = await verifyTurnstileToken(
			'token',
			'203.0.113.8',
			'secret',
			expected,
			siteverify({ success: true, hostname: 'evil.example', action: 'contact' })
		);
		expect(wrongHost).toBe(false);

		const wrongAction = await verifyTurnstileToken(
			'token',
			'203.0.113.8',
			'secret',
			expected,
			siteverify({ success: true, hostname: 'stepweaver.dev', action: 'login' })
		);
		expect(wrongAction).toBe(false);

		const missingAction = await verifyTurnstileToken(
			'token',
			'203.0.113.8',
			'secret',
			expected,
			siteverify({ success: true, hostname: 'stepweaver.dev' })
		);
		expect(missingAction).toBe(false);

		const documentedTestPayload = await verifyTurnstileToken(
			'XXXX.DUMMY.TOKEN.XXXX',
			'127.0.0.1',
			'1x0000000000000000000000000000000AA',
			{ hostnames: ['localhost', '127.0.0.1'], action: 'contact' },
			siteverify({ success: true, hostname: 'example.com', 'error-codes': [] })
		);
		expect(documentedTestPayload).toBe(false);
	});
});
