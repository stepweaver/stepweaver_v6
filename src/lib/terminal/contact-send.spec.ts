import { createRequire } from 'node:module';
import { isActionFailure } from '@sveltejs/kit';
import { beforeAll, beforeEach, afterAll, describe, expect, it } from 'vitest';
import { actions } from '../../routes/(marketing)/contact/+page.server';
import { createMockMailer } from '$lib/server/contact/mail';
import { clearMemoryRateLimit } from '$lib/server/contact/rate-limit';
import { submitContact } from '$lib/server/contact/submit';
import {
	TURNSTILE_TEST_PASS_SECRET,
	TURNSTILE_TEST_PASS_TOKEN
} from '$lib/server/contact/turnstile';
import { advanceContact } from '$lib/terminal/contact-wizard';
import { performEffect } from '$lib/terminal/effects';
import type { ContactDraft } from '$lib/terminal/types';
// Unit tests call deserialize before the SvelteKit server assigns its decoders.
// @ts-expect-error Kit does not publish types for this server module.
import { set_app } from '../../../node_modules/@sveltejs/kit/src/runtime/server/app.js';

const { stringify } = createRequire(import.meta.resolve('@sveltejs/kit/package.json'))(
	'devalue'
) as {
	stringify: (value: unknown) => string;
};

const previousEnv = {
	adapter: process.env.CONTACT_EMAIL_ADAPTER,
	secret: process.env.TURNSTILE_SECRET_KEY
};

beforeAll(() => {
	set_app({ decoders: {} });
	process.env.CONTACT_EMAIL_ADAPTER = 'mock';
	process.env.TURNSTILE_SECRET_KEY = TURNSTILE_TEST_PASS_SECRET;
});

afterAll(() => {
	restore('CONTACT_EMAIL_ADAPTER', previousEnv.adapter);
	restore('TURNSTILE_SECRET_KEY', previousEnv.secret);
});

beforeEach(() => clearMemoryRateLimit());

function restore(key: string, value: string | undefined) {
	if (value === undefined) delete process.env[key];
	else process.env[key] = value;
}

function fields(overrides: Record<string, string> = {}): Record<string, string> {
	return {
		name: 'Ada Lovelace',
		email: 'ada@example.com',
		message: 'The handoff between intake and scheduling is dropping work.',
		intent: 'consult',
		company_website: '',
		opened_at: String(Date.now() - 2_000),
		cf_turnstile_response: TURNSTILE_TEST_PASS_TOKEN,
		...overrides
	};
}

function request(values: Record<string, string>): Request {
	return new Request('http://localhost:4173/contact', {
		method: 'POST',
		headers: {
			'content-type': 'application/x-www-form-urlencoded',
			origin: 'http://localhost:4173'
		},
		body: new URLSearchParams(values)
	});
}

function draft(message = fields().message): ContactDraft {
	return {
		step: 'confirm',
		name: 'Ada Lovelace',
		email: 'ada@example.com',
		intent: 'consult',
		message: message ?? '',
		openedAt: 1_000
	};
}

function actionJson(
	result: {
		type: string;
		status?: number;
		data?: unknown;
		location?: string;
		error?: unknown;
	},
	httpStatus = result.status ?? 200
): Response {
	const payload: Record<string, unknown> = { type: result.type };
	if (result.status !== undefined) payload.status = result.status;
	if ('data' in result) payload.data = stringify(result.data);
	if (result.location !== undefined) payload.location = result.location;
	if (result.error !== undefined) payload.error = result.error;
	return new Response(JSON.stringify(payload), {
		status: httpStatus,
		headers: { 'content-type': 'application/json' }
	});
}

async function postPage(values: Record<string, string>) {
	const action = actions.default;
	if (!action) throw new Error('The contact page has no default action.');
	return action({
		request: request(values),
		platform: undefined,
		getClientAddress: () => '203.0.113.77'
	} as never);
}

function actionBody(result: unknown): { success: boolean; message: string; status?: number } {
	if (isActionFailure(result)) {
		const data = result.data as unknown as { success?: unknown; message?: unknown } | undefined;
		return {
			success: data?.success === true,
			message: typeof data?.message === 'string' ? data.message : '',
			status: result.status
		};
	}
	const data = result as { success?: unknown; message?: unknown };
	return {
		success: data?.success === true,
		message: typeof data?.message === 'string' ? data.message : ''
	};
}

async function compared(overrides: Record<string, string> = {}) {
	const values = fields(overrides);
	const direct = await submitContact({
		request: request(values),
		clientAddress: '203.0.113.78',
		dev: true,
		env: { turnstileSecret: TURNSTILE_TEST_PASS_SECRET, adapter: 'mock' },
		now: Date.now(),
		mailer: createMockMailer()
	});
	const page = actionBody(await postPage(values));
	expect(page.message).toBe(direct.body.message);
	expect(page.success).toBe(direct.body.success);
	return { direct, page };
}

async function send(current: ContactDraft, response: Response | Error) {
	let init: RequestInit | undefined;
	const fetchImpl: typeof fetch = async (_input, next) => {
		init = next;
		if (response instanceof Error) throw response;
		return response;
	};
	const outcome = await performEffect(
		{ type: 'contact-send', draft: current },
		fetchImpl,
		async () => null,
		TURNSTILE_TEST_PASS_TOKEN
	);
	return {
		outcome,
		form: init?.body instanceof FormData ? init.body : undefined,
		headers: new Headers(init?.headers),
		redirect: init?.redirect
	};
}

