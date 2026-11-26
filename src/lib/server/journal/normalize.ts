import { assessMileage, type MileageRecord, type MileageRejection } from '$lib/journal/mileage';

/** Public Field Journal fields. Every other Notion property stays unread. */
export const JOURNAL_PROPERTY_NAMES = ['Date', 'Miles Walked', 'Publish Public'] as const;

export class JournalShapeError extends Error {
	constructor() {
		super('Journal response was incomplete');
		this.name = 'JournalShapeError';
	}
}

export type JournalSnapshot =
	| { kind: 'records'; records: MileageRecord[] }
	| { kind: 'rejected'; rejections: MileageRejection[] };

function isPublic(property: unknown): boolean {
	if (!property || typeof property !== 'object') return false;
	return (property as { checkbox?: unknown }).checkbox === true;
}

function dateValue(property: unknown): unknown {
	if (!property || typeof property !== 'object') return property ?? null;
	const date = (property as { date?: unknown }).date;
	if (!date || typeof date !== 'object') return null;
	const start = (date as { start?: unknown }).start;
	return typeof start === 'string' ? start : null;
}

function milesValue(property: unknown): unknown {
	if (property === undefined || property === null) return null;
	if (typeof property !== 'object') return property;
	const number = (property as { number?: unknown }).number;
	return number === undefined ? null : number;
}

/**
 * Keep rows whose Publish Public checkbox is true, then keep only a date and mileage.
 * The checkbox filter in the query is repeated here. A false or missing checkbox is dropped.
 * A public row with a bad date or mileage rejects the snapshot instead of shrinking the total.
 */
export function projectPublicPages(pages: readonly unknown[]): JournalSnapshot {
	const rows: { date: unknown; miles: unknown }[] = [];
	for (const page of pages) {
		if (!page || typeof page !== 'object') throw new JournalShapeError();
		const properties = (page as { properties?: unknown }).properties;
		if (!properties || typeof properties !== 'object') throw new JournalShapeError();
		const record = properties as Record<string, unknown>;
		if (!isPublic(record['Publish Public'])) continue;
		rows.push({
			date: dateValue(record.Date),
			miles: milesValue(record['Miles Walked'])
		});
	}
	const assessed = assessMileage(rows);
	if (!assessed.ok) return { kind: 'rejected', rejections: assessed.rejections };
	return { kind: 'records', records: assessed.records };
}
