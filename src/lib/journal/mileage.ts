/**
 * Pure mileage math for public Field Journal records.
 * Stored dates are calendar days. They are never parsed as local timestamps.
 * The current day uses America/Indiana/Indianapolis.
 * Calculated totals are derived when the page is read. They are not stored.
 */

export const JOURNAL_TIME_ZONE = 'America/Indiana/Indianapolis';

/** Round distance marks. Progress points at the next one. There is no rank ladder. */
export const DISTANCE_MILESTONES = [
	10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000
] as const;

const MONTHS = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December'
] as const;

const SHORT_MONTHS = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec'
] as const;

export type MileageRecord = {
	date: string;
	miles: number | null;
};

export type RawMileageRow = {
	date: unknown;
	miles: unknown;
};

export type MileageRejectionReason =
	'duplicate-date' | 'invalid-date' | 'invalid-miles' | 'negative-miles';

export type MileageRejection = {
	reason: MileageRejectionReason;
	dates: string[];
};

export type PeriodTotal = {
	miles: number | null;
	walkingDays: number;
	recordedEntries: number;
	partial: boolean;
	start: string;
	end: string;
	label: string;
};

export type HistoryBucket = {
	key: string;
	label: string;
	axisLabel: string;
	start: string;
	end: string;
	miles: number | null;
	walkingDays: number;
	recordedEntries: number;
	partial: boolean;
};

export type MilestoneProgress = {
	recordedMiles: number;
	previousMiles: number;
	nextMiles: number | null;
	milesRemaining: number | null;
	progress: number;
};

export type MileageJournal = {
	totalMiles: number;
	walkingDays: number;
	recordedEntries: number;
	averageMiles: number | null;
	currentWeek: PeriodTotal;
	currentMonth: PeriodTotal;
	weeks: HistoryBucket[];
	months: HistoryBucket[];
	firstDate: string | null;
	lastDate: string | null;
	milestone: MilestoneProgress;
};

export type AssessedMileage =
	{ ok: true; records: MileageRecord[] } | { ok: false; rejections: MileageRejection[] };

const DATE_SHAPE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function calendarDate(value: string): string | null {
	const match = DATE_SHAPE.exec(value);
	if (!match) return null;
	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const date = new Date(Date.UTC(year, month - 1, day));
	if (
		date.getUTCFullYear() !== year ||
		date.getUTCMonth() !== month - 1 ||
		date.getUTCDate() !== day
	) {
		return null;
	}
	return `${match[1]}-${match[2]}-${match[3]}`;
}

export function addCalendarDays(isoDate: string, days: number): string {
	const [year, month, day] = isoDate.split('-').map(Number);
	const date = new Date(Date.UTC(year, month - 1, day + days));
	const y = date.getUTCFullYear();
	const m = String(date.getUTCMonth() + 1).padStart(2, '0');
	const d = String(date.getUTCDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

/** Monday of the calendar week that contains isoDate. Sunday belongs to the previous Monday. */
export function weekStartMonday(isoDate: string): string {
	const [year, month, day] = isoDate.split('-').map(Number);
	const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
	const delta = weekday === 0 ? -6 : 1 - weekday;
	return addCalendarDays(isoDate, delta);
}

export function localCalendarDay(instant: Date, timeZone = JOURNAL_TIME_ZONE): string {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).formatToParts(instant);
	const year = parts.find((part) => part.type === 'year')?.value;
	const month = parts.find((part) => part.type === 'month')?.value;
	const day = parts.find((part) => part.type === 'day')?.value;
	const iso = year && month && day ? `${year}-${month}-${day}` : '';
	const checked = calendarDate(iso);
	if (!checked) throw new Error('Local calendar day was not a date');
	return checked;
}

export function roundMiles(value: number): number {
	return Math.round(value * 1000) / 1000;
}

export function formatMiles(value: number): string {
	const rounded = roundMiles(value);
	const [whole, frac] = Math.abs(rounded).toString().split('.');
	const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	const text = frac ? `${withCommas}.${frac}` : withCommas;
	return rounded < 0 ? `-${text}` : text;
}

export function classifyMiles(
	value: unknown
):
	| { kind: 'missing' }
	| { kind: 'recorded'; miles: number }
	| { kind: 'rejected'; reason: 'invalid-miles' | 'negative-miles' } {
	if (value === null || value === undefined) return { kind: 'missing' };
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		return { kind: 'rejected', reason: 'invalid-miles' };
	}
	if (Object.is(value, -0)) return { kind: 'recorded', miles: 0 };
	if (value < 0) return { kind: 'rejected', reason: 'negative-miles' };
	return { kind: 'recorded', miles: value };
}

function echoedDate(value: unknown): string {
	if (typeof value !== 'string') return 'undated';
	const head = value.trim().slice(0, 10);
	return DATE_SHAPE.test(head) ? head : 'undated';
}

