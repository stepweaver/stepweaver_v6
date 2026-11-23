import type { ForecastSample, WeatherReport } from '$lib/weather/format';

export type WeatherChoice = { lat: number; lon: number; label: string };

export type WeatherLookup =
	| { ok: true; status: 200; report: WeatherReport }
	| { ok: true; status: 200; choices: WeatherChoice[] }
	| { ok: false; status: number; error: string };

type LookupInput = {
	apiKey?: string;
	query?: string;
	lat?: string | null;
	lon?: string | null;
	forecast?: boolean;
	fetch?: typeof fetch;
};

export async function lookupWeather(input: LookupInput): Promise<WeatherLookup> {
	const apiKey = input.apiKey?.trim();
	if (!apiKey) return { ok: false, status: 503, error: 'Weather is not configured.' };
	const forecast = input.forecast === true;
	const fetcher = input.fetch ?? fetch;
	const lat = input.lat?.trim() ? Number(input.lat) : null;
	const lon = input.lon?.trim() ? Number(input.lon) : null;
	try {
		if (lat !== null || lon !== null) {
			if (!validLatLon(lat, lon)) return { ok: false, status: 400, error: 'Invalid coordinates.' };
			const report = await reportAt(fetcher, apiKey, lat as number, lon as number, '', forecast);
			return { ok: true, status: 200, report };
		}
		const query = input.query?.trim() ?? '';
		if (!query) return { ok: false, status: 400, error: 'Missing a city or coordinates.' };
		if (query.length > 120) return { ok: false, status: 400, error: 'City name is too long.' };
		const found = await geocode(fetcher, apiKey, query);
		if (!found.length) return { ok: false, status: 404, error: 'Location not found.' };
		if (found.length > 1) return { ok: true, status: 200, choices: found };
		const city = found[0];
		if (!city) return { ok: false, status: 404, error: 'Location not found.' };
		const report = await reportAt(fetcher, apiKey, city.lat, city.lon, city.label, forecast);
		return { ok: true, status: 200, report };
	} catch (error) {
		console.error('Weather lookup failed', {
			errorType: error instanceof Error ? error.name : 'UnknownError'
		});
		return { ok: false, status: 502, error: 'Failed to fetch weather data.' };
	}
}

function validLatLon(lat: number | null, lon: number | null): boolean {
	return (
		lat !== null &&
		lon !== null &&
		Number.isFinite(lat) &&
		Number.isFinite(lon) &&
		lat >= -90 &&
		lat <= 90 &&
		lon >= -180 &&
		lon <= 180
	);
}

async function geocode(
	fetcher: typeof fetch,
	apiKey: string,
	query: string
): Promise<WeatherChoice[]> {
	const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${encodeURIComponent(apiKey)}`;
	const response = await fetcher(url, { signal: AbortSignal.timeout(5000), redirect: 'manual' });
	if (!response.ok) {
		console.error('Weather lookup failed', { status: response.status });
		throw new Error('geocode failed');
	}
	const data = (await response.json()) as {
		lat?: number;
		lon?: number;
		name?: string;
		state?: string;
		country?: string;
	}[];
	if (!Array.isArray(data)) return [];
	return data
		.filter((city) => Number.isFinite(city.lat) && Number.isFinite(city.lon))
		.map((city) => ({
			lat: city.lat as number,
			lon: city.lon as number,
			label: [city.name, city.state, city.country].filter(Boolean).join(', ')
		}));
}

async function reportAt(
	fetcher: typeof fetch,
	apiKey: string,
	lat: number,
	lon: number,
	label: string,
	forecast: boolean
): Promise<WeatherReport> {
	const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${encodeURIComponent(apiKey)}`;
	const currentResponse = await fetcher(currentUrl, {
		signal: AbortSignal.timeout(5000),
		redirect: 'manual'
	});
	if (!currentResponse.ok) throw new Error('weather failed');
	const current = (await currentResponse.json()) as {
		name?: string;
		timezone?: number;
		sys?: { country?: string };
		weather?: { description?: string }[];
		main?: { temp?: number; humidity?: number };
		wind?: { speed?: number };
	};
	const rawTemp = current.main?.temp;
	if (typeof rawTemp !== 'number' || !Number.isFinite(rawTemp)) {
		throw new Error('Current temperature is missing');
	}
	const tempF = Math.round(rawTemp);
	const place =
		label ||
		[current.name, current.sys?.country].filter(Boolean).join(', ') ||
		`${lat.toFixed(2)}, ${lon.toFixed(2)}`;
	const report: WeatherReport = {
		location: place,
		condition: current.weather?.[0]?.description || 'Unknown',
		tempF,
		tempC: Math.round(((tempF - 32) * 5) / 9),
		humidity: Math.round(current.main?.humidity ?? 0),
		windMph: Math.round(current.wind?.speed ?? 0),
		timezoneOffsetSeconds: current.timezone ?? 0,
		forecast: []
	};
	if (forecast) report.forecast = await forecastAt(fetcher, apiKey, lat, lon).catch(() => []);
	return report;
}

async function forecastAt(
	fetcher: typeof fetch,
	apiKey: string,
	lat: number,
	lon: number
): Promise<ForecastSample[]> {
	const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${encodeURIComponent(apiKey)}`;
	const response = await fetcher(url, { signal: AbortSignal.timeout(5000), redirect: 'manual' });
	if (!response.ok) return [];
	const data = (await response.json()) as {
		list?: {
			dt?: number;
			weather?: { description?: string }[];
			main?: { temp_max?: number; temp_min?: number };
		}[];
	};
	return (data.list ?? [])
		.filter((item) => typeof item.dt === 'number')
		.map((item) => ({
			at: item.dt as number,
			condition: item.weather?.[0]?.description || 'Unknown',
			highF: Math.round(item.main?.temp_max ?? 0),
			lowF: Math.round(item.main?.temp_min ?? 0)
		}));
}
