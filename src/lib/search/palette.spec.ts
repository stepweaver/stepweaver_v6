import { describe, expect, it, vi } from 'vitest';
import { LAMBDA } from '$lib/text/lambda';
import { getCatalogRecords, getPublicWorkCards } from '$lib/projects/publication';
import {
	DESTINATION_ALIASES,
	SHELL_DESTINATIONS,
	type ShellDestination
} from '$lib/terminal/routes';
import { THEME_IDS } from '$lib/theme/themes';
import { FIXTURE_DRAFT_TITLE, fixtureEntries } from '$lib/writing/fixtures';
import {
	openSharedChatDraft,
	registerSharedChatDraft,
	sharedChatReady
} from '$lib/chat/shared-draft';
import { paletteFrame, paletteGroups, type PaletteEntry, type PaletteProject } from './palette';

const base = {
	destinations: SHELL_DESTINATIONS,
	aliases: DESTINATION_ALIASES,
	writing: fixtureEntries().map((post) => ({
		slug: post.slug,
		title: post.title,
		excerpt: post.excerpt,
		tags: post.tags
	})),
	projects: [] as PaletteProject[],
	themes: THEME_IDS,
	chat: false,
	query: ''
};

function entries(query: string, extra: Partial<typeof base> = {}): PaletteEntry[] {
	return paletteGroups({ ...base, ...extra, query }).flatMap((group) => group.items);
}

function hrefs(items: PaletteEntry[]): string[] {
	return items.flatMap((item) => (item.action.kind === 'navigate' ? [item.action.href] : []));
}

describe('command palette index', () => {
	it('groups public routes, published writing, and appearance actions', () => {
		const groups = paletteGroups(base);
		expect(groups.map((group) => group.label)).toEqual(['Navigate', 'Writing', 'Appearance']);
		const quiet = hrefs(entries(''));
		expect(quiet).toContain('/dice-roller');
		expect(quiet).toContain('/terminal');
		expect(quiet).toContain('/field-journal');
		expect(quiet).not.toContain('/services');
		expect(quiet).not.toContain('/work');
		expect(quiet).not.toContain('/lab');
		expect(quiet).not.toContain('/play');
		expect(hrefs(entries(''))).toContain('/writing/workflow-handoffs');
		expect(
			entries('skynet').some(
				(item) => item.action.kind === 'theme' && item.action.theme === 'skynet'
			)
		).toBe(true);
	});

	it('matches navigation aliases without leaving the local index', () => {
		expect(hrefs(entries('codex'))).toContain('/writing');
		expect(hrefs(entries('dice'))).toContain('/dice-roller');
		expect(hrefs(entries('what-i-do'))).toEqual(['/services']);
		expect(hrefs(entries('work'))).toContain('/work');
		expect(hrefs(entries('lab'))).not.toContain('/lab');
		expect(hrefs(entries('play'))).not.toContain('/play');
		expect(hrefs(entries('~'))).toContain('/');
		expect(entries('handoff').map((item) => item.label)).toContain('Workflow handoffs');
	});

	it('includes the dice roller only when that route is served', () => {
		const withoutDice: ShellDestination[] = SHELL_DESTINATIONS.filter(
			(destination) => destination.href !== '/dice-roller'
		);
		expect(hrefs(entries('dice', { destinations: withoutDice }))).not.toContain('/dice-roller');
		expect(hrefs(entries('roller', { destinations: withoutDice }))).not.toContain('/dice-roller');
	});

	it('keeps retired routes and unpublished records out', () => {
		const retired: ShellDestination = {
			name: 'footwear',
			href: '/footwear',
			external: false
		};
		const projects = getPublicWorkCards().map((card) => ({
			slug: card.slug,
			title: card.title,
			description: card.description,
			tags: card.tags
		}));
		const blob = JSON.stringify(
			paletteGroups({
				...base,
				destinations: [...SHELL_DESTINATIONS, retired],
				projects,
				query: ''
			})
		);
		expect(blob).toContain('/field-journal');
		expect(blob).not.toContain('/field-journal/lab');
		expect(blob).not.toContain('/footwear');
		expect(blob).not.toContain('/meshtastic');
		expect(blob).not.toContain('/mail-sort-academy');
		expect(blob).not.toContain('/yankee-samurai');
		expect(blob).not.toContain('/for-agents');
		expect(blob).not.toContain(FIXTURE_DRAFT_TITLE);
		for (const record of getCatalogRecords()) {
			if (record.publication === 'public') continue;
			expect(blob).not.toContain(`/work/${record.slug}`);
			expect(blob).not.toContain(record.slug);
			if (record.title === 'Field Journal') continue;
			expect(blob).not.toContain(record.title);
		}
		expect(blob).not.toContain('equipment roster');
	});

	it('lists an approved project and still hides a retired route searched by name', () => {
		const found = entries('parcel', {
			projects: [
				{
					slug: 'parcel-sweep',
					title: 'Parcel Sweep',
					description: 'Field stops',
					tags: ['operations']
				}
			]
		});
		expect(hrefs(found)).toEqual(['/work/parcel-sweep']);
		expect(hrefs(entries('meshtastic'))).not.toContain('/meshtastic');
		expect(hrefs(entries('field journal'))).toContain('/field-journal');
	});

	it('adds Ask λlambda only when shared chat is ready and the query is a draft', () => {
		expect(
			entries('what is a handoff', { chat: false }).some((item) => item.action.kind === 'ask')
		).toBe(false);
		expect(entries('   ', { chat: true }).some((item) => item.action.kind === 'ask')).toBe(false);
		const ask = entries('what is a handoff', { chat: true }).find(
			(item) => item.action.kind === 'ask'
		);
		expect(ask?.label).toBe(`Ask ${LAMBDA}lambda`);
		expect(ask?.label).not.toContain(String.fromCodePoint(0x039b));
		expect(ask?.action).toEqual({ kind: 'ask', draft: 'what is a handoff' });
		expect(ask?.group).toBe('Ask');
		const ordered = paletteGroups({ ...base, chat: true, query: 'writing' });
		expect(ordered.at(-1)?.label).toBe('Ask');
		expect(ordered[0]?.items[0]?.action.kind).not.toBe('ask');
	});
});

