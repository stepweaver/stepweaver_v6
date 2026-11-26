import { isPublishedStatus, type RawWritingPage } from '$lib/writing/entries';
import { renderBlocks } from '$lib/writing/blocks';
import { coverImageSrc } from '$lib/writing/rich-text';
import type { RenderBlock } from '$lib/writing/types';

const DATA_SOURCE_VERSION = '2025-09-03';
const DATABASE_VERSION = '2022-06-28';

export type NotionFetcher = (url: string, init?: RequestInit) => Promise<Response>;

type NotionFile = {
	type?: string;
	external?: { url?: string };
	file?: { url?: string };
};

type NotionProperty = {
	type?: string;
	title?: { plain_text?: string }[];
	rich_text?: { plain_text?: string }[];
	multi_select?: { name?: string }[];
	select?: { name?: string } | null;
	status?: { name?: string } | null;
	date?: { start?: string } | null;
	checkbox?: boolean;
	files?: NotionFile[];
};

type NotionPage = {
	id: string;
	created_time?: string;
	last_edited_time?: string;
	cover?: NotionFile | null;
	properties?: Record<string, NotionProperty>;
};

export class NotionRequestError extends Error {
	operation: string;
	status: number;

	constructor(operation: string, status: number) {
		super(`Notion request failed (${status})`);
		this.name = 'NotionRequestError';
		this.operation = operation;
		this.status = status;
	}
}

/** A 200 that is truncated or missing its result list must not replace a good catalog. */
export class NotionIncompleteError extends Error {
	operation: string;

