import { dev } from '$app/environment';
import {
	calendarDate,
	localCalendarDay,
	summarizeMileage,
	type MileageJournal,
	type MileageRecord,
	type MileageRejection
} from '$lib/journal/mileage';
import { publishedWeightChange } from '$lib/journal/weight';
import { cachedWriting, FRESH_MS, within, type CacheOptions } from '$lib/server/writing/cache';
import {
	NotionIncompleteError,
	NotionRequestError,
	queryNotionDatabase,
	type NotionFetcher
} from '$lib/server/writing/notion';

import { FIXTURE_TODAY, fixtureMileageRecords, fixtureWeighIns } from './fixtures';
import { JOURNAL_PROPERTY_NAMES, projectPublicPages, type JournalSnapshot } from './normalize';

/**
 * A public snapshot older than this is not served when Notion fails.
 * This is the writing cache fresh window. Expired entries are not a fallback.
 * Mileage totals are rebuilt from the cached records and are not stored.
 * The snapshot stores the derived weight change because the weigh-ins are not stored.
 */
export const JOURNAL_PUBLICATION_WINDOW_MS = FRESH_MS;

const PUBLIC_FILTER = {
	property: 'Publish Public',
	checkbox: { equals: true }
} as const;

export type FieldJournalState =
	| { status: 'unconfigured' }
	| { status: 'unavailable' }
	| { status: 'empty' }
	| { status: 'rejected'; rejections: MileageRejection[] }
	| { status: 'ok'; journal: MileageJournal; weightChangeLbs: number | null };

export type JournalRequest = CacheOptions & {
	source?: string;
	apiKey?: string;
	databaseId?: string;
	fetcher?: NotionFetcher;
	now?: number;
	/** Tests force this. The page does not pass a visitor-controlled clock. */
	today?: string;
	/** Production builds pass false so JOURNAL_SOURCE=fixture cannot publish synthetic miles. */
	allowFixture?: boolean;
};

export function journalCacheKey(databaseId: string): string {
	return `journal:v1:${databaseId.trim()}:public-mileage`;
}

function isRecord(value: unknown): value is MileageRecord {
	if (!value || typeof value !== 'object') return false;
	const record = value as Record<string, unknown>;
	const keys = Object.keys(record);
	if (keys.length !== 2 || !keys.includes('date') || !keys.includes('miles')) return false;
	if (typeof record.date !== 'string' || !calendarDate(record.date)) return false;
	if (record.miles === null) return true;
	return typeof record.miles === 'number' && Number.isFinite(record.miles) && record.miles >= 0;
}

function isWeightChange(value: unknown): value is number | null {
	return value === null || (typeof value === 'number' && Number.isFinite(value));
}

function isSnapshot(value: unknown): value is JournalSnapshot {
	if (!value || typeof value !== 'object') return false;
	const record = value as Record<string, unknown>;
	if (record.kind === 'records') {
		const keys = Object.keys(record);
		if (keys.length !== 3 || !keys.includes('records') || !keys.includes('weightChangeLbs')) {
			return false;
		}
		if (!isWeightChange(record.weightChangeLbs)) return false;
		return Array.isArray(record.records) && record.records.every(isRecord);
	}
	if (record.kind !== 'rejected' || !Array.isArray(record.rejections)) return false;
	return record.rejections.every((item) => {
		if (!item || typeof item !== 'object') return false;
		const rejection = item as Record<string, unknown>;
		const reason = rejection.reason;
		return (
			(reason === 'duplicate-date' ||
				reason === 'invalid-date' ||
				reason === 'invalid-miles' ||
				reason === 'negative-miles') &&
			Array.isArray(rejection.dates) &&
			rejection.dates.every(
				(date) => typeof date === 'string' && date.length > 0 && date.length < 16
			)
		);
	});
}

function logFailure(error: unknown): void {
	if (error instanceof NotionRequestError) {
		console.error(error.operation, error.status);
		return;
	}
	if (error instanceof NotionIncompleteError) {
		console.error(error.operation);
		return;
	}
	console.error('journal mileage');
}

async function fetchSnapshot(request: JournalRequest, apiKey: string, databaseId: string) {
	const controller = new AbortController();
	const fetcher: NotionFetcher = (url, init) => {
		controller.signal.throwIfAborted();
		return (request.fetcher ?? fetch)(url, {
			...init,
			signal: controller.signal,
			redirect: 'manual'
		});
	};
	try {
		return await within(
			(async () => {
				const pages = await queryNotionDatabase(fetcher, apiKey, databaseId, {
					filterFor: () => PUBLIC_FILTER,
					propertyNames: JOURNAL_PROPERTY_NAMES
				});
				return projectPublicPages(pages);
			})(),
			8_000
		);
	} catch (error) {
		logFailure(error);
		throw error;
	} finally {
		controller.abort();
	}
}

function presentRecords(
	records: MileageRecord[],
	today: string,
	weightChangeLbs: number | null
): FieldJournalState {
	if (records.length === 0) return { status: 'empty' };
	try {
		return { status: 'ok', journal: summarizeMileage(records, today), weightChangeLbs };
	} catch {
		return { status: 'unavailable' };
	}
}

export async function loadPublicMileage(request: JournalRequest = {}): Promise<FieldJournalState> {
	const source = request.source?.trim().toLowerCase();
	const allowFixture = request.allowFixture ?? dev;
	if (source === 'unavailable') return { status: 'unavailable' };
	if (source === 'fixture') {
		if (!allowFixture) return { status: 'unavailable' };
		return presentRecords(
			fixtureMileageRecords(),
			FIXTURE_TODAY,
			publishedWeightChange(fixtureWeighIns())
		);
	}

	const apiKey = request.apiKey?.trim();
	const databaseId = request.databaseId?.trim();
	if (!apiKey || !databaseId) return { status: 'unconfigured' };

	const result = await cachedWriting(
		journalCacheKey(databaseId),
		{ ...request, acceptStale: false, nonBlocking: false },
		isSnapshot,
		() => fetchSnapshot(request, apiKey, databaseId)
	);
	if (!result || result.stale) return { status: 'unavailable' };
	if (result.value.kind === 'rejected') {
		return { status: 'rejected', rejections: result.value.rejections };
	}
	const today =
		(request.today && calendarDate(request.today)) ||
		localCalendarDay(new Date(request.now ?? Date.now()));
	return presentRecords(result.value.records, today, result.value.weightChangeLbs);
}
