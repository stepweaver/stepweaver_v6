import { isPublishedStatus, type RawWritingPage } from '$lib/writing/entries';
import { renderBlocks } from '$lib/writing/blocks';
import type { RenderBlock } from '$lib/writing/types';

const DATA_SOURCE_VERSION = '2025-09-03';
const DATABASE_VERSION = '2022-06-28';

export type NotionFetcher = (url: string, init?: RequestInit) => Promise<Response>;

type NotionProperty = {
	type?: string;
	title?: { plain_text?: string }[];
	rich_text?: { plain_text?: string }[];
	multi_select?: { name?: string }[];
	select?: { name?: string } | null;
	status?: { name?: string } | null;
	date?: { start?: string } | null;
};

type NotionPage = {
	id: string;
	created_time?: string;
	last_edited_time?: string;
	properties?: Record<string, NotionProperty>;
};

export class NotionRequestError extends Error {
	status: number;

	constructor(status: number) {
		super(`Notion request failed (${status})`);
		this.status = status;
	}
}

function plain(parts: { plain_text?: string }[] | undefined): string {
	return (parts ?? []).map((part) => part.plain_text ?? '').join('');
}

function statusName(property: NotionProperty | undefined): string | null {
	if (!property) return null;
	if (property.type === 'select') return property.select?.name ?? null;
	if (property.type === 'status') return property.status?.name ?? null;
	return null;
}

function createdValue(page: NotionPage, property: NotionProperty | undefined): string {
	if (property?.type === 'date' && property.date?.start) return property.date.start;
	return page.created_time ?? '';
}

export function pageToRaw(page: NotionPage): RawWritingPage | null {
	const properties = page.properties ?? {};
	const titleProp = properties.Title ?? properties.Name;
	const excerptProp = properties.Excerpt ?? properties.Description;
	const tagsProp = properties.Tags ?? properties.tags;
	const slugProp = properties.Slug ?? properties.slug;
	const statusProp = properties.Status ?? properties.status;
	if (!page.id) return null;
	return {
		id: page.id,
		title: plain(titleProp?.title),
		status: statusName(statusProp),
		excerpt: plain(excerptProp?.rich_text),
		tags: (tagsProp?.multi_select ?? []).map((tag) => tag.name ?? '').filter(Boolean),
		slugProperty: plain(slugProp?.rich_text),
		created: createdValue(page, properties.Date),
		edited: page.last_edited_time ?? ''
	};
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
	if (!response.ok) throw new NotionRequestError(response.status);
	return (await response.json()) as Record<string, unknown>;
}

function publishedFilter(statusType: string | undefined) {
	if (statusType === 'status') {
		return { property: 'Status', status: { equals: 'Published' } };
	}
	return { property: 'Status', select: { equals: 'Published' } };
}

async function queryAll(
	fetcher: NotionFetcher,
	apiKey: string,
	version: string,
	url: string,
	filter: unknown
): Promise<NotionPage[]> {
	const pages: NotionPage[] = [];
	let cursor: string | undefined;
	for (let attempt = 0; attempt < 20; attempt += 1) {
		const response = await fetcher(url, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Notion-Version': version,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				filter,
				page_size: 100,
				...(cursor ? { start_cursor: cursor } : {})
			})
		});
		const body = await readJson(response);
		const results = Array.isArray(body.results) ? (body.results as NotionPage[]) : [];
		pages.push(...results);
		if (!body.has_more || typeof body.next_cursor !== 'string') break;
		cursor = body.next_cursor;
	}
	return pages;
}

export async function fetchPublishedPages(
	fetcher: NotionFetcher,
	apiKey: string,
	databaseId: string
): Promise<RawWritingPage[]> {
	const databaseUrl = `https://api.notion.com/v1/databases/${databaseId}`;
	let dataSourceId = '';
	let statusType: string | undefined;
	try {
		const retrieved = await fetcher(databaseUrl, {
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Notion-Version': DATA_SOURCE_VERSION
			}
		});
		const body = await readJson(retrieved);
		const sources = Array.isArray(body.data_sources) ? body.data_sources : [];
		const first = sources[0] as { id?: string } | undefined;
		if (first?.id) dataSourceId = first.id;
		const properties = body.properties as Record<string, { type?: string }> | undefined;
		statusType = properties?.Status?.type;
	} catch {
		dataSourceId = '';
	}

	const filter = publishedFilter(statusType);
	let pages: NotionPage[];
	if (dataSourceId) {
		try {
			pages = await queryAll(
				fetcher,
				apiKey,
				DATA_SOURCE_VERSION,
				`https://api.notion.com/v1/data_sources/${dataSourceId}/query`,
				filter
			);
		} catch {
			pages = await queryAll(
				fetcher,
				apiKey,
				DATABASE_VERSION,
				`https://api.notion.com/v1/databases/${databaseId}/query`,
				publishedFilter('select')
			);
		}
	} else {
		pages = await queryAll(
			fetcher,
			apiKey,
			DATABASE_VERSION,
			`https://api.notion.com/v1/databases/${databaseId}/query`,
			publishedFilter('select')
		);
	}

	return pages
		.map(pageToRaw)
		.filter((page): page is RawWritingPage => page !== null && isPublishedStatus(page.status));
}

type BlockRecord = {
	id?: string;
	type?: string;
	has_children?: boolean;
	[key: string]: unknown;
};

async function listChildren(
	fetcher: NotionFetcher,
	apiKey: string,
	blockId: string
): Promise<BlockRecord[]> {
	const blocks: BlockRecord[] = [];
	let cursor: string | undefined;
	for (let attempt = 0; attempt < 20; attempt += 1) {
		const url = new URL(`https://api.notion.com/v1/blocks/${blockId}/children`);
		url.searchParams.set('page_size', '100');
		if (cursor) url.searchParams.set('start_cursor', cursor);
		const response = await fetcher(url.toString(), {
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Notion-Version': DATABASE_VERSION
			}
		});
		const body = await readJson(response);
		const results = Array.isArray(body.results) ? (body.results as BlockRecord[]) : [];
		blocks.push(...results);
		if (!body.has_more || typeof body.next_cursor !== 'string') break;
		cursor = body.next_cursor;
	}
	return blocks;
}

export async function fetchPageBlocks(
	fetcher: NotionFetcher,
	apiKey: string,
	pageId: string
): Promise<RenderBlock[]> {
	const blocks = await listChildren(fetcher, apiKey, pageId);
	for (const block of blocks) {
		if (block.type === 'table' && block.has_children && block.id) {
			block.children = await listChildren(fetcher, apiKey, block.id);
		}
	}
	return renderBlocks(blocks);
}