	constructor(operation: string) {
		super(`Notion ${operation} ended before the full result`);
		this.name = 'NotionIncompleteError';
		this.operation = operation;
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

function fileUrl(source: NotionFile | null | undefined): string {
	if (!source) return '';
	const raw = source.type === 'file' ? source.file?.url : source.external?.url;
	return coverImageSrc(raw) ?? '';
}

function coverValue(page: NotionPage, properties: Record<string, NotionProperty>): string {
	const property = properties['Cover Image'] ?? properties.Cover ?? properties.cover;
	if (property?.type === 'files') {
		for (const file of property.files ?? []) {
			const url = fileUrl(file);
			if (url) return url;
		}
	}
	return fileUrl(page.cover);
}

function featuredValue(property: NotionProperty | undefined): boolean {
	if (!property) return false;
	if (property.type === 'checkbox') return property.checkbox === true;
	const name = (property.select?.name ?? property.status?.name ?? '').trim().toLowerCase();
	return name === 'yes' || name === 'true' || name === 'featured';
}

export function pageToRaw(page: NotionPage): RawWritingPage | null {
	const properties = page.properties ?? {};
	const titleProp = properties.Title ?? properties.Name;
	const excerptProp =
		properties.Excerpt ?? properties.excerpt ?? properties.Description ?? properties.description;
	const descriptionProp = properties.Description ?? properties.description;
	const tldrProp = properties['TL;DR'] ?? properties.TLDR ?? properties.Tldr ?? properties['tl;dr'];
	const tagsProp = properties.Tags ?? properties.tags;
	const slugProp = properties.Slug ?? properties.slug;
	const statusProp = properties.Status ?? properties.status;
	if (!page.id) return null;
	return {
		id: page.id,
		title: plain(titleProp?.title),
		status: statusName(statusProp),
		excerpt: plain(excerptProp?.rich_text),
		description: plain(descriptionProp?.rich_text),
		tldr: plain(tldrProp?.rich_text),
		featured: featuredValue(properties.Featured ?? properties.featured),
		cover: coverValue(page, properties),
		tags: (tagsProp?.multi_select ?? []).map((tag) => tag.name ?? '').filter(Boolean),
		slugProperty: plain(slugProp?.rich_text),
		created: createdValue(page, properties.Date),
		edited: page.last_edited_time ?? ''
	};
}

async function readJson(response: Response, operation: string): Promise<Record<string, unknown>> {
	if (!response.ok) throw new NotionRequestError(operation, response.status);
	return (await response.json()) as Record<string, unknown>;
}

function isAuthOrAccess(error: unknown): error is NotionRequestError {
	return error instanceof NotionRequestError && (error.status === 401 || error.status === 403);
}

function statusTypeOf(body: Record<string, unknown>): string | undefined {
	const properties = body.properties;
	if (!properties || typeof properties !== 'object') return undefined;
	const status = (properties as Record<string, { type?: string }>).Status;
	return status?.type;
}

function selectedDataSourceId(body: Record<string, unknown>): string {
	if (!Array.isArray(body.data_sources)) return '';
	for (const source of body.data_sources) {
		if (!source || typeof source !== 'object') continue;
		const id = (source as { id?: unknown }).id;
		if (typeof id === 'string' && id) return id;
	}
	return '';
}

function publishedFilter(statusType: string | undefined) {
	if (statusType === 'status') {
		return { property: 'Status', status: { equals: 'Published' } };
	}
	return { property: 'Status', select: { equals: 'Published' } };
}

function pageResults(
	body: Record<string, unknown>,
	operation: string
): { results: unknown[]; next?: string } {
	if (!Array.isArray(body.results)) throw new NotionIncompleteError(operation);
	if (body.has_more !== true) return { results: body.results };
	if (typeof body.next_cursor !== 'string' || body.next_cursor.length === 0) {
		throw new NotionIncompleteError(operation);
	}
	return { results: body.results, next: body.next_cursor };
}

async function queryAll(
	fetcher: NotionFetcher,
	apiKey: string,
	version: string,
	url: string,
	filter: unknown,
	operation: string
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
		const body = await readJson(response, operation);
		const page = pageResults(body, operation);
		pages.push(...(page.results as NotionPage[]));
		if (!page.next) return pages;
		cursor = page.next;
	}
	throw new NotionIncompleteError(operation);
}

function queryLegacyDatabase(
	fetcher: NotionFetcher,
	apiKey: string,
	databaseId: string,
	statusType: string | undefined
): Promise<NotionPage[]> {
	return queryAll(
		fetcher,
		apiKey,
		DATABASE_VERSION,
		`https://api.notion.com/v1/databases/${databaseId}/query`,
		publishedFilter(statusType),
		'query database'
	);
}

export async function fetchPublishedPages(
	fetcher: NotionFetcher,
	apiKey: string,
	databaseId: string
): Promise<RawWritingPage[]> {
	const databaseUrl = `https://api.notion.com/v1/databases/${databaseId}`;
	let dataSourceId: string;
	let statusType: string | undefined;
	try {
		const retrieved = await fetcher(databaseUrl, {
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Notion-Version': DATA_SOURCE_VERSION
			}
		});
		const body = await readJson(retrieved, 'retrieve database');
		dataSourceId = selectedDataSourceId(body);
		statusType = statusTypeOf(body);
	} catch (error) {
		if (isAuthOrAccess(error)) throw error;
		dataSourceId = '';
	}

	if (dataSourceId) {
		try {
			const retrieved = await fetcher(`https://api.notion.com/v1/data_sources/${dataSourceId}`, {
				headers: {
					Authorization: `Bearer ${apiKey}`,
					'Notion-Version': DATA_SOURCE_VERSION
				}
			});
			const body = await readJson(retrieved, 'retrieve data source');
			const discovered = statusTypeOf(body);
			if (discovered) statusType = discovered;
		} catch (error) {
			if (isAuthOrAccess(error)) throw error;
			dataSourceId = '';
		}
	}

	let pages: NotionPage[];
	if (dataSourceId) {
		try {
			pages = await queryAll(
				fetcher,
				apiKey,
				DATA_SOURCE_VERSION,
				`https://api.notion.com/v1/data_sources/${dataSourceId}/query`,
				publishedFilter(statusType),
				'query data source'
			);
		} catch (error) {
			if (isAuthOrAccess(error) || error instanceof NotionIncompleteError) throw error;
			pages = await queryLegacyDatabase(fetcher, apiKey, databaseId, statusType);
		}
	} else {
		pages = await queryLegacyDatabase(fetcher, apiKey, databaseId, statusType);
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
		const body = await readJson(response, 'list blocks');
		const page = pageResults(body, 'list blocks');
		blocks.push(...(page.results as BlockRecord[]));
		if (!page.next) return blocks;
		cursor = page.next;
	}
	throw new NotionIncompleteError('list blocks');
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
