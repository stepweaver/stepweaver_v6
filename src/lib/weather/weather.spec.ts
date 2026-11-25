import { describe, expect, it, vi } from 'vitest';
import { formatCityTime, formatWeatherLines } from '$lib/weather/format';
import { clearWeatherCache, lookupWeather } from '$lib/server/weather/lookup';
import { performEffect } from '$lib/terminal/effects';

describe('weather', () => {
	it('labels units and the city local clock', () => {
		const local = formatCityTime(1_700_000_000, -18_000);
		expect(local).toBe('Tue Nov 14, 5:13 PM');
		expect(local).not.toBe(formatCityTime(1_700_000_000, 0));
		const lines = formatWeatherLines({
			location: 'South Bend, US',
			condition: 'clear sky',
			tempF: 72,
			tempC: 22,
			humidity: 40,
			windMph: 8,
			timezoneOffsetSeconds: -18_000,
			forecast: [{ at: 1_700_000_000, condition: 'clouds', highF: 74, lowF: 60 }]
		}).map((line) => line.text);
		expect(lines.join('\n')).toContain('72°F (22°C)');
		expect(lines.join('\n')).toContain('Wind: 8 mph');
		expect(lines.join('\n')).toContain('Tue Nov 14');
		expect(lines.join('\n')).not.toContain('5:13 PM');
	});

	it('uses the local day high and low instead of the first sample', () => {
		const lines = formatWeatherLines({
			location: 'South Bend, US',
			condition: 'clear sky',
			tempF: 72,
			tempC: 22,
			humidity: 40,
			windMph: 8,
			timezoneOffsetSeconds: -18_000,
			forecast: [
				{ at: 1_699_978_400, condition: 'morning fog', highF: 61, lowF: 55 },
				{ at: 1_700_000_000, condition: 'afternoon sun', highF: 74, lowF: 60 }
			]
		}).map((line) => line.text);
		expect(lines.join('\n')).toContain('Tue Nov 14: morning fog, 74°F / 55°F');
	});

	it('loads the forecast while current conditions are still in flight', async () => {
		clearWeatherCache();
		let forecastStarted = false;
		let releaseCurrent = () => {};
		const currentHeld = new Promise<void>((resolve) => {
			releaseCurrent = resolve;
		});
		const pending = lookupWeather({
			apiKey: 'key',
			query: 'South Bend',
			forecast: true,
			fetch: async (url) => {
				const href = String(url);
				if (href.includes('/geo/')) {
					return Response.json([{ lat: 41.68, lon: -86.25, name: 'South Bend', country: 'US' }]);
				}
				if (href.includes('/forecast')) {
					forecastStarted = true;
					return Response.json({
						list: [
							{
								dt: 1_700_000_000,
								weather: [{ description: 'clouds' }],
								main: { temp_max: 70, temp_min: 60 }
							}
						]
					});
				}
				await currentHeld;
				return Response.json({
					name: 'South Bend',
					timezone: -18_000,
					sys: { country: 'US' },
					weather: [{ description: 'clear sky' }],
					main: { temp: 72, humidity: 40 },
					wind: { speed: 8 }
				});
			}
		});
		await vi.waitFor(() => {
			expect(forecastStarted).toBe(true);
		});
		releaseCurrent();
		const result = await pending;
		expect(result.ok && 'report' in result && result.report.forecast).toHaveLength(1);
	});

	it('reuses a recent report without calling the weather service again', async () => {
		clearWeatherCache();
		let calls = 0;
		const fetchWeather: typeof fetch = async () => {
			calls += 1;
			return Response.json({
				name: 'South Bend',
				timezone: -18_000,
				sys: { country: 'US' },
				weather: [{ description: 'clear sky' }],
				main: { temp: 72, humidity: 40 },
				wind: { speed: 8 }
			});
		};
		const first = await lookupWeather({
			apiKey: 'key',
			lat: '41.68',
			lon: '-86.25',
			fetch: fetchWeather,
			now: 1_000
		});
		const second = await lookupWeather({
			apiKey: 'key',
			lat: '41.6801',
			lon: '-86.2501',
			fetch: fetchWeather,
			now: 2_000
		});
		expect(first.ok && second.ok).toBe(true);
		expect(calls).toBe(1);
		clearWeatherCache();
	});

	it('asks for a choice when several cities match', async () => {
		const result = await lookupWeather({
			apiKey: 'key',
			query: 'Springfield',
			fetch: async () =>
				Response.json([
					{ lat: 1, lon: 2, name: 'Springfield', state: 'Illinois', country: 'US' },
					{ lat: 3, lon: 4, name: 'Springfield', state: 'Missouri', country: 'US' }
				])
		});
		expect(result.ok && 'choices' in result && result.choices).toHaveLength(2);
	});

	it('keeps city entry available after location is denied', async () => {
		const outcome = await performEffect(
			{ type: 'geo-weather', forecast: false },
			async () => Response.json({ error: 'Weather is not configured.' }, { status: 503 }),
			async () => null
		);
		const text = outcome.lines.map((line) => line.content).join('\n');
		expect(text).toContain('Location was not shared');
		expect(text).toContain('weather <city>');
		expect(outcome.mode).toBe('shell');
	});
});
