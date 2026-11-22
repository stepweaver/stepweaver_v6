import { describe, expect, it } from 'vitest';
import { formatCityTime, formatWeatherLines } from '$lib/weather/format';
import { lookupWeather } from '$lib/server/weather/lookup';
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
		expect(lines.join('\n')).toContain('Tue Nov 14, 5:13 PM');
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
