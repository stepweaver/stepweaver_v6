import { fail } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { readServerEnv } from '$lib/server/env';
import { submitContact } from '$lib/server/contact/submit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async (event) => {
		let clientAddress: string;
		try {
			clientAddress = event.getClientAddress();
		} catch {
			clientAddress = 'unknown';
		}
		const platformEnv = event.platform?.env as
			| {
					CONTACT_RATE_LIMITER?: { limit(options: { key: string }): Promise<{ success: boolean }> };
			  }
			| undefined;
		const result = await submitContact({
			request: event.request,
			clientAddress,
			dev,
			env: {
				turnstileSecret: readServerEnv(event.platform, 'TURNSTILE_SECRET_KEY'),
				resendKey: readServerEnv(event.platform, 'RESEND_API_KEY'),
				from: readServerEnv(event.platform, 'CONTACT_FROM_EMAIL'),
				to: readServerEnv(event.platform, 'CONTACT_TO_EMAIL'),
				adapter: readServerEnv(event.platform, 'CONTACT_EMAIL_ADAPTER')
			},
			rateLimiter: platformEnv?.CONTACT_RATE_LIMITER ?? null
		});
		if (!result.ok) return fail(result.status, result.body);
		return result.body;
	}
};
