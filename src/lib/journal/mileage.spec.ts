import { describe, expect, it } from 'vitest';
import {
	addCalendarDays,
	assessMileage,
	calendarDate,
	classifyMiles,
	formatMiles,
	localCalendarDay,
	milestoneFor,
	summarizeMileage,
	weekStartMonday,
	type MileageRecord
} from './mileage';

const TODAY = '2026-11-26';

function journal(records: MileageRecord[], today = TODAY) {
	return summarizeMileage(records, today);
}

describe('mileage values', () => {
	it('treats a missing value as unknown and keeps an explicit zero', () => {
		expect(classifyMiles(undefined)).toEqual({ kind: 'missing' });
		expect(classifyMiles(null)).toEqual({ kind: 'missing' });
		expect(classifyMiles(0)).toEqual({ kind: 'recorded', miles: 0 });
		expect(classifyMiles(-0)).toEqual({ kind: 'recorded', miles: 0 });
		const summary = journal([
			{ date: '2026-11-01', miles: null },
			{ date: '2026-11-02', miles: 0 },
			{ date: '2026-11-03', miles: 5 }
		]);
		expect(summary.totalMiles).toBe(5);
		expect(summary.walkingDays).toBe(1);
		expect(summary.recordedEntries).toBe(2);
		expect(summary.averageMiles).toBe(5);
	});

	it('rejects invalid and negative mileage instead of counting it', () => {
		expect(classifyMiles(Number.NaN).kind).toBe('rejected');
		expect(classifyMiles(Number.POSITIVE_INFINITY).kind).toBe('rejected');
		expect(classifyMiles('4')).toEqual({ kind: 'rejected', reason: 'invalid-miles' });
		expect(classifyMiles(-0.1)).toEqual({ kind: 'rejected', reason: 'negative-miles' });
		const rejected = assessMileage([
			{ date: '2026-11-01', miles: 4 },
			{ date: '2026-11-02', miles: -3 },
			{ date: '2026-11-03', miles: '8' }
		]);
		expect(rejected.ok).toBe(false);
		if (rejected.ok) return;
		expect(rejected.rejections).toEqual([
			{ reason: 'negative-miles', dates: ['2026-11-02'] },
			{ reason: 'invalid-miles', dates: ['2026-11-03'] }
		]);
		expect(JSON.stringify(rejected)).not.toContain('8');
		expect(JSON.stringify(rejected)).not.toContain('-3');
	});

	it('keeps decimal mileage exact in the total and the average', () => {
		const summary = journal([
			{ date: '2026-11-01', miles: 1.5 },
			{ date: '2026-11-02', miles: 2.25 }
		]);
		expect(summary.totalMiles).toBe(3.75);
		expect(summary.averageMiles).toBe(1.875);
		expect(formatMiles(1000.5)).toBe('1,000.5');
		expect(formatMiles(16)).toBe('16');
	});

	it('starts from an empty set without inventing days or an average', () => {
		const summary = journal([]);
		expect(summary.totalMiles).toBe(0);
		expect(summary.walkingDays).toBe(0);
		expect(summary.recordedEntries).toBe(0);
		expect(summary.averageMiles).toBeNull();
		expect(summary.firstDate).toBeNull();
		expect(summary.lastDate).toBeNull();
		expect(summary.weeks).toEqual([]);
		expect(summary.months).toEqual([]);
		expect(summary.currentWeek.miles).toBeNull();
		expect(summary.currentMonth.miles).toBeNull();
		expect(summary.milestone.nextMiles).toBe(10);
	});
});

describe('duplicate dates', () => {
	it('reports a historical correction and does not pick or add either value', () => {
		const assessed = assessMileage([
			{ date: '2026-05-08', miles: 6 },
			{ date: '2026-05-08', miles: 9.5 }
		]);
		expect(assessed.ok).toBe(false);
		if (assessed.ok) return;
		expect(assessed.rejections).toEqual([{ reason: 'duplicate-date', dates: ['2026-05-08'] }]);
		expect(JSON.stringify(assessed)).not.toContain('9.5');
		expect(() =>
			summarizeMileage(
				[
					{ date: '2026-05-08', miles: 6 },
					{ date: '2026-05-08', miles: 9.5 }
				],
				TODAY
			)
		).toThrow(/Duplicate mileage date: 2026-05-08/);
	});

	it('does not echo an arbitrary string stored in a date field', () => {
		const assessed = assessMileage([{ date: 'north route locker code', miles: 4 }]);
		expect(assessed.ok).toBe(false);
		if (assessed.ok) return;
		expect(assessed.rejections).toEqual([{ reason: 'invalid-date', dates: ['undated'] }]);
		expect(JSON.stringify(assessed)).not.toContain('route');
		expect(calendarDate('2026-02-29')).toBeNull();
		expect(calendarDate('2024-02-29')).toBe('2024-02-29');
	});
});

