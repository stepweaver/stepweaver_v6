import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FRESH_MS, clearCache } from '$lib/server/writing/cache';
import type { NotionFetcher } from '$lib/server/writing/notion';

import {
	BLANK_MILEAGE_WEIGH_INS,
	CHRONOLOGICAL_WEIGH_INS,
	INSUFFICIENT_WEIGH_INS,
	UNPUBLISHED_WEIGH_INS,
	type SyntheticJournalRow
} from './fixtures';
import { JOURNAL_PUBLICATION_WINDOW_MS, journalCacheKey, loadPublicMileage } from './load';

const DATABASE = 'db-id';
const SECRET_NOTE = 'private locker note';
const SECRET_WEIGHT = 181.4;
const PAGE_ID = 'page-should-not-leak';

type PageInput = {
	date?: string | null;
	miles?: number | string | null;
	publish?: boolean | null;
	id?: string;
	weight?: unknown;
};

function properties() {
	return {
		Date: { id: 'date-id', type: 'date' },
		'Miles Walked': { id: 'miles-id', type: 'number' },
		'Publish Public': { id: 'public-id', type: 'checkbox' },
		'Private Note': { id: 'note-id', type: 'rich_text' },
		'Weight Lbs': { id: 'weight-id', type: 'number' },
		'DPS Count': { id: 'dps-id', type: 'number' }
	};
}

function page(input: PageInput) {
	return {
		id: input.id ?? PAGE_ID,
		properties: {
			Date: { type: 'date', date: input.date ? { start: input.date } : null },
			'Miles Walked': {
				type: 'number',
				number: input.miles === undefined ? null : input.miles
			},
			'Publish Public': {
				type: 'checkbox',
				checkbox: input.publish === undefined ? true : input.publish
			},
			'Private Note': { type: 'rich_text', rich_text: [{ plain_text: SECRET_NOTE }] },
			'Weight Lbs': {
				type: 'number',
				number: input.weight === undefined ? SECRET_WEIGHT : input.weight
			},
			'DPS Count': { type: 'number', number: 440 },
			Title: { type: 'title', title: [{ plain_text: 'carrier route 4' }] }
		}
	};
}

function fetcherFor(options: {
	pages?: ReturnType<typeof page>[];
	status?: number;
	body?: unknown;
	hasMore?: boolean;
	pagesToServe?: number;
}) {
	const calls: { url: string; init?: RequestInit }[] = [];
	let queries = 0;
	const fetcher: NotionFetcher = async (url, init) => {
		calls.push({ url, init });
		if (url.includes('/query')) {
			queries += 1;
		} else if (url.includes('/data_sources/')) {
			return Response.json({ properties: properties() });
		} else if (url.includes('/databases/')) {
			return Response.json({
				data_sources: [{ id: 'source-1' }],
				properties: properties()
			});
		} else {
			return new Response('unexpected', { status: 404 });
		}
		if (options.status) return new Response('nope', { status: options.status });
		if (options.body) return Response.json(options.body);
		if (options.hasMore) {
			return Response.json({
				results: options.pages ?? [],
				has_more: true
			});
		}
		if (options.pagesToServe) {
			const cursor = init?.body ? JSON.parse(String(init.body)).start_cursor : undefined;
			const index = cursor ? Number(cursor) : 0;
			const last = index + 1 >= options.pagesToServe;
			return Response.json({
				results: [page({ date: `2026-05-${String(index + 1).padStart(2, '0')}`, miles: 1 })],
				has_more: !last,
				next_cursor: last ? null : String(index + 1)
			});
		}
		return Response.json({
			results: options.pages ?? [],
			has_more: false,
			next_cursor: null
		});
	};
	return {
		fetcher,
		calls,
		queries: () => queries
	};
}

