import type { MileageRecord } from '$lib/journal/mileage';
import type { WeighInSample } from '$lib/journal/weight';

/**
 * Synthetic mileage for tests and JOURNAL_SOURCE=fixture.
 * These rows are not the owner's journal. Production builds ignore this source.
 * The clock is fixed at 2026-11-26 so week and month assertions stay put.
 * Totals: 16 miles, 4 walking days, current week 12.5, November 16.
 * 2026-11-03 is an explicit zero. 2026-11-04 has no mileage.
 *
 * Weight change is 205.2 − 210 = -4.8. The latest weigh-in is the blank-mileage
 * day. 208 on the zero-mile day is kept and is not an endpoint. A later zero
 * and a later negative weight are skipped.
 */
export const FIXTURE_TODAY = '2026-11-26';

type FixtureRow = {
	date: string;
	miles: number | null;
	weight: number | null;
};

const FIXTURE_ROWS: readonly FixtureRow[] = [
	{ date: '2026-11-02', miles: 3.5, weight: 210 },
	{ date: '2026-11-03', miles: 0, weight: 208 },
	{ date: '2026-11-04', miles: null, weight: 205.2 },
	{ date: '2026-11-23', miles: 4, weight: null },
	{ date: '2026-11-24', miles: 6.5, weight: -3 },
	{ date: '2026-11-26', miles: 2, weight: 0 }
];

export function fixtureMileageRecords(): MileageRecord[] {
	return FIXTURE_ROWS.map(({ date, miles }) => ({ date, miles }));
}

export function fixtureWeighIns(): WeighInSample[] {
	return FIXTURE_ROWS.map(({ date, weight }) => ({ date, weight }));
}

/** Synthetic rows for the weight-change cases. They are not the public page fixture. */
export type SyntheticJournalRow = {
	date: string;
	miles: number | null;
	weight: unknown;
	publish?: boolean;
};

/** Newest row is listed first. The baseline is 200 on November 2, not 195.4. */
export const CHRONOLOGICAL_WEIGH_INS: readonly SyntheticJournalRow[] = [
	{ date: '2026-11-20', miles: 2, weight: 190, publish: true },
	{ date: '2026-11-02T21:00:00.000-04:00', miles: 3, weight: 200, publish: true },
	{ date: '2026-11-10', miles: 1, weight: 195.4, publish: true }
];

/** The earliest weigh-in has no miles. Dropping that day would leave one weigh-in. */
export const BLANK_MILEAGE_WEIGH_INS: readonly SyntheticJournalRow[] = [
	{ date: '2026-11-09', miles: 5, weight: null, publish: true },
	{ date: '2026-11-01', miles: null, weight: 184.2, publish: true },
	{ date: '2026-11-12', miles: 2, weight: 180, publish: true }
];

/** The unpublished October row would become the baseline if the filter missed it. */
export const UNPUBLISHED_WEIGH_INS: readonly SyntheticJournalRow[] = [
	{ date: '2026-11-20', miles: 1, weight: 190, publish: true },
	{ date: '2026-10-01', miles: 8, weight: 250, publish: false },
	{ date: '2026-11-02', miles: 4, weight: 200, publish: true },
	{ date: '2026-11-10', miles: 2, weight: 195, publish: true }
];

/** One valid weigh-in. Zero, blank, negative, and non-numeric weights do not count. */
export const INSUFFICIENT_WEIGH_INS: readonly SyntheticJournalRow[] = [
	{ date: '2026-11-02', miles: 3, weight: 180, publish: true },
	{ date: '2026-11-03', miles: 1, weight: 0, publish: true },
	{ date: '2026-11-04', miles: null, weight: null, publish: true },
	{ date: '2026-11-05', miles: 2, weight: -4, publish: true },
	{ date: '2026-11-06', miles: 2, weight: 'n/a', publish: true }
];
