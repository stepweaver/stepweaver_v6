import { json } from '@sveltejs/kit';
import { allowMemoryRateLimit } from '$lib/server/contact/rate-limit';
import { readServerEnv } from '$lib/server/env';
import { lookupWeather } from '$lib/server/weather/lookup';
import type { RequestHandler } from './$types';

const HEADERS = { 'cache-control': 'no-store' };

export const GET: RequestHandler = async (event) => {
	let address: string;
	try {
		address = event.getClientAddress();
	} catch {
		address = 'unknown';
	}
	if (!allowMemoryRateLimit(`weather:${address}`, 30, 60_000, Date.now())) {
		return json({ error: 'Rate limit exceeded' }, { status: 429, headers: HEADERS });
	}
	const result = await lookupWeather({
		apiKey: readServerEnv(event.platform, 'OPENWEATHER_API_KEY'),
		query: event.url.searchParams.get('q') ?? '',
		lat: event.url.searchParams.get('lat'),
		lon: event.url.searchParams.get('lon'),
		forecast: event.url.searchParams.get('forecast') === 'true'
	});
	if (!result.ok) return json({ error: result.error }, { status: result.status, headers: HEADERS });
	if ('choices' in result) {
		return json({ needSelection: true, options: result.choices }, { headers: HEADERS });
	}
	return json(result.report, { headers: HEADERS });
};
