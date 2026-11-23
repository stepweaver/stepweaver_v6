import { dev } from '$app/environment';
import type { RequestEvent } from '@sveltejs/kit';
import { allowMemoryRateLimit } from '$lib/server/contact/rate-limit';

export async function publicApiLimit(
	event: RequestEvent,
	route: 'chat' | 'weather'
): Promise<200 | 429 | 503> {
	try {
		const key = event.getClientAddress();
		const env = event.platform?.env;
		const binding = route === 'chat' ? env?.CHAT_RATE_LIMITER : env?.WEATHER_RATE_LIMITER;
		if (binding) return (await binding.limit({ key })).success ? 200 : 429;
		if (dev) {
			return allowMemoryRateLimit(`${route}:${key}`, route === 'chat' ? 20 : 30, 60_000, Date.now())
				? 200
				: 429;
		}
	} catch {
		return 503;
	}
	return 503;
}
