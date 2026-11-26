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
	now?: number;
};

const WEATHER_TTL_MS = 10 * 60 * 1000;
const MAX_WEATHER_CACHE = 64;
const weatherCache = new Map<string, { at: number; value: WeatherLookup }>();

export function clearWeatherCache(): void {
	weatherCache.clear();
}

function recall(key: string, now: number): WeatherLookup | undefined {
	const entry = weatherCache.get(key);
	if (!entry) return undefined;
	if (now - entry.at > WEATHER_TTL_MS) {
		weatherCache.delete(key);
		return undefined;
	}
	return entry.value;
}

function remember(key: string, value: WeatherLookup, now: number) {
	if (!weatherCache.has(key) && weatherCache.size >= MAX_WEATHER_CACHE) {
		const oldest = weatherCache.keys().next().value;
		if (oldest) weatherCache.delete(oldest);
	}
	weatherCache.set(key, { at: now, value });
}

export async function lookupWeather(input: LookupInput): Promise<WeatherLookup> {
	const apiKey = input.apiKey?.trim();
	if (!apiKey) return { ok: false, status: 503, error: 'Weather is not configured.' };
	const forecast = input.forecast === true;
	const fetcher = input.fetch ?? fetch;
	const now = input.now ?? Date.now();
	const lat = input.lat?.trim() ? Number(input.lat) : null;
	const lon = input.lon?.trim() ? Number(input.lon) : null;
	const cacheKey =
		lat !== null || lon !== null
			? validLatLon(lat, lon)
				? `ll:${(lat as number).toFixed(3)}:${(lon as number).toFixed(3)}:${forecast ? 'f' : 'n'}`
				: ''
			: `q:${(input.query?.trim() ?? '').toLowerCase()}:${forecast ? 'f' : 'n'}`;
	if (cacheKey) {
		const cached = recall(cacheKey, now);
		if (cached) return cached;
	}
	try {
		let result: WeatherLookup;
		if (lat !== null || lon !== null) {
			if (!validLatLon(lat, lon)) return { ok: false, status: 400, error: 'Invalid coordinates.' };
			const report = await reportAt(fetcher, apiKey, lat as number, lon as number, '', forecast);
			result = { ok: true, status: 200, report };
		} else {
			const query = input.query?.trim() ?? '';
			if (!query) return { ok: false, status: 400, error: 'Missing a city or coordinates.' };
			if (query.length > 120) return { ok: false, status: 400, error: 'City name is too long.' };
			const found = await geocode(fetcher, apiKey, query);
			if (!found.length) return { ok: false, status: 404, error: 'Location not found.' };
			if (found.length > 1) result = { ok: true, status: 200, choices: found };
			else {
				const city = found[0];
				if (!city) return { ok: false, status: 404, error: 'Location not found.' };
				const report = await reportAt(fetcher, apiKey, city.lat, city.lon, city.label, forecast);
				result = { ok: true, status: 200, report };
			}
		}
		if (cacheKey) remember(cacheKey, result, now);
		return result;
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
	const currentPromise = fetcher(currentUrl, {
		signal: AbortSignal.timeout(5000),
		redirect: 'manual'
	});
	const forecastPromise = forecast
		? forecastAt(fetcher, apiKey, lat, lon).catch(() => null)
		: Promise.resolve([] as ForecastSample[]);
	const [currentResponse, samples] = await Promise.all([currentPromise, forecastPromise]);
	if (!currentResponse.ok) throw new Error('weather failed');
	const current = (await currentResponse.json()) as {
		name?: string;
		timezone?: number;
		sys?: { country?: string };
		weather?: { description?: string }[];
		main?: { temp?: number; humidity?: number };
		wind?: { speed?: number };
	};
	const rawTemp = finiteNumber(current.main?.temp);
	if (rawTemp === null) throw new Error('Current temperature is missing');
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
		humidity: roundedMeasurement(current.main?.humidity, 0, 100),
		windMph: roundedMeasurement(current.wind?.speed, 0),
		// One offset for the whole report. Forecast rows do not change it for daylight saving.
		timezoneOffsetSeconds: finiteNumber(current.timezone),
		forecast: samples ?? [],
		forecastUnavailable: samples === null
	};
	return report;
}

function finiteNumber(value: unknown): number | null {
	return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Missing, non-finite, and out-of-range values stay unknown. Zero stays zero. */
function roundedMeasurement(
	value: unknown,
	min: number,
	max = Number.POSITIVE_INFINITY
): number | null {
	const number = finiteNumber(value);
	if (number === null || number < min || number > max) return null;
	return Math.round(number);
}

async function forecastAt(
	fetcher: typeof fetch,
	apiKey: string,
	lat: number,
	lon: number
): Promise<ForecastSample[] | null> {
	const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${encodeURIComponent(apiKey)}`;
	const response = await fetcher(url, { signal: AbortSignal.timeout(5000), redirect: 'manual' });
	if (!response.ok) return null;
	const data = (await response.json()) as {
		list?: {
			dt?: number;
			weather?: { description?: string }[];
			main?: { temp_max?: number; temp_min?: number };
		}[];
	};
	return (data.list ?? [])
		.filter((item) => finiteNumber(item.dt) !== null)
		.map((item) => ({
			at: item.dt as number,
			condition: item.weather?.[0]?.description || 'Unknown',
			highF: roundedMeasurement(item.main?.temp_max, Number.NEGATIVE_INFINITY),
			lowF: roundedMeasurement(item.main?.temp_min, Number.NEGATIVE_INFINITY)
		}));
}
