import type { WeatherReport } from '$lib/weather/format';
import type { WeatherChoice, WeatherLookup } from './lookup';

/** Development-only switch. Production builds pass `devMode: false` and cannot select it. */
export function weatherFixtureEnabled(devMode: boolean, source: string | undefined): boolean {
	return devMode && source === 'fixture';
}

const CHOICES: WeatherChoice[] = [
	{ lat: 41.683, lon: -86.25, label: 'South Bend, Indiana, US' },
	{ lat: 46.663, lon: -123.728, label: 'South Bend, Washington, US' },
	{ lat: 41.984, lon: -97.917, label: 'South Bend, Nebraska, US' },
	{ lat: 41.212, lon: -79.37, label: 'South Bend, Pennsylvania, US' },
	{ lat: 33, lon: -97, label: 'South Bend, Texas, US' }
];

export function lookupWeatherFixture(input: {
	query?: string;
	lat?: string | null;
	lon?: string | null;
	forecast?: boolean;
}): WeatherLookup {
	const latText = input.lat?.trim() ?? '';
	const lonText = input.lon?.trim() ?? '';
	if (latText || lonText) {
		const lat = Number(latText);
		const lon = Number(lonText);
		if (!validLatLon(lat, lon)) return { ok: false, status: 400, error: 'Invalid coordinates.' };
		const match = CHOICES.find((choice) => near(choice.lat, lat) && near(choice.lon, lon));
		if (!match) return { ok: false, status: 404, error: 'Location not found.' };
		return { ok: true, status: 200, report: report(match.label, input.forecast === true) };
	}

	const query = input.query?.trim() ?? '';
	if (!query) return { ok: false, status: 400, error: 'Missing a city or coordinates.' };
	if (query.length > 120) return { ok: false, status: 400, error: 'City name is too long.' };
	if (query.toLowerCase() === 'unconfigured') {
		return { ok: false, status: 503, error: 'Weather is not configured.' };
	}
	if (query.toLowerCase() === 'south bend') {
		return { ok: true, status: 200, choices: CHOICES.map((choice) => ({ ...choice })) };
	}
	return { ok: false, status: 404, error: 'Location not found.' };
}

function validLatLon(lat: number, lon: number): boolean {
	return (
		Number.isFinite(lat) &&
		Number.isFinite(lon) &&
		lat >= -90 &&
		lat <= 90 &&
		lon >= -180 &&
		lon <= 180
	);
}

function near(expected: number, actual: number): boolean {
	return Math.abs(expected - actual) < 0.001;
}

function report(location: string, forecast: boolean): WeatherReport {
	return {
		location,
		condition: 'clear sky',
		tempF: 42,
		tempC: 6,
		humidity: 55,
		windMph: 8,
		timezoneOffsetSeconds: -18_000,
		forecast: forecast ? [{ at: 1_700_000_000, condition: 'clouds', highF: 48, lowF: 36 }] : []
	};
}
