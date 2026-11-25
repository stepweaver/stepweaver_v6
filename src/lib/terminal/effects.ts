import { formatWeatherLines, type WeatherReport } from '$lib/weather/format';
import type { ContactDraft, ShellEffect, TerminalLine, WeatherOption } from './types';

type FetchLike = typeof fetch;
type GeoReader = () => Promise<{ lat: number; lon: number } | null>;

export type EffectOutcome = {
	lines: TerminalLine[];
	mode?: 'shell' | 'weather' | 'contact';
	weather?: { options: WeatherOption[]; forecast: boolean } | null;
	contact?: ContactDraft | null;
};

export async function performEffect(
	effect: ShellEffect,
	fetchImpl: FetchLike = fetch,
	geo: GeoReader = readGeoPosition,
	turnstileToken = ''
): Promise<EffectOutcome> {
	if (effect.type === 'geo-weather')
		return geoWeather(effect.forecast, fetchImpl, geo ?? readGeoPosition);
	if (effect.type === 'weather') return cityWeather(effect.query, effect.forecast, fetchImpl);
	if (effect.type === 'weather-at') {
		const outcome = await coordinateWeather(effect.lat, effect.lon, effect.forecast, fetchImpl);
		if (!effect.note) return outcome;
		return { ...outcome, lines: [{ content: effect.note, variant: 'warning' }, ...outcome.lines] };
	}
	if (effect.type === 'chat') return askLambda(effect.message, fetchImpl);
	if (effect.type === 'contact-send') return sendContact(effect.draft, turnstileToken, fetchImpl);
	return { lines: [] };
}

export function readGeoPosition(): Promise<{ lat: number; lon: number } | null> {
	if (typeof navigator === 'undefined' || !navigator.geolocation) return Promise.resolve(null);
	return new Promise((resolve) => {
		navigator.geolocation.getCurrentPosition(
			(position) => resolve({ lat: position.coords.latitude, lon: position.coords.longitude }),
			() => resolve(null),
			{ timeout: 10_000, maximumAge: 300_000, enableHighAccuracy: false }
		);
	});
}

async function geoWeather(
	forecast: boolean,
	fetchImpl: FetchLike,
	geo: GeoReader
): Promise<EffectOutcome> {
	const position = await geo();
	if (!position) {
		const fallback = await cityWeather('New York', forecast, fetchImpl);
		return {
			...fallback,
			lines: [
				{
					content:
						'Location was not shared. Showing New York. Type weather <city> for another city.',
					variant: 'warning'
				},
				...fallback.lines
			]
		};
	}
	return coordinateWeather(position.lat, position.lon, forecast, fetchImpl);
}

async function cityWeather(
	query: string,
	forecast: boolean,
	fetchImpl: FetchLike
): Promise<EffectOutcome> {
	const params = new URLSearchParams({ q: query });
	if (forecast) params.set('forecast', 'true');
	return readWeather(params, forecast, fetchImpl);
}

async function coordinateWeather(
	lat: number,
	lon: number,
	forecast: boolean,
	fetchImpl: FetchLike
): Promise<EffectOutcome> {
	const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
	if (forecast) params.set('forecast', 'true');
	return readWeather(params, forecast, fetchImpl);
}

const CLIENT_DEADLINE_MS = 20_000;