function pagesFor(rows: readonly SyntheticJournalRow[]) {
	return rows.map((row, index) =>
		page({
			date: row.date,
			miles: row.miles,
			weight: row.weight,
			publish: row.publish !== false,
			id: row.publish === false ? `hidden-${index}` : `row-${index}`
		})
	);
}

function request(partial: Parameters<typeof loadPublicMileage>[0] & { fetcher: NotionFetcher }) {
	return {
		source: 'notion',
		apiKey: 'secret',
		databaseId: DATABASE,
		allowFixture: false,
		today: '2026-11-26',
		now: 1_000,
		...partial
	};
}

describe('public mileage loader', () => {
	afterEach(() => {
		clearCache();
		vi.restoreAllMocks();
	});

	it('uses a five-minute publication window and its own cache key', () => {
		expect(JOURNAL_PUBLICATION_WINDOW_MS).toBe(FRESH_MS);
		expect(JOURNAL_PUBLICATION_WINDOW_MS).toBe(5 * 60_000);
		expect(journalCacheKey(DATABASE)).toBe('journal:v1:db-id:public-mileage');
		expect(journalCacheKey(DATABASE)).not.toContain('writing');
	});

	it('keeps public mileage and the derived weight change, and asks Notion for those properties', async () => {
		const mock = fetcherFor({
			pages: [
				page({ date: '2026-11-02', miles: 3.5, publish: true }),
				page({ date: '2026-11-03', miles: 9, publish: false, id: 'hidden-page' }),
				page({ date: '2026-11-04', miles: null, publish: true }),
				page({ date: '2026-11-23', miles: 0, publish: true })
			]
		});
		const state = await loadPublicMileage(request({ fetcher: mock.fetcher }));
		expect(state.status).toBe('ok');
		if (state.status !== 'ok') return;
		expect(state.journal.totalMiles).toBe(3.5);
		expect(state.journal.walkingDays).toBe(1);
		expect(state.journal.recordedEntries).toBe(2);
		expect(state.journal.averageMiles).toBe(3.5);
		expect(state.weightChangeLbs).toBe(0);
		const blob = JSON.stringify(state);
		expect(blob).not.toContain(SECRET_NOTE);
		expect(blob).not.toContain(String(SECRET_WEIGHT));
		expect(blob).not.toContain(PAGE_ID);
		expect(blob).not.toContain('hidden-page');
		expect(blob).not.toContain('carrier route');
		expect(blob).not.toContain('DPS');
		expect(blob).not.toContain('Weight');
		const query = mock.calls.find((call) => call.url.includes('/query'));
		expect(query?.url).toContain('filter_properties=date-id');
		expect(query?.url).toContain('filter_properties=miles-id');
		expect(query?.url).toContain('filter_properties=public-id');
		expect(query?.url).toContain('filter_properties=weight-id');
		expect(query?.url).not.toContain('note-id');
		expect(query?.url).not.toContain('dps-id');
		expect(query?.init?.redirect).toBe('manual');
		const body = JSON.parse(String(query?.init?.body));
		expect(body.filter).toEqual({
			property: 'Publish Public',
			checkbox: { equals: true }
		});
		expect(body.page_size).toBe(100);
	});

	it('does not replace a failed or truncated response with an empty journal', async () => {
		const missing = fetcherFor({ body: { has_more: false } });
		await expect(loadPublicMileage(request({ fetcher: missing.fetcher }))).resolves.toEqual({
			status: 'unavailable'
		});
		clearCache();
		const truncated = fetcherFor({
			hasMore: true,
			pages: [page({ date: '2026-11-02', miles: 4 })]
		});
		await expect(loadPublicMileage(request({ fetcher: truncated.fetcher }))).resolves.toEqual({
			status: 'unavailable'
		});
		clearCache();
		const failed = fetcherFor({ status: 500 });
		await expect(loadPublicMileage(request({ fetcher: failed.fetcher }))).resolves.toEqual({
			status: 'unavailable'
		});
		clearCache();
		const redirect = fetcherFor({ status: 302 });
		await expect(loadPublicMileage(request({ fetcher: redirect.fetcher }))).resolves.toEqual({
			status: 'unavailable'
		});
		expect(redirect.calls.every((call) => call.init?.redirect === 'manual')).toBe(true);
	});

	it('stops after the bounded page cap instead of publishing a partial total', async () => {
		const mock = fetcherFor({ pagesToServe: 21 });
		await expect(loadPublicMileage(request({ fetcher: mock.fetcher }))).resolves.toEqual({
			status: 'unavailable'
		});
		expect(mock.queries()).toBe(20);
	});

	it('reports duplicate and invalid public rows without totaling them', async () => {
		const duplicates = fetcherFor({
			pages: [
				page({ date: '2026-05-08', miles: 111.1, weight: 333.3 }),
				page({ date: '2026-05-08', miles: 222.2, weight: 444.4 })
			]
		});
		const duplicate = await loadPublicMileage(request({ fetcher: duplicates.fetcher }));
		expect(duplicate.status).toBe('rejected');
		if (duplicate.status !== 'rejected') return;
		expect(duplicate.rejections).toEqual([{ reason: 'duplicate-date', dates: ['2026-05-08'] }]);
		expect(JSON.stringify(duplicate)).not.toContain('111.1');
		expect(JSON.stringify(duplicate)).not.toContain('222.2');
		expect(JSON.stringify(duplicate)).not.toContain('333.3');
		expect(JSON.stringify(duplicate)).not.toContain('444.4');
		clearCache();
		const invalid = fetcherFor({
			pages: [page({ date: '2026-05-09', miles: -4, weight: 177.5 })]
		});
		const rejected = await loadPublicMileage(request({ fetcher: invalid.fetcher }));
		expect(rejected).toEqual({
			status: 'rejected',
			rejections: [{ reason: 'negative-miles', dates: ['2026-05-09'] }]
		});
		expect(JSON.stringify(rejected)).not.toContain('177.5');
	});

	it('does not serve an expired snapshot when the next read fails', async () => {
		const mock = fetcherFor({ pages: [page({ date: '2026-11-02', miles: 4 })] });
		const first = await loadPublicMileage(request({ fetcher: mock.fetcher, now: 1_000 }));
		expect(first.status).toBe('ok');
		expect(mock.queries()).toBe(1);
		const fresh = await loadPublicMileage(request({ fetcher: mock.fetcher, now: 2_000 }));
		expect(fresh.status).toBe('ok');
		expect(mock.queries()).toBe(1);

		mock.fetcher = async () => {
			throw new Error('notion down');
		};
		const expired = await loadPublicMileage(
			request({ fetcher: mock.fetcher, now: 1_000 + FRESH_MS })
		);
		expect(expired).toEqual({ status: 'unavailable' });
	});

	it('serves an actually empty public query as empty', async () => {
		const mock = fetcherFor({ pages: [] });
		await expect(loadPublicMileage(request({ fetcher: mock.fetcher }))).resolves.toEqual({
			status: 'empty'
		});
	});

	it('serves fixtures only in an explicit development fixture mode', async () => {
		const fetcher = vi.fn<NotionFetcher>();
		const live = await loadPublicMileage({
			source: 'fixture',
			allowFixture: false,
			fetcher,
			apiKey: 'secret',
			databaseId: DATABASE
		});
		expect(live).toEqual({ status: 'unavailable' });
		expect(JSON.stringify(live)).not.toContain('12.5');
		expect(fetcher).not.toHaveBeenCalled();

		const fixture = await loadPublicMileage({ source: 'fixture', allowFixture: true, fetcher });
		expect(fixture.status).toBe('ok');
		if (fixture.status !== 'ok') return;
		expect(fixture.journal.totalMiles).toBe(16);
		expect(fixture.journal.walkingDays).toBe(4);
		expect(fixture.journal.averageMiles).toBe(4);
		expect(fixture.journal.currentWeek.miles).toBe(12.5);
		expect(fixture.journal.currentMonth.miles).toBe(16);
		expect(fixture.weightChangeLbs).toBe(-4.8);
		const fixtureBlob = JSON.stringify(fixture);
		expect(fixtureBlob).not.toContain('210');
		expect(fixtureBlob).not.toContain('208');
		expect(fixtureBlob).not.toContain('205.2');
		expect(fetcher).not.toHaveBeenCalled();

		await expect(loadPublicMileage({ source: 'unavailable', fetcher })).resolves.toEqual({
			status: 'unavailable'
		});
		await expect(loadPublicMileage({ source: 'notion', allowFixture: false })).resolves.toEqual({
			status: 'unconfigured'
		});
		expect(fetcher).not.toHaveBeenCalled();
	});

	it('fails closed when the allowlisted properties are missing and does not query pages', async () => {
		const calls: string[] = [];
		const fetcher: NotionFetcher = async (url) => {
			calls.push(url);
			if (url.includes('/query')) return Response.json({ results: [], has_more: false });
			return Response.json({
				data_sources: [{ id: 'source-1' }],
				properties: { Title: { id: 'title-id', type: 'title' } }
			});
		};
		await expect(loadPublicMileage(request({ fetcher, databaseId: 'other-db' }))).resolves.toEqual({
			status: 'unavailable'
		});
		expect(calls.some((url) => url.includes('/query'))).toBe(false);
	});

	it('sorts published weigh-ins by date and does not change the mileage total', async () => {
		const mock = fetcherFor({ pages: pagesFor(CHRONOLOGICAL_WEIGH_INS) });
		const state = await loadPublicMileage(
			request({ fetcher: mock.fetcher, databaseId: 'chrono-db' })
		);
		expect(state.status).toBe('ok');
		if (state.status !== 'ok') return;
		expect(state.journal.totalMiles).toBe(6);
		expect(state.journal.walkingDays).toBe(3);
		expect(state.weightChangeLbs).toBe(-10);
		const blob = JSON.stringify(state);
		expect(blob).not.toContain('200');
		expect(blob).not.toContain('190');
		expect(blob).not.toContain('195.4');
		const query = mock.calls.find((call) => call.url.includes('/query'));
		const body = JSON.parse(String(query?.init?.body));
		expect(body.filter).toEqual({
			property: 'Publish Public',
			checkbox: { equals: true }
		});
		expect(body.sorts).toBeUndefined();
	});

	it('counts a weigh-in whose mileage is blank', async () => {
		const mock = fetcherFor({ pages: pagesFor(BLANK_MILEAGE_WEIGH_INS) });
		const state = await loadPublicMileage(
			request({ fetcher: mock.fetcher, databaseId: 'blank-miles-db' })
		);
		expect(state.status).toBe('ok');
		if (state.status !== 'ok') return;
		expect(state.journal.totalMiles).toBe(7);
		expect(state.journal.recordedEntries).toBe(2);
		expect(state.journal.walkingDays).toBe(2);
		expect(state.weightChangeLbs).toBe(-4.2);
		const blob = JSON.stringify(state);
		expect(blob).not.toContain('184.2');
		expect(blob).not.toContain('180');
	});

	it('ignores an unpublished weigh-in', async () => {
		const mock = fetcherFor({ pages: pagesFor(UNPUBLISHED_WEIGH_INS) });
		const state = await loadPublicMileage(
			request({ fetcher: mock.fetcher, databaseId: 'private-weight-db' })
		);
		expect(state.status).toBe('ok');
		if (state.status !== 'ok') return;
		expect(state.journal.totalMiles).toBe(7);
		expect(state.weightChangeLbs).toBe(-10);
		const blob = JSON.stringify(state);
		expect(blob).not.toContain('250');
		expect(blob).not.toContain('200');
		expect(blob).not.toContain('190');
		expect(blob).not.toContain('195');
		expect(blob).not.toContain('hidden-');
	});

	it('omits the change when fewer than two valid published weigh-ins exist', async () => {
		const mock = fetcherFor({ pages: pagesFor(INSUFFICIENT_WEIGH_INS) });
		const state = await loadPublicMileage(
			request({ fetcher: mock.fetcher, databaseId: 'sparse-weight-db' })
		);
		expect(state.status).toBe('ok');
		if (state.status !== 'ok') return;
		expect(state.journal.totalMiles).toBe(8);
		expect(state.journal.recordedEntries).toBe(4);
		expect(state.weightChangeLbs).toBeNull();
		const blob = JSON.stringify(state);
		expect(blob).not.toContain('180');
		expect(blob).not.toContain('n/a');
		expect(blob).not.toContain('-4');
	});

	it('does not reuse a cached snapshot that lacks the derived change or stores weigh-ins', async () => {
		const key = journalCacheKey('stale-weight-db');
		const store = new Map<string, string>();
		store.set(
			key,
			JSON.stringify({
				at: 1_000,
				value: {
					kind: 'records',
					records: [{ date: '2026-11-02', miles: 4 }],
					weights: [210, 205.2]
				}
			})
		);
		const cache = {
			async get(storedKey: string) {
				return store.get(storedKey) ?? null;
			},
			async put(storedKey: string, value: string) {
				store.set(storedKey, value);
			}
		};
		const mock = fetcherFor({
			pages: [
				page({ date: '2026-11-02', miles: 4, weight: 200 }),
				page({ date: '2026-11-03', miles: 1, weight: 198 })
			]
		});
		const state = await loadPublicMileage(
			request({ fetcher: mock.fetcher, cache, now: 1_500, databaseId: 'stale-weight-db' })
		);
		expect(mock.queries()).toBe(1);
		expect(state.status).toBe('ok');
		if (state.status !== 'ok') return;
		expect(state.journal.totalMiles).toBe(5);
		expect(state.weightChangeLbs).toBe(-2);
		const blob = JSON.stringify(state);
		expect(blob).not.toContain('210');
		expect(blob).not.toContain('205.2');
		expect(blob).not.toContain('200');
		expect(blob).not.toContain('198');
		expect(store.get(key)).not.toContain('210');
		expect(store.get(key)).not.toContain('200');
	});

	it('fails closed when Weight Lbs is missing from the schema and does not query pages', async () => {
		const calls: string[] = [];
		const fetcher: NotionFetcher = async (url) => {
			calls.push(url);
			if (url.includes('/query')) return Response.json({ results: [], has_more: false });
			return Response.json({
				data_sources: [{ id: 'source-1' }],
				properties: {
					Date: { id: 'date-id', type: 'date' },
					'Miles Walked': { id: 'miles-id', type: 'number' },
					'Publish Public': { id: 'public-id', type: 'checkbox' }
				}
			});
		};
		await expect(
			loadPublicMileage(request({ fetcher, databaseId: 'missing-weight' }))
		).resolves.toEqual({ status: 'unavailable' });
		expect(calls.some((url) => url.includes('/query'))).toBe(false);
	});

	it('does not let unrelated routes load the journal', () => {
		const files = [
			'src/routes/(marketing)/+page.server.ts',
			'src/routes/(marketing)/+layout.server.ts',
			'src/routes/(marketing)/writing/+page.server.ts',
			'src/routes/(marketing)/work/+page.server.ts',
			'src/routes/(marketing)/contact/+page.server.ts',
			'src/routes/sitemap.xml/+server.ts'
		];
		for (const file of files) {
			const source = readFileSync(join(process.cwd(), file), 'utf8');
			expect(source).not.toContain('$lib/server/journal');
			expect(source).not.toContain('loadPublicMileage');
		}
	});
});