/** Calendar day for a Notion date `start`, including a value that also carries a time. */
export function calendarDay(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	return calendarDate(value.trim().slice(0, 10));
}

function dateInput(
	value: unknown
): { kind: 'date'; date: string } | { kind: 'invalid'; label: string } | { kind: 'missing' } {
	if (value === null || value === undefined || value === '') return { kind: 'missing' };
	const date = calendarDay(value);
	if (!date) return { kind: 'invalid', label: echoedDate(value) };
	return { kind: 'date', date };
}

function addRejection(
	groups: Map<MileageRejectionReason, string[]>,
	reason: MileageRejectionReason,
	label: string
) {
	const list = groups.get(reason) ?? [];
	if (!list.includes(label)) list.push(label);
	groups.set(reason, list);
}

/**
 * Accept public rows or refuse the set.
 * Duplicate dates are listed and are not totaled. Invalid rows are not coerced to zero.
 */
export function assessMileage(rows: readonly RawMileageRow[]): AssessedMileage {
	const groups = new Map<MileageRejectionReason, string[]>();
	const records: MileageRecord[] = [];
	for (const row of rows) {
		const date = dateInput(row.date);
		if (date.kind !== 'date') {
			addRejection(groups, 'invalid-date', date.kind === 'invalid' ? date.label : 'undated');
			continue;
		}
		const miles = classifyMiles(row.miles);
		if (miles.kind === 'rejected') {
			addRejection(groups, miles.reason, date.date);
			continue;
		}
		records.push({ date: date.date, miles: miles.kind === 'missing' ? null : miles.miles });
	}

	const counts = new Map<string, number>();
	for (const record of records) counts.set(record.date, (counts.get(record.date) ?? 0) + 1);
	for (const [date, count] of counts) {
		if (count > 1) addRejection(groups, 'duplicate-date', date);
	}

	if (groups.size > 0) {
		const rejections = [...groups.entries()].map(([reason, dates]) => ({
			reason,
			dates: [...dates].sort()
		}));
		return { ok: false, rejections };
	}

	records.sort((a, b) => a.date.localeCompare(b.date));
	return { ok: true, records };
}

function assertClean(records: readonly MileageRecord[]) {
	const seen = new Set<string>();
	for (const record of records) {
		if (!calendarDate(record.date)) throw new Error(`Rejected mileage date: ${record.date}`);
		if (seen.has(record.date)) throw new Error(`Duplicate mileage date: ${record.date}`);
		seen.add(record.date);
		if (record.miles === null) continue;
		if (!Number.isFinite(record.miles) || record.miles < 0) {
			throw new Error(`Rejected mileage date: ${record.date}`);
		}
	}
}

function sumRecords(records: readonly MileageRecord[]) {
	let total = 0;
	let positive = 0;
	let walking = 0;
	let recorded = 0;
	for (const record of records) {
		if (record.miles === null) continue;
		recorded += 1;
		total = roundMiles(total + record.miles);
		if (record.miles > 0) {
			walking += 1;
			positive = roundMiles(positive + record.miles);
		}
	}
	return { total, positive, walking, recorded };
}

