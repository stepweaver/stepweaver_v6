import { plainText, richSpans, safeImageSrc } from './rich-text';
import type { RenderBlock, RichSpan } from './types';

type NotionBlock = {
	type?: string;
	has_children?: boolean;
	children?: NotionBlock[];
	[key: string]: unknown;
};

type RichPayload = {
	rich_text?: Parameters<typeof richSpans>[0];
	caption?: Parameters<typeof richSpans>[0];
	language?: string;
	type?: string;
	external?: { url?: string };
	file?: { url?: string };
};

function payload(block: NotionBlock): RichPayload | null {
	if (!block.type) return null;
	const value = block[block.type];
	if (!value || typeof value !== 'object') return null;
	return value as RichPayload;
}

function headingId(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80);
}

function heading(block: NotionBlock, level: 2 | 3 | 4): RenderBlock | null {
	const text = plainText(payload(block)?.rich_text).trim();
	if (!text) return null;
	return { type: 'heading', level, text, id: headingId(text) };
}

function imageBlock(block: NotionBlock): RenderBlock | null {
	const image = payload(block);
	if (!image) return null;
	const raw = image.type === 'external' ? image.external?.url : image.file?.url;
	const src = safeImageSrc(raw);
	if (!src) return null;
	const alt = plainText(image.caption).trim() || 'Article image';
	return { type: 'image', src, alt };
}

function listItemSpans(block: NotionBlock): RichSpan[] {
	const key = block.type === 'numbered_list_item' ? 'numbered_list_item' : 'bulleted_list_item';
	const value = block[key];
	if (!value || typeof value !== 'object') return [];
	return richSpans((value as RichPayload).rich_text);
}

export function renderBlocks(blocks: NotionBlock[] | null | undefined): RenderBlock[] {
	if (!blocks?.length) return [];
	const rendered: RenderBlock[] = [];

	for (const block of blocks) {
		if (!block?.type) continue;
		const last = rendered[rendered.length - 1];

		if (block.type === 'bulleted_list_item' || block.type === 'numbered_list_item') {
			const ordered = block.type === 'numbered_list_item';
			const item = listItemSpans(block);
			if (last?.type === 'list' && last.ordered === ordered) {
				last.items.push(item);
			} else {
				rendered.push({ type: 'list', ordered, items: [item] });
			}
			continue;
		}

		if (block.type === 'paragraph') {
			const spans = richSpans(payload(block)?.rich_text);
			rendered.push({ type: 'paragraph', spans });
			continue;
		}
		if (block.type === 'heading_1') {
			const next = heading(block, 2);
			if (next) rendered.push(next);
			continue;
		}
		if (block.type === 'heading_2') {
			const next = heading(block, 3);
			if (next) rendered.push(next);
			continue;
		}
		if (block.type === 'heading_3') {
			const next = heading(block, 4);
			if (next) rendered.push(next);
			continue;
		}
		if (block.type === 'quote' || block.type === 'callout') {
			rendered.push({ type: 'quote', spans: richSpans(payload(block)?.rich_text) });
			continue;
		}
		if (block.type === 'code') {
			rendered.push({
				type: 'code',
				text: plainText(payload(block)?.rich_text),
				language: payload(block)?.language || ''
			});
			continue;
		}
		if (block.type === 'divider') {
			rendered.push({ type: 'divider' });
			continue;
		}
		if (block.type === 'image') {
			const next = imageBlock(block);
			if (next) rendered.push(next);
			continue;
		}

		rendered.push({ type: 'unsupported', name: block.type });
	}

	return rendered;
}
