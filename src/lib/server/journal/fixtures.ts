import type { MileageRecord } from '$lib/journal/mileage';

/**
 * Synthetic mileage for tests and JOURNAL_SOURCE=fixture.
 * These rows are not the owner's journal. Production builds ignore this source.
 * The clock is fixed at 2026-11-26 so week and month assertions stay put.
 * Totals: 16 miles, 4 walking days, current week 12.5, November 16.
 * 2026-11-03 is an explicit zero. 2026-11-04 has no mileage.
 */
export const FIXTURE_TODAY = '2026-11-26';

const FIXTURE_ROWS: readonly MileageRecord[] = [
	{ date: '2026-11-02', miles: 3.5 },
	{ date: '2026-11-03', miles: 0 },
	{ date: '2026-11-04', miles: null },
	{ date: '2026-11-23', miles: 4 },
	{ date: '2026-11-24', miles: 6.5 },
	{ date: '2026-11-26', miles: 2 }
];

export function fixtureMileageRecords(): MileageRecord[] {
	return FIXTURE_ROWS.map((row) => ({ ...row }));
}
