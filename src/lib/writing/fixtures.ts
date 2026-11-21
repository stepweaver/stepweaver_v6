import { toWritingEntries, type RawWritingPage } from './entries';
import type { RenderBlock, WritingEntry } from './types';

const RENAMED_ID = 'fixture000-0000-4000-8000-000000000001';

const RAW_PAGES: RawWritingPage[] = [
	{
		id: 'fixture000-0000-4000-8000-000000000099',
		title: 'Unpublished operations note',
		status: 'Draft',
		excerpt: 'This draft must not appear on the site.',
		tags: ['systems'],
		slugProperty: '',
		created: '2026-10-01T12:00:00.000Z',
		edited: '2026-10-01T12:00:00.000Z'
	},
	{
		id: 'fixture000-0000-4000-8000-000000000010',
		title: 'Workflow handoffs',
		status: 'Published',
		excerpt: 'Where a handoff drops the work, and what the system has to remember.',
		tags: ['systems', 'operations'],
		slugProperty: '',
		created: '2026-09-01T12:00:00.000Z',
		edited: '2026-09-02T12:00:00.000Z'
	},
	{
		id: 'fixture000-0000-4000-8000-000000000020',
		title: 'Integration boundaries',
		status: 'Published',
		excerpt: 'The line between the tools a team already has and the software that joins them.',
		tags: ['systems'],
		slugProperty: '',
		created: '2026-07-15T12:00:00.000Z',
		edited: '2026-07-15T12:00:00.000Z'
	},
	{
		id: 'fixture000-0000-4000-8000-000000000030',
		title: 'Automation and review',
		status: 'Published',
		excerpt: 'Automation removes a brittle step. Someone still owns the result.',
		tags: ['automation'],
		slugProperty: '',
		created: '2026-05-02T12:00:00.000Z',
		edited: '2026-05-02T12:00:00.000Z'
	},
	{
		id: 'fixture000-0000-4000-8000-000000000040',
		title: 'Field notes on requirements',
		status: 'Published',
		excerpt: 'A requirement is a workflow, not a sentence in a ticket.',
		tags: ['requirements'],
		slugProperty: '',
		created: '2026-03-01T12:00:00.000Z',
		edited: '2026-03-01T12:00:00.000Z'
	},
	{
		id: 'fixture000-0000-4000-8000-000000000050',
		title: 'A smaller operational tool',
		status: 'Published',
		excerpt: 'Small tools still need a boundary and a failure mode.',
		tags: [],
		slugProperty: '',
		created: '2026-01-20T12:00:00.000Z',
		edited: '2026-01-20T12:00:00.000Z'
	},
	{
		id: RENAMED_ID,
		title: 'Renamed after publication',
		status: 'Published',
		excerpt: 'The public URL stays on the original slug.',
		tags: ['career'],
		slugProperty: '',
		created: '2025-11-02T12:00:00.000Z',
		edited: '2025-11-02T12:00:00.000Z'
	}
];

const FIXTURE_BLOCKS: Record<string, RenderBlock[]> = {
	'fixture000-0000-4000-8000-000000000010': [
		{ type: 'heading', level: 3, text: 'The handoff', id: 'the-handoff' },
		{
			type: 'paragraph',
			spans: [
				{ text: 'The work has to land somewhere ' },
				{ text: 'specific', bold: true },
				{ text: '.' }
			]
		},
		{ type: 'quote', spans: [{ text: 'If nobody owns the exception, the system does not.' }] },
		{
			type: 'list',
			ordered: false,
			items: [[{ text: 'Name the sender' }], [{ text: 'Name the receiver' }]]
		},
		{ type: 'code', text: 'status = received', language: 'plain text' },
		{
			type: 'paragraph',
			spans: [{ text: 'A public note', href: 'https://stepweaver.dev/writing' }]
		},
		{
			type: 'image',
			src: 'https://example.com/handoff.png',
			alt: 'Diagram of a handoff'
		}
	]
};

export function fixtureEntries(): WritingEntry[] {
	return toWritingEntries(RAW_PAGES, { [RENAMED_ID]: 'original-stable-slug' });
}

export function fixtureArticleBlocks(pageId: string): RenderBlock[] {
	return (
		FIXTURE_BLOCKS[pageId] ?? [{ type: 'paragraph', spans: [{ text: 'Fixture article body.' }] }]
	);
}

export const FIXTURE_DRAFT_TITLE = 'Unpublished operations note';
export const FIXTURE_RENAMED_CANONICAL = 'original-stable-slug';
