import { describe, expect, it } from 'vitest';
import { renderBlocks } from './blocks';
import {
	filterByTag,
	findByPageId,
	findBySlug,
	paginateWriting,
	toWritingEntries,
	type RawWritingPage
} from './entries';
import { PUBLISHED_PAGE_SLUGS } from './slug-registry';
import { slugifyTitle } from './slug';
import { safeHref, safeImageSrc } from './rich-text';
import { renderWritingRss } from './rss';

describe('published url registry', () => {
	it('keeps the live title slugs for every audited page', () => {
		expect(PUBLISHED_PAGE_SLUGS).toHaveLength(10);
		for (const row of PUBLISHED_PAGE_SLUGS) {
			expect(slugifyTitle(row.title)).toBe(row.slug);
		}
		expect(slugifyTitle('λsigil: First Contact')).toBe('sigil-first-contact');
	});
});

describe('writing entries', () => {
	const pages: RawWritingPage[] = [
		{
			id: '359bc620-4ba0-80b8-8c9e-d28168da82f7',
			title: 'How I Found My Professional Positioning',
			status: 'Published',
			excerpt: 'A pattern.',
			tags: ['career'],
			slugProperty: 'ignored-because-the-registry-is-frozen',
			created: '2026-05-07T14:05:00.000Z',
			edited: '2026-05-08T02:38:00.000Z'
		},
		{
			id: '3cabc620-4ba0-80f4-b1c2-c22a453e23e5',
			title: 'On Sneeze Guards',
			status: 'Draft',
			excerpt: 'Hidden.',
			tags: ['systems'],
			slugProperty: '',
			created: '2026-08-28T00:05:00.000Z',
			edited: '2026-08-28T02:02:00.000Z'
		},
		{
			id: 'new-page-id',
			title: 'A New Note',
			status: 'Published',
			excerpt: '',
			tags: ['Systems'],
			slugProperty: 'authored-slug',
			created: '2026-09-01T00:00:00.000Z',
			edited: '2026-09-01T00:00:00.000Z'
		}
	];

	it('hides unpublished pages and freezes an existing url ahead of a slug property', () => {
		const posts = toWritingEntries(pages);
		expect(posts.map((post) => post.slug)).toEqual([
			'authored-slug',
			'how-i-found-my-professional-positioning'
		]);
		expect(posts.some((post) => post.title === 'On Sneeze Guards')).toBe(false);
		const frozen = posts[1];
		expect(frozen.legacySlugs).toContain('ignored-because-the-registry-is-frozen');
		expect(findBySlug(posts, 'ignored-because-the-registry-is-frozen')).toEqual({
			kind: 'redirect',
			slug: 'how-i-found-my-professional-positioning'
		});
		expect(findByPageId(posts, '359bc6204ba080b88c9ed28168da82f7')?.slug).toBe(
			'how-i-found-my-professional-positioning'
		);
	});

	it('paginates and filters without dropping the rest of the archive', () => {
		const posts = toWritingEntries([
			...pages,
			{
				id: 'another',
				title: 'Third',
				status: 'Published',
				excerpt: '',
				tags: ['operations'],
				slugProperty: '',
				created: '2026-01-01',
				edited: '2026-01-01'
			},
			{
				id: 'fourth',
				title: 'Fourth',
				status: 'Published',
				excerpt: '',
				tags: [],
				slugProperty: '',
				created: '2025-01-01',
				edited: '2025-01-01'
			},
			{
				id: 'fifth',
				title: 'Fifth',
				status: 'Published',
				excerpt: '',
				tags: [],
				slugProperty: '',
				created: '2024-01-01',
				edited: '2024-01-01'
			},
			{
				id: 'sixth',
				title: 'Sixth',
				status: 'Published',
				excerpt: '',
				tags: [],
				slugProperty: '',
				created: '2023-01-01',
				edited: '2023-01-01'
			}
		]);
		const page = paginateWriting(posts, 2);
		expect(page.pages).toBe(2);
		expect(page.items).toHaveLength(1);
		expect(filterByTag(posts, '#Systems').map((post) => post.slug)).toEqual(['authored-slug']);
	});
});

describe('notion block rendering', () => {
	it('renders the supported blocks and drops unsafe urls', () => {
		const blocks = renderBlocks([
			{ type: 'heading_2', heading_2: { rich_text: [{ plain_text: 'A heading' }] } },
			{
				type: 'paragraph',
				paragraph: {
					rich_text: [
						{ plain_text: 'See ', annotations: {} },
						{ plain_text: 'this', href: 'javascript:alert(1)' },
						{ plain_text: ' and ', annotations: {} },
						{ plain_text: 'docs', href: 'https://example.com/docs', annotations: { bold: true } }
					]
				}
			},
			{
				type: 'bulleted_list_item',
				bulleted_list_item: { rich_text: [{ plain_text: 'One' }] }
			},
			{
				type: 'bulleted_list_item',
				bulleted_list_item: { rich_text: [{ plain_text: 'Two' }] }
			},
			{ type: 'quote', quote: { rich_text: [{ plain_text: 'Quoted' }] } },
			{
				type: 'code',
				code: { rich_text: [{ plain_text: 'const n = 1;' }], language: 'typescript' }
			},
			{ type: 'image', image: { type: 'external', external: { url: 'http://example.com/a.png' } } },
			{
				type: 'image',
				image: {
					type: 'file',
					file: { url: 'https://example.com/a.png' },
					caption: [{ plain_text: 'Diagram' }]
				}
			}
		]);
		expect(blocks.map((block) => block.type)).toEqual([
			'heading',
			'paragraph',
			'list',
			'quote',
			'code',
			'image'
		]);
		const paragraph = blocks[1];
		expect(paragraph.type).toBe('paragraph');
		if (paragraph.type === 'paragraph') {
			expect(paragraph.spans[1]?.href).toBeUndefined();
			expect(paragraph.spans[3]?.href).toBe('https://example.com/docs');
		}
		const list = blocks[2];
		expect(list.type === 'list' && list.items).toHaveLength(2);
		expect(safeHref('javascript:alert(1)')).toBeUndefined();
		expect(safeImageSrc('http://example.com/a.png')).toBeUndefined();
	});
});

describe('writing rss', () => {
	it('includes published entries and escapes the title', () => {
		const xml = renderWritingRss([
			{
				id: 'page-1',
				title: 'Notes & <systems>',
				slug: 'notes',
				legacySlugs: [],
				date: '2026-09-01',
				updated: '2026-09-01',
				excerpt: 'A note',
				tags: []
			}
		]);
		expect(xml).toContain('<title>Notes &amp; &lt;systems&gt;</title>');
		expect(xml).toContain('https://stepweaver.dev/writing/notes');
		expect(xml).toContain('page-1');
		expect(xml).not.toContain('<systems>');
	});
});
