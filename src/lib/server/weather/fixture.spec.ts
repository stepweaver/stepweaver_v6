import { describe, expect, it } from 'vitest';
import { lookupWeatherFixture, weatherFixtureEnabled } from './fixture';

describe('weather fixture', () => {
	it('stays off in production even when the source is requested', () => {
		expect(weatherFixtureEnabled(false, 'fixture')).toBe(false);
		expect(weatherFixtureEnabled(true, 'fixture')).toBe(true);
		expect(weatherFixtureEnabled(true, undefined)).toBe(false);
	});

	it('reports weather as unconfigured, then resolves a chosen location', () => {
		expect(lookupWeatherFixture({ query: 'unconfigured' })).toEqual({
			ok: false,
			status: 503,
			error: 'Weather is not configured.'
		});
		const choices = lookupWeatherFixture({ query: 'South Bend', forecast: true });
		expect(choices.ok).toBe(true);
		if (!choices.ok || !('choices' in choices)) throw new Error('expected location choices');
		expect(choices.choices).toHaveLength(5);
		expect(choices.choices[0]?.label).toBe('South Bend, Indiana, US');

		const selected = lookupWeatherFixture({
			lat: String(choices.choices[0]?.lat),
			lon: String(choices.choices[0]?.lon),
			forecast: true
		});
		expect(selected.ok).toBe(true);
		if (!selected.ok || !('report' in selected)) throw new Error('expected a weather report');
		expect(selected.report.location).toBe('South Bend, Indiana, US');
		expect(selected.report.tempF).toBe(42);
		expect(selected.report.forecast).toHaveLength(1);
	});

	it('does not invent a report for an unknown place', () => {
		expect(lookupWeatherFixture({ query: 'Atlantis' }).ok).toBe(false);
		expect(lookupWeatherFixture({ lat: '10', lon: '10' }).ok).toBe(false);
	});
});