function lastDayOfMonth(key: string): string {
	const [year, month] = key.split('-').map(Number);
	const last = new Date(Date.UTC(year, month, 0));
	const y = last.getUTCFullYear();
	const m = String(last.getUTCMonth() + 1).padStart(2, '0');
	const d = String(last.getUTCDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

function addMonth(key: string): string {
	const [year, month] = key.split('-').map(Number);
	const next = new Date(Date.UTC(year, month, 1));
	const y = next.getUTCFullYear();
	const m = String(next.getUTCMonth() + 1).padStart(2, '0');
	return `${y}-${m}`;
}

export function formatJournalDate(isoDate: string): string {
	const date = calendarDate(isoDate) ?? isoDate;
	const month = SHORT_MONTHS[Number(date.slice(5, 7)) - 1] ?? date.slice(5, 7);
	return `${month} ${Number(date.slice(8, 10))}`;
}

function shortDate(isoDate: string): string {
	return formatJournalDate(isoDate);
}

function monthLabel(key: string): string {
	const month = MONTHS[Number(key.slice(5, 7)) - 1] ?? key;
	return `${month} ${key.slice(0, 4)}`;
}

function isPartial(
	start: string,
	end: string,
	first: string | null,
	last: string | null,
	today: string
): boolean {
	if (end > today) return true;
	if (first && start < first) return true;
	if (last && end > last) return true;
	return false;
}

function periodStats(
	records: readonly MileageRecord[],
	start: string,
	end: string,
	first: string | null,
	last: string | null,
	today: string,
	label: string
): PeriodTotal {
	const stats = sumRecords(records.filter((record) => record.date >= start && record.date <= end));
	return {
		miles: stats.recorded === 0 ? null : stats.total,
		walkingDays: stats.walking,
		recordedEntries: stats.recorded,
		partial: isPartial(start, end, first, last, today),
		start,
		end,
		label
	};
}

function weeksBetween(
	records: readonly MileageRecord[],
	first: string,
	last: string,
	today: string
): HistoryBucket[] {
	const buckets: HistoryBucket[] = [];
	const finalWeek = weekStartMonday(last);
	for (
		let start = weekStartMonday(first);
		start <= finalWeek && buckets.length < 520;
		start = addCalendarDays(start, 7)
	) {
		const end = addCalendarDays(start, 6);
		const stats = sumRecords(
			records.filter((record) => record.date >= start && record.date <= end)
		);
		const month = Number(start.slice(5, 7));
		const day = Number(start.slice(8, 10));
		buckets.push({
			key: start,
			label: `${shortDate(start)} – ${shortDate(end)}`,
			axisLabel: `${month}/${day}`,
			start,
			end,
			miles: stats.recorded === 0 ? null : stats.total,
			walkingDays: stats.walking,
			recordedEntries: stats.recorded,
			partial: isPartial(start, end, first, last, today)
		});
	}
	return buckets;
}

function monthsBetween(
	records: readonly MileageRecord[],
	first: string,
	last: string,
	today: string
): HistoryBucket[] {
	const buckets: HistoryBucket[] = [];
	const finalMonth = last.slice(0, 7);
	for (
		let key = first.slice(0, 7);
		key <= finalMonth && buckets.length < 240;
		key = addMonth(key)
	) {
		const start = `${key}-01`;
		const end = lastDayOfMonth(key);
		const stats = sumRecords(
			records.filter((record) => record.date >= start && record.date <= end)
		);
		buckets.push({
			key,
			label: monthLabel(key),
			axisLabel: SHORT_MONTHS[Number(key.slice(5, 7)) - 1] ?? key,
			start,
			end,
			miles: stats.recorded === 0 ? null : stats.total,
			walkingDays: stats.walking,
			recordedEntries: stats.recorded,
			partial: isPartial(start, end, first, last, today)
		});
	}
	return buckets;
}

export function milestoneFor(totalMiles: number): MilestoneProgress {
	let previous = 0;
	let next: number | null = DISTANCE_MILESTONES[0];
	for (const mark of DISTANCE_MILESTONES) {
		if (totalMiles >= mark) {
			previous = mark;
			next = null;
			continue;
		}
		next = mark;
		break;
	}
	if (next === null) {
		return {
			recordedMiles: totalMiles,
			previousMiles: previous,
			nextMiles: null,
			milesRemaining: null,
			progress: 1
		};
	}
	const span = next - previous;
	return {
		recordedMiles: totalMiles,
		previousMiles: previous,
		nextMiles: next,
		milesRemaining: roundMiles(next - totalMiles),
		progress: span === 0 ? 0 : (totalMiles - previous) / span
	};
}

/**
 * Totals for a clean set of records.
 * A duplicate or invalid value throws. Callers must use assessMileage first.
 * Miles of null are omitted. Zero is kept and is not a walking day.
 * A period with no recorded mileage stays null so it is not shown as zero.
 * partial means the calendar period is still open or clipped by the first or last record.
 * It does not mean every day in a closed period was observed.
 */
export function summarizeMileage(records: readonly MileageRecord[], today: string): MileageJournal {
	const day = calendarDate(today);
	if (!day) throw new Error('today is not a calendar date');
	assertClean(records);
	const ordered = [...records].sort((a, b) => a.date.localeCompare(b.date));
	const totals = sumRecords(ordered);
	const firstDate = ordered[0]?.date ?? null;
	const lastDate = ordered.at(-1)?.date ?? null;
	const weekStart = weekStartMonday(day);
	const weekEnd = addCalendarDays(weekStart, 6);
	const month = day.slice(0, 7);
	const monthStart = `${month}-01`;
	const monthEnd = lastDayOfMonth(month);
	return {
		totalMiles: totals.total,
		walkingDays: totals.walking,
		recordedEntries: totals.recorded,
		averageMiles: totals.walking > 0 ? roundMiles(totals.positive / totals.walking) : null,
		currentWeek: periodStats(
			ordered,
			weekStart,
			weekEnd,
			firstDate,
			lastDate,
			day,
			`${shortDate(weekStart)} – ${shortDate(weekEnd)}`
		),
		currentMonth: periodStats(
			ordered,
			monthStart,
			monthEnd,
			firstDate,
			lastDate,
			day,
			monthLabel(month)
		),
		weeks: firstDate && lastDate ? weeksBetween(ordered, firstDate, lastDate, day) : [],
		months: firstDate && lastDate ? monthsBetween(ordered, firstDate, lastDate, day) : [],
		firstDate,
		lastDate,
		milestone: milestoneFor(totals.total)
	};
}
