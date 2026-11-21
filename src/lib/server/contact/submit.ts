import { identity } from '$lib/data/identity';
import { createMockMailer, renderContactMail, sendWithResend, type Mailer } from './mail';
import { allowMemoryRateLimit, CONTACT_RATE_LIMIT, CONTACT_RATE_WINDOW_MS } from './rate-limit';
import { validateContactFields } from './schema';
import { verifyTurnstileToken } from './turnstile';

const MAX_BODY = 20_000;
const MIN_AGE_MS = 400;

export type ContactEnv = {
	turnstileSecret?: string;
	resendKey?: string;
	from?: string;
	to?: string;
	adapter?: string;
};

export type ContactBody = {
	success: boolean;
	message: string;
	fieldErrors: Partial<Record<'name' | 'email' | 'message' | 'intent', string>>;
	values: { name: string; email: string; message: string; intent: string };
};

export type ContactSubmission =
	{ ok: true; status: 200; body: ContactBody } | { ok: false; status: number; body: ContactBody };

type RateLimiter = {
	limit(options: { key: string }): Promise<{ success: boolean }>;
};

const sharedMock = createMockMailer();

function failure(
	status: number,
	message: string,
	values: ContactBody['values'],
	fieldErrors: ContactBody['fieldErrors'] = {}
): ContactSubmission {
	return { ok: false, status, body: { success: false, message, fieldErrors, values } };
}

function read(form: FormData, key: string): string {
	const value = form.get(key);
	return typeof value === 'string' ? value : '';
}

export function originAllowed(request: Request, dev: boolean): boolean {
	const origin = request.headers.get('origin');
	if (!origin) return dev;
	try {
		const originUrl = new URL(origin);
		const requestUrl = new URL(request.url);
		if (originUrl.host === requestUrl.host) return true;
		if (dev && (originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1')) {
			return true;
		}
	} catch {
		return false;
	}
	return false;
}

export async function submitContact(input: {
	request: Request;
	clientAddress: string;
	dev: boolean;
	env: ContactEnv;
	now?: number;
	rateLimiter?: RateLimiter | null;
	mailer?: Mailer;
	verifyTurnstile?: (token: string, ip: string, secret: string) => Promise<boolean>;
}): Promise<ContactSubmission> {
	const now = input.now ?? Date.now();
	const length = Number(input.request.headers.get('content-length') ?? '0');
	if (Number.isFinite(length) && length > MAX_BODY) {
		return failure(413, 'The message is too large.', emptyValues());
	}
	if (!originAllowed(input.request, input.dev)) {
		return failure(403, 'The message was not sent.', emptyValues());
	}

	let form: FormData;
	try {
		form = await input.request.formData();
	} catch {
		return failure(400, 'The message was not sent.', emptyValues());
	}

	const values = {
		name: read(form, 'name'),
		email: read(form, 'email'),
		message: read(form, 'message'),
		intent: read(form, 'intent')
	};
	const size = Object.values(values).reduce((total, value) => total + value.length, 0);
	if (size > MAX_BODY) return failure(413, 'The message is too large.', values);

	const limitStatus = await rateLimited(input, now);
	if (limitStatus === 429) {
		return failure(429, 'Too many messages from this network. Try again in a minute.', values);
	}
	if (limitStatus === 503) {
		return failure(
			503,
			'The contact form is not available because rate limiting is not configured.',
			values
		);
	}

	const parsed = validateContactFields(values);
	if (!parsed.value) {
		return failure(400, 'Check the highlighted fields.', values, parsed.fieldErrors);
	}

	if (read(form, 'company_website').trim()) {
		return failure(400, 'The message was not sent.', values);
	}

	const opened = Number(read(form, 'opened_at'));
	if (!Number.isFinite(opened) || opened <= 0 || opened > now + 5000 || now - opened < MIN_AGE_MS) {
		return failure(400, 'The message was not sent.', values);
	}

	const secret = input.env.turnstileSecret?.trim();
	if (!secret) {
		return failure(
			503,
			'The contact form is not available because the bot check is not configured.',
			values
		);
	}
	const token = read(form, 'cf_turnstile_response').trim();
	if (!token) return failure(403, 'The bot check did not pass. Try again.', values);
	const verify = input.verifyTurnstile ?? verifyTurnstileToken;
	const passed = await verify(token, input.clientAddress || 'unknown', secret);
	if (!passed) return failure(403, 'The bot check did not pass. Try again.', values);

	const mailer = input.mailer ?? resolveMailer(input.dev, input.env);
	if (!mailer) {
		return failure(
			503,
			`The contact form cannot send mail until the email provider is configured. Write to ${identity.email}.`,
			values
		);
	}

	const content = renderContactMail(parsed.value);
	try {
		await mailer.send({
			from: input.env.from?.trim() || 'mock@stepweaver.dev',
			to: input.env.to?.trim() || identity.email,
			replyTo: parsed.value.email,
			...content
		});
	} catch {
		return failure(502, 'The message was not sent. Nothing was delivered.', values);
	}

	return {
		ok: true,
		status: 200,
		body: {
			success: true,
			message: 'Your message was sent. I will read it and reply.',
			fieldErrors: {},
			values: { name: '', email: '', message: '', intent: parsed.value.intent }
		}
	};
}

function emptyValues(): ContactBody['values'] {
	return { name: '', email: '', message: '', intent: 'consult' };
}

async function rateLimited(
	input: { dev: boolean; clientAddress: string; rateLimiter?: RateLimiter | null },
	now: number
): Promise<429 | 503 | null> {
	const key = `contact:${input.clientAddress || 'unknown'}`;
	if (input.rateLimiter) {
		try {
			const outcome = await input.rateLimiter.limit({ key });
			return outcome.success ? null : 429;
		} catch {
			return 503;
		}
	}
	if (!input.dev) return 503;
	return allowMemoryRateLimit(key, CONTACT_RATE_LIMIT, CONTACT_RATE_WINDOW_MS, now) ? null : 429;
}

function resolveMailer(dev: boolean, env: ContactEnv): Mailer | null {
	if (env.adapter?.trim().toLowerCase() === 'mock') {
		if (!dev) return null;
		return sharedMock;
	}
	const key = env.resendKey?.trim();
	const from = env.from?.trim();
	if (!key || !from) return null;
	return {
		async send(mail) {
			await sendWithResend(key, { ...mail, from });
		}
	};
}
