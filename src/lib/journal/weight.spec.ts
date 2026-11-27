import { describe, expect, it } from 'vitest';
import { formatWeightChange, publishedWeightChange } from './weight';

describe('published weight change', () => {
	it('sorts by date and keeps the earliest day as the baseline', () => {
		const change = publishedWeightChange([
			{ date: '2026-11-20', weight: 190 },
			{ date: '2026-11-02', weight: 200 },
			{ date: '2026-11-10', weight: 195.4 }
		]);
		expect(change).toBe(-10);
		expect(formatWeightChange(change ?? 0)).toBe('10.0 lb lost');
	});

	it('skips blank, zero, negative, and invalid weights', () => {
		const change = publishedWeightChange([
			{ date: '2026-11-01', weight: 184.2 },
			{ date: '2026-11-02', weight: null },
			{ date: '2026-11-03', weight: 0 },
			{ date: '2026-11-04', weight: -4 },
			{ date: '2026-11-05', weight: Number.NaN },
			{ date: '2026-11-06', weight: Number.POSITIVE_INFINITY },
			{ date: '2026-11-07', weight: 'n/a' },
			{ date: '2026-11-12', weight: 180 }
		]);
		expect(change).toBe(-4.2);
		expect(formatWeightChange(change ?? 0)).toBe('4.2 lb lost');
	});

	it('returns null when fewer than two valid weigh-ins remain', () => {
		expect(publishedWeightChange([])).toBeNull();
		expect(
			publishedWeightChange([
				{ date: '2026-11-02', weight: 180 },
				{ date: '2026-11-03', weight: 0 },
				{ date: 'undated', weight: 170 }
			])
		).toBeNull();
	});

	it('rounds to one decimal and names a gain or no change', () => {
		expect(
			publishedWeightChange([
				{ date: '2026-11-01', weight: 180 },
				{ date: '2026-11-08', weight: 182.36 }
			])
		).toBe(2.4);
		expect(formatWeightChange(2.4)).toBe('2.4 lb gained');
		expect(
			publishedWeightChange([
				{ date: '2026-11-01', weight: 180 },
				{ date: '2026-11-08', weight: 180.04 }
			])
		).toBe(0);
		expect(formatWeightChange(0)).toBe('No change');
		expect(formatWeightChange(-0)).toBe('No change');
	});
});
