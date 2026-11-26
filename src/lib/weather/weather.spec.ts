import { describe, expect, it, vi } from 'vitest';
import { formatCityTime, formatWeatherLines, type WeatherReport } from '$lib/weather/format';
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

	it('keeps real zeros and leaves missing measurements unknown', async () => {
		clearWeatherCache();
		const result = await lookupWeather({
			apiKey: 'key',
			lat: '41.68',
			lon: '-86.25',
			forecast: true,
			now: 10_000,
			fetch: async (url) => {
				const href = String(url);
				if (href.includes('/forecast')) {
					return Response.json({
						list: [
							{
								dt: 1_700_000_000,
								weather: [{ description: 'clear' }],
								main: { temp_max: 0, temp_min: 0 }
							},
							{ dt: 1_700_003_600, weather: [{ description: 'gap' }], main: {} },
							{
								dt: 1_700_007_200,
								weather: [{ description: 'bad' }],
								main: { temp_max: Number.NaN, temp_min: Number.POSITIVE_INFINITY }
							},
							{ dt: Number.NaN, main: { temp_max: 90, temp_min: 80 } }
						]
					});
				}
				return Response.json({
					name: 'South Bend',
					timezone: 0,
					sys: { country: 'US' },
					weather: [{ description: 'clear sky' }],
					main: { temp: 0, humidity: 0 },
					wind: { speed: 0 }
				});
			}
		});
		if (!result.ok || !('report' in result)) throw new Error('expected a report');
		expect(result.report.tempF).toBe(0);
		expect(result.report.tempC).toBe(-18);
		expect(result.report.humidity).toBe(0);
		expect(result.report.windMph).toBe(0);
		expect(result.report.timezoneOffsetSeconds).toBe(0);
		expect(result.report.forecast).toEqual([
			{ at: 1_700_000_000, condition: 'clear', highF: 0, lowF: 0 },
			{ at: 1_700_003_600, condition: 'gap', highF: null, lowF: null },
			{ at: 1_700_007_200, condition: 'bad', highF: null, lowF: null }
		]);
		const text = formatWeatherLines(result.report)
			.map((line) => line.text)
			.join('\n');
		expect(text).toContain('0°F (-18°C)');
		expect(text).toContain('Humidity: 0%');
		expect(text).toContain('Wind: 0 mph');
		expect(text).toContain('0°F / 0°F');
		expect(text).not.toContain('90°F');
	});

	it('does not turn a missing temperature, humidity, or wind into zero', async () => {
		clearWeatherCache();
		const missingTemp = await lookupWeather({
			apiKey: 'key',
			lat: '10',
			lon: '20',
			now: 20_000,
			fetch: async () =>
				Response.json({
					name: 'Nowhere',
					timezone: 0,
					main: { humidity: 40 },
					wind: { speed: 5 }
				})
		});
		expect(missingTemp.ok).toBe(false);
		expect(missingTemp).not.toMatchObject({ report: { tempF: 0 } });

		clearWeatherCache();
		const partial = await lookupWeather({
			apiKey: 'key',
			lat: '11',
			lon: '21',
			forecast: true,
			now: 30_000,
			fetch: async (url) => {
				if (String(url).includes('/forecast')) return new Response('down', { status: 503 });
				return Response.json({
					name: 'Nowhere',
					weather: [{ description: 'clear sky' }],
					main: { temp: -40.2, humidity: -1 },
					wind: { speed: -3 }
				});
			}
		});
		if (!partial.ok || !('report' in partial)) throw new Error('expected a report');
		expect(partial.report.tempF).toBe(-40);
		expect(partial.report.humidity).toBeNull();
		expect(partial.report.windMph).toBeNull();
		expect(partial.report.timezoneOffsetSeconds).toBeNull();
		expect(partial.report.forecast).toEqual([]);
		expect(partial.report.forecastUnavailable).toBe(true);
		const text = formatWeatherLines(partial.report)
			.map((line) => line.text)
			.join('\n');
		expect(text).toContain('-40°F');
		expect(text).toContain('Humidity: unavailable');
		expect(text).toContain('Wind: unavailable');
		expect(text).toContain('Forecast: unavailable');
		expect(text).not.toContain('Forecast, city local time');
	});
});

describe('forecast days', () => {
	function lines(offsetSeconds: number, forecast: WeatherReport['forecast']) {
		return formatWeatherLines({
			location: 'Test',
			condition: 'clear',
			tempF: 10,
			tempC: -12,
			humidity: 0,
			windMph: 0,
			timezoneOffsetSeconds: offsetSeconds,
			forecast
		})
			.map((line) => line.text)
			.join('\n');
	}

	it('splits local midnight and ignores missing temperatures in the daily high and low', () => {
		const tokyo = 9 * 60 * 60;
		const text = lines(tokyo, [
			{
				at: Date.UTC(2024, 0, 15, 14, 0, 0) / 1000,
				condition: 'night',
				highF: 30,
				lowF: 20
			},
			{
				at: Date.UTC(2024, 0, 15, 15, 0, 0) / 1000,
				condition: 'overnight',
				highF: 8,
				lowF: 4
			},
			{
				at: Date.UTC(2024, 0, 15, 16, 0, 0) / 1000,
				condition: 'gap',
				highF: null,
				lowF: null
			},
			{
				at: Date.UTC(2024, 0, 16, 3, 0, 0) / 1000,
				condition: 'afternoon',
				highF: 15,
				lowF: null
			},
			{
				at: Date.UTC(2024, 0, 17, 3, 0, 0) / 1000,
				condition: 'only low',
				highF: null,
				lowF: 4
			}
		]);
		expect(text).toContain('Mon Jan 15: night, 30°F / 20°F');
		expect(text).toContain('Tue Jan 16: afternoon, 15°F / 4°F');
		expect(text).toContain('Wed Jan 17: only low, unavailable / 4°F');
		expect(text).not.toContain('15°F / 0°F');
		expect(text).not.toContain('0°F / 4°F');
	});

	it('applies one fixed offset to every sample, including a daylight-saving boundary', () => {
		// Each call is one observation. The offset does not change between samples,
		// and this does not look up the civil timezone.
		const before = Date.UTC(2024, 10, 3, 4, 30, 0) / 1000;
		const after = Date.UTC(2024, 10, 3, 7, 30, 0) / 1000;
		const samples = [
			{ at: before, condition: 'clear', highF: 50, lowF: 40 },
			{ at: after, condition: 'later', highF: 48, lowF: 39 }
		];
		const edt = lines(-4 * 60 * 60, samples);
		expect(edt).toContain('Sun Nov 3: later, 50°F / 39°F');
		expect(edt).not.toContain('Sat Nov 2');
		const est = lines(-5 * 60 * 60, samples);
		expect(est).toContain('Sat Nov 2: clear, 50°F / 40°F');
		expect(est).toContain('Sun Nov 3: later, 48°F / 39°F');
	});

	it('does not present a local forecast when the city offset is missing', () => {
		const text = formatWeatherLines({
			location: 'Test',
			condition: 'clear',
			tempF: 10,
			tempC: -12,
			humidity: null,
			windMph: null,
			timezoneOffsetSeconds: null,
			forecast: [{ at: 1_700_000_000, condition: 'clouds', highF: 12, lowF: 0 }]
		})
			.map((line) => line.text)
			.join('\n');
		expect(text).toContain('Forecast: local time unavailable');
		expect(text).not.toContain('Tue Nov 14');
		expect(text).not.toContain('city local time');
	});
});
