import { calendarDate } from '$lib/journal/mileage';

/**
 * Public weight change for the field journal.
 * The number is the latest valid weigh-in minus the earliest, after sorting by date.
 * Callers keep the weigh-ins on the server and send only this number.
 */

export type WeighInSample = {
	date: string;
	weight: unknown;
};

function usableWeight(value: unknown): number | null {
	if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null;
	return value;
}

function roundToTenth(value: number): number {
	const tenths = Math.round(Math.abs(value) * 10 + Number.EPSILON);
	const rounded = tenths / 10;
	const signed = value < 0 ? -rounded : rounded;
	return Object.is(signed, -0) ? 0 : signed;
}

/**
 * Change in pounds from the earliest dated weigh-in to the latest.
 * Blank, zero, negative, and invalid weights are skipped.
 * Returns null when fewer than two usable weigh-ins remain.
 */
export function publishedWeightChange(samples: readonly WeighInSample[]): number | null {
	const usable: { date: string; weight: number }[] = [];
	for (const sample of samples) {
		const date = calendarDate(sample.date);
		if (!date) continue;
		const weight = usableWeight(sample.weight);
		if (weight === null) continue;
		usable.push({ date, weight });
	}
	if (usable.length < 2) return null;
	usable.sort((a, b) => a.date.localeCompare(b.date));
	const earliest = usable[0]?.weight;
	const latest = usable.at(-1)?.weight;
	if (earliest === undefined || latest === undefined) return null;
	return roundToTenth(latest - earliest);
}

/** One decimal place. Zero is "No change" rather than "0.0 lb". */
export function formatWeightChange(change: number): string {
	if (!Number.isFinite(change)) return 'No change';
	const rounded = roundToTenth(change);
	if (rounded === 0) return 'No change';
	const amount = Math.abs(rounded).toFixed(1);
	return rounded < 0 ? `${amount} lb lost` : `${amount} lb gained`;
}