async function readWeather(
	params: URLSearchParams,
	forecast: boolean,
	fetchImpl: FetchLike
): Promise<EffectOutcome> {
	try {
		const response = await fetchImpl(`/api/weather?${params.toString()}`, {
			signal: AbortSignal.timeout(CLIENT_DEADLINE_MS)
		});
		const data = (await response.json()) as
			WeatherReport | { needSelection?: boolean; options?: WeatherOption[] } | { error?: string };
		if (!data || typeof data !== 'object') {
			return {
				lines: [{ content: 'Weather data was not usable.', variant: 'error' }],
				mode: 'shell',
				weather: null
			};
		}
		if (!response.ok) {
			return {
				lines: [
					{ content: errorText(data, 'Weather is unavailable.'), variant: 'error' },
					{ content: 'Type weather <city> to try a city.', variant: 'dimmed' }
				],
				mode: 'shell',
				weather: null
			};
		}
		if (isSelection(data)) {
			return {
				lines: [
					{ content: 'Multiple locations:', variant: 'warning' },
					...data.options.map((option, index) => ({
						content: `  ${index + 1}. ${option.label}`,
						variant: 'default' as const
					})),
					{ content: `Type a number (1-${data.options.length}) or cancel.`, variant: 'dimmed' }
				],
				mode: 'weather',
				weather: { options: data.options, forecast }
			};
		}
		if (!isReport(data)) {
			return {
				lines: [{ content: 'Weather data was not usable.', variant: 'error' }],
				mode: 'shell',
				weather: null
			};
		}
		return {
			lines: formatWeatherLines(data).map((entry) => ({
				content: entry.text,
				variant: entry.tone
			})),
			mode: 'shell',
			weather: null
		};
	} catch {
		return {
			lines: [
				{ content: 'Failed to fetch weather data.', variant: 'error' },
				{ content: 'Type weather <city> to try again.', variant: 'dimmed' }
			],
			mode: 'shell',
			weather: null
		};
	}
}

async function askLambda(message: string, fetchImpl: FetchLike): Promise<EffectOutcome> {
	try {
		const response = await fetchImpl('/api/chat', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ channel: 'terminal', messages: [{ role: 'user', content: message }] }),
			signal: AbortSignal.timeout(CLIENT_DEADLINE_MS)
		});
		const data = (await response.json()) as { message?: string; error?: string };
		if (!response.ok || !data.message) {
			return {
				lines: [
					{
						content: data.error || 'λlambda could not reach the model. The terminal is still here.',
						variant: 'error'
					}
				]
			};
		}
		return {
			lines: data.message
				.split('\n')
				.map((content) => ({ content: `λlambda: ${content}`, variant: 'lambda' as const }))
		};
	} catch {
		return {
			lines: [
				{
					content: 'λlambda could not reach the model. The terminal is still here.',
					variant: 'error'
				}
			]
		};
	}
}

async function sendContact(
	draft: ContactDraft,
	token: string,
	fetchImpl: FetchLike
): Promise<EffectOutcome> {
	const form = new FormData();
	form.set('name', draft.name);
	form.set('email', draft.email);
	form.set('message', draft.message);
	form.set('intent', draft.intent);
	form.set('opened_at', String(draft.openedAt));
	form.set('cf_turnstile_response', token);
	form.set('company_website', '');
	try {
		const response = await fetchImpl('/contact', {
			method: 'POST',
			body: form,
			headers: { accept: 'application/json', 'x-sveltekit-action': 'true' },
			signal: AbortSignal.timeout(CLIENT_DEADLINE_MS)
		});
		const payload = (await response.json()) as {
			type?: string;
			data?: { success?: boolean; message?: string };
			message?: string;
		};
		const message = payload.data?.message || payload.message || 'The message was not sent.';
		const sent = payload.type === 'success' || payload.data?.success === true;
		if (!sent) {
			return {
				lines: [
					{ content: message, variant: 'error' },
					{ content: 'The draft is still here. Type send, edit, or cancel.', variant: 'dimmed' }
				],
				mode: 'contact',
				contact: draft
			};
		}
		return { lines: [{ content: message, variant: 'success' }], mode: 'shell', contact: null };
	} catch {
		return {
			lines: [
				{ content: 'The message was not sent.', variant: 'error' },
				{ content: 'The draft is still here. Type send, edit, or cancel.', variant: 'dimmed' }
			],
			mode: 'contact',
			contact: draft
		};
	}
}

function isSelection(value: object): value is { options: WeatherOption[] } {
	return 'needSelection' in value && Array.isArray((value as { options?: unknown }).options);
}

function isReport(value: object): value is WeatherReport {
	return 'location' in value && 'tempF' in value && 'timezoneOffsetSeconds' in value;
}

function errorText(value: object, fallback: string): string {
	const error = (value as { error?: unknown }).error;
	return typeof error === 'string' && error.trim() ? error : fallback;
}
