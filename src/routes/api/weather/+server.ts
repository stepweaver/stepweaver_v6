import { json } from '@sveltejs/kit';
import { publicApiLimit } from '$lib/server/security/public-api';
import { readServerEnv } from '$lib/server/env';
import { lookupWeather } from '$lib/server/weather/lookup';
import type { RequestHandler } from './$types';

const HEADERS = { 'cache-control': 'no-store' };

export const GET: RequestHandler = async (event) => {
	const limit = await publicApiLimit(event, 'weather');
	if (limit !== 200) {
		return json(
			{ error: limit === 429 ? 'Rate limit exceeded' : 'Weather is temporarily unavailable.' },
			{ status: limit, headers: limit === 429 ? { ...HEADERS, 'retry-after': '60' } : HEADERS }
		);
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