describe('terminal contact action', () => {
	it('shows a serialized action success only when the contact payload says it was delivered', async () => {
		const { direct } = await compared();
		expect(direct.ok).toBe(true);
		expect(direct.body.message).toBe('Your message was sent. I will read it and reply.');

		const current = draft();
		const { outcome, form, headers, redirect } = await send(
			current,
			actionJson({ type: 'success', status: 200, data: direct.body }, 500)
		);
		expect(headers.get('accept')).toBe('application/json');
		expect(headers.get('x-sveltekit-action')).toBe('true');
		expect(redirect).toBe('manual');
		expect(form?.get('cf_turnstile_response')).toBe(TURNSTILE_TEST_PASS_TOKEN);
		expect(form?.get('company_website')).toBe('');
		expect(form?.get('email')).toBe(current.email);
		expect(outcome).toEqual({
			lines: [{ content: direct.body.message, variant: 'success' }],
			mode: 'shell',
			contact: null
		});
	});

	it('shows a serialized validation failure from the shared contact service', async () => {
		const { direct, page } = await compared({ email: 'not-an-email' });
		expect(direct.status).toBe(400);
		expect(page.status).toBe(400);
		expect(direct.body.message).toBe('Check the highlighted fields.');

		const current = draft();
		const { outcome } = await send(
			current,
			actionJson({ type: 'failure', status: 400, data: direct.body }, 200)
		);
		expect(outcome.mode).toBe('contact');
		expect(outcome.contact).toBe(current);
		expect(outcome.lines[0]).toEqual({ content: direct.body.message, variant: 'error' });
		expect(outcome.lines.some((line) => line.variant === 'success')).toBe(false);
	});

	it('shows a serialized provider delivery failure and keeps the draft', async () => {
		const { direct, page } = await compared({ message: 'Please fail [[force-fail]]' });
		expect(direct.status).toBe(502);
		expect(page.status).toBe(502);
		expect(direct.body.success).toBe(false);
		expect(direct.body.message).toContain('Nothing was delivered');

		const current = draft('Please fail [[force-fail]]');
		const { outcome } = await send(
			current,
			actionJson({ type: 'failure', status: 502, data: direct.body })
		);
		expect(outcome.contact).toBe(current);
		expect(outcome.mode).toBe('contact');
		expect(outcome.lines[0]?.content).toBe(direct.body.message);
	});

	it('keeps the draft when the response is malformed or not a delivered action', async () => {
		const current = draft();
		const malformed = await send(current, new Response('<html>lost</html>', { status: 200 }));
		expect(malformed.outcome.contact).toBe(current);
		expect(malformed.outcome.lines[0]?.content).toBe('The message was not sent.');

		const typedOnly = await send(
			current,
			actionJson({
				type: 'success',
				status: 200,
				data: { success: false, message: 'The message was not sent. Nothing was delivered.' }
			})
		);
		expect(typedOnly.outcome.mode).toBe('contact');
		expect(typedOnly.outcome.contact).toBe(current);
		expect(typedOnly.outcome.lines[0]).toEqual({
			content: 'The message was not sent. Nothing was delivered.',
			variant: 'error'
		});

		const plain = await send(
			current,
			new Response(
				JSON.stringify({
					type: 'success',
					status: 200,
					data: { success: true, message: 'Your message was sent. I will read it and reply.' }
				}),
				{ status: 200, headers: { 'content-type': 'application/json' } }
			)
		);
		expect(plain.outcome.contact).toBe(current);
		expect(plain.outcome.lines[0]?.content).toBe('The message was not sent.');

		const redirect = await send(
			current,
			actionJson({ type: 'redirect', status: 303, location: '/thanks' })
		);
		expect(redirect.outcome.contact).toBe(current);
		expect(redirect.outcome.lines.map((line) => line.content).join('\n')).not.toContain('/thanks');

		const error = await send(
			current,
			new Response(JSON.stringify({ type: 'error', error: { message: 'Internal Error' } }), {
				status: 500,
				headers: { 'content-type': 'application/json' }
			})
		);
		expect(error.outcome.contact).toBe(current);
		expect(error.outcome.lines[0]).toEqual({ content: 'Internal Error', variant: 'error' });
	});

	it('keeps the draft when the network fails', async () => {
		const current = draft();
		const { outcome } = await send(current, new TypeError('Failed to fetch'));
		expect(outcome).toEqual({
			lines: [
				{ content: 'The message was not sent.', variant: 'error' },
				{ content: 'The draft is still here. Type send, edit, or cancel.', variant: 'dimmed' }
			],
			mode: 'contact',
			contact: current
		});
	});

	it('keeps a failed draft editable, retryable, and cancellable', async () => {
		const { direct } = await compared({ email: 'not-an-email' });
		const current = draft();
		const { outcome } = await send(
			current,
			actionJson({ type: 'failure', status: 400, data: direct.body })
		);
		expect(outcome.contact).toBe(current);

		const edited = advanceContact(current, 'edit');
		expect(edited.draft).toBe(current);
		expect(edited.lines.map((line) => line.content).join('\n')).toContain('Ada Lovelace');
		expect(edited.lines.map((line) => line.content).join('\n')).toContain('ada@example.com');

		const retry = advanceContact(current, 'send');
		expect(retry.draft).toBe(current);
		expect(retry.effect).toEqual({ type: 'contact-send', draft: current });

		const cancelled = advanceContact(current, 'cancel');
		expect(cancelled.exit).toBe(true);
		expect(cancelled.draft).toBeNull();
	});
});