describe('calendar boundaries', () => {
	it('keeps stored dates on their calendar day and starts weeks on Monday', () => {
		expect(weekStartMonday('2026-11-23')).toBe('2026-11-23');
		expect(weekStartMonday('2026-11-22')).toBe('2026-11-16');
		expect(addCalendarDays('2026-03-08', 1)).toBe('2026-03-09');
		const summary = journal(
			[
				{ date: '2026-11-22', miles: 8 },
				{ date: '2026-11-23', miles: 3 }
			],
			'2026-11-26'
		);
		expect(summary.currentWeek.start).toBe('2026-11-23');
		expect(summary.currentWeek.end).toBe('2026-11-29');
		expect(summary.currentWeek.miles).toBe(3);
		expect(summary.currentWeek.partial).toBe(true);
		expect(summary.weeks.map((bucket) => [bucket.start, bucket.miles])).toEqual([
			['2026-11-16', 8],
			['2026-11-23', 3]
		]);
	});

	it('splits months on the calendar date and keeps a leap-day month intact', () => {
		const summary = journal(
			[
				{ date: '2024-02-29', miles: 2 },
				{ date: '2024-03-01', miles: 4 }
			],
			'2024-03-15'
		);
		expect(summary.currentMonth.label).toBe('March 2024');
		expect(summary.currentMonth.miles).toBe(4);
		expect(summary.months.map((bucket) => [bucket.key, bucket.miles, bucket.end])).toEqual([
			['2024-02', 2, '2024-02-29'],
			['2024-03', 4, '2024-03-31']
		]);
	});

	it('uses Indianapolis local calendar days across the UTC line and daylight saving', () => {
		expect(localCalendarDay(new Date('2026-11-23T04:59:00.000Z'))).toBe('2026-11-22');
		expect(localCalendarDay(new Date('2026-11-23T05:00:00.000Z'))).toBe('2026-11-23');
		expect(localCalendarDay(new Date('2026-03-08T06:30:00.000Z'))).toBe('2026-03-08');
		expect(localCalendarDay(new Date('2026-03-08T07:00:00.000Z'))).toBe('2026-03-08');
		expect(localCalendarDay(new Date('2026-11-01T05:30:00.000Z'))).toBe('2026-11-01');
		expect(localCalendarDay(new Date('2026-11-01T06:30:00.000Z'))).toBe('2026-11-01');
	});

	it('does not treat an open or gapped period as a complete set of days', () => {
		const summary = journal([
			{ date: '2026-05-08', miles: 4 },
			{ date: '2026-06-02', miles: 5 },
			{ date: '2026-11-19', miles: 6 }
		]);
		const may = summary.months.find((bucket) => bucket.key === '2026-05');
		const june = summary.months.find((bucket) => bucket.key === '2026-06');
		const november = summary.months.find((bucket) => bucket.key === '2026-11');
		expect(may?.partial).toBe(true);
		expect(june?.partial).toBe(false);
		expect(june?.walkingDays).toBe(1);
		expect(november?.partial).toBe(true);
		expect(summary.currentWeek.miles).toBeNull();
		expect(summary.currentMonth.miles).toBe(6);
		expect(summary.weeks.some((bucket) => bucket.miles === null)).toBe(true);
		expect(summary.weeks.find((bucket) => bucket.miles === null)?.walkingDays).toBe(0);
		expect(JSON.stringify(summary.weeks)).not.toContain('"complete":true');
	});
});

describe('milestones', () => {
	it('measures progress toward the next distance and stops at the last mark', () => {
		const early = milestoneFor(16);
		expect(early.previousMiles).toBe(10);
		expect(early.nextMiles).toBe(25);
		expect(early.milesRemaining).toBe(9);
		expect(early.progress).toBeCloseTo(0.4);
		expect(milestoneFor(25).nextMiles).toBe(50);
		expect(milestoneFor(25).progress).toBe(0);
		expect(milestoneFor(25000).nextMiles).toBeNull();
		expect(milestoneFor(25000).progress).toBe(1);
	});
});