describe('palette viewport', () => {
	it('pins the dialog to the visual viewport when the keyboard shifts it', () => {
		const frame = paletteFrame({ height: 360, offsetTop: 300, layoutHeight: 844 });
		expect(frame.top).toBe(308);
		expect(frame.maxHeight).toBe(344);
		expect(frame.top + frame.maxHeight).toBeLessThanOrEqual(300 + 360);
	});

	it('uses a short panel on a tall screen and the visible height on a phone', () => {
		const desktop = paletteFrame({ height: 900, offsetTop: 0, layoutHeight: 900 });
		expect(desktop.top).toBe(135);
		expect(desktop.maxHeight).toBe(558);
		const phone = paletteFrame({ height: 420, offsetTop: 0, layoutHeight: 420 });
		expect(phone.top).toBe(8);
		expect(phone.maxHeight).toBe(404);
		expect(phone.top + phone.maxHeight).toBeLessThanOrEqual(420);
	});
});

describe('shared chat draft', () => {
	it('hands the draft to the registered opener and does not fetch', () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		expect(sharedChatReady()).toBe(false);
		expect(openSharedChatDraft('hello')).toBe(false);
		const drafts: string[] = [];
		const release = registerSharedChatDraft((draft) => {
			drafts.push(draft);
		});
		expect(sharedChatReady()).toBe(true);
		expect(openSharedChatDraft('what is a handoff')).toBe(true);
		expect(drafts).toEqual(['what is a handoff']);
		expect(fetchMock).not.toHaveBeenCalled();
		release();
		expect(sharedChatReady()).toBe(false);
		vi.unstubAllGlobals();
	});
});
