import { dev } from '$app/environment';
import { json } from '@sveltejs/kit';
import { publicApiLimit } from '$lib/server/security/public-api';
import { readServerEnv } from '$lib/server/env';
import { lookupWeatherFixture, weatherFixtureEnabled } from '$lib/server/weather/fixture';
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
	const query = event.url.searchParams.get('q') ?? '';
	const lat = event.url.searchParams.get('lat');
	const lon = event.url.searchParams.get('lon');
	const forecast = event.url.searchParams.get('forecast') === 'true';
	const result = weatherFixtureEnabled(dev, readServerEnv(event.platform, 'WEATHER_SOURCE'))
		? lookupWeatherFixture({ query, lat, lon, forecast })
		: await lookupWeather({
				apiKey: readServerEnv(event.platform, 'OPENWEATHER_API_KEY'),
				query,
				lat,
				lon,
				forecast
			});
	if (!result.ok) return json({ error: result.error }, { status: result.status, headers: HEADERS });
	if ('choices' in result) {
		return json({ needSelection: true, options: result.choices }, { headers: HEADERS });
	}
	return json(result.report, { headers: HEADERS });
};
