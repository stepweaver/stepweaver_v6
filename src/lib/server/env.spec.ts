import { afterEach, describe, expect, it } from 'vitest';
import { readServerEnv, serviceIsolationEnabled } from './env';

const platform = {
	env: {
		OPENWEATHER_API_KEY: 'platform-weather',
		WRITING_SOURCE: 'notion',
		UNRELATED_SETTING: 'keep-platform'
	}
} as unknown as App.Platform;

describe('server env isolation', () => {
	const previous = {
		e2e: process.env.STEPWEAVER_E2E,
		weather: process.env.OPENWEATHER_API_KEY,
		writing: process.env.WRITING_SOURCE
	};

	afterEach(() => {
		restore('STEPWEAVER_E2E', previous.e2e);
		restore('OPENWEATHER_API_KEY', previous.weather);
		restore('WRITING_SOURCE', previous.writing);
	});

	it('keeps platform bindings ahead of process.env outside the browser suite', () => {
		process.env.OPENWEATHER_API_KEY = '';
		expect(readServerEnv(platform, 'OPENWEATHER_API_KEY', { isolated: false })).toBe(
			'platform-weather'
		);
	});

	it('lets an explicit empty e2e value hide external services without hiding other settings', () => {
		process.env.OPENWEATHER_API_KEY = '';
		process.env.WRITING_SOURCE = 'fixture';
		expect(readServerEnv(platform, 'OPENWEATHER_API_KEY', { isolated: true })).toBeUndefined();
		expect(readServerEnv(platform, 'WRITING_SOURCE', { isolated: true })).toBe('fixture');
		expect(readServerEnv(platform, 'UNRELATED_SETTING', { isolated: true })).toBe('keep-platform');
	});

	it('cannot turn isolation on in production', () => {
		process.env.STEPWEAVER_E2E = '1';
		process.env.OPENWEATHER_API_KEY = '';
		expect(serviceIsolationEnabled(false)).toBe(false);
		expect(serviceIsolationEnabled(true)).toBe(true);
		expect(readServerEnv(platform, 'OPENWEATHER_API_KEY')).toBe(
			serviceIsolationEnabled() ? undefined : 'platform-weather'
		);
	});
});

function restore(key: string, value: string | undefined) {
	if (value === undefined) delete process.env[key];
	else process.env[key] = value;
}
