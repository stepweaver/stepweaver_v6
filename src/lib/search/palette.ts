import { LAMBDA } from '$lib/text/lambda';
import type { ShellDestination } from '$lib/terminal/routes';
import type { ThemeId } from '$lib/theme/themes';

export type PaletteWriting = {
	slug: string;
	title: string;
	excerpt: string;
	tags: readonly string[];
};

export type PaletteProject = {
	slug: string;
	title: string;
	description: string;
	tags: readonly string[];
};

export type PaletteAction =
	| { kind: 'navigate'; href: string; external: boolean }
	| { kind: 'theme'; theme: ThemeId }
	| { kind: 'theme-toggle' }
	| { kind: 'ask'; draft: string };

export type PaletteEntry = {
	id: string;
	group: string;
	label: string;
	meta: string;
	haystack: string;
	action: PaletteAction;
};

export type PaletteGroup = {
	label: string;
	items: PaletteEntry[];
};

export type PaletteViewport = {
	height: number;
	offsetTop: number;
	layoutHeight: number;
};

const GROUP_ORDER = ['Navigate', 'Writing', 'Work', 'Appearance', 'Ask'] as const;

/** Routes this app does not serve. They stay out even if a caller lists them. */
const RETIRED_HREFS = new Set([
	'/field-journal',
	'/field-journal/lab',
	'/meshtastic',
	'/mail-sort-academy',
	'/yankee-samurai',
	'/for-agents',
	'/footwear',
	'/work/archive',
	'/lab',
	'/play'
]);

/** Direct URLs that stay searchable, but are not offered on an empty palette. */
const QUIET_HREFS = new Set(['/services', '/work']);

const ROUTE_COPY: Record<string, { label: string; meta: string }> = {
	home: { label: 'Home', meta: '' },
	about: { label: 'About', meta: '' },
	services: { label: 'What I Do', meta: 'Services' },
	writing: { label: 'Writing', meta: 'Published notes' },
	work: { label: 'Work', meta: 'Approved case studies' },
	resume: { label: 'Resume', meta: '' },
	contact: { label: 'Contact', meta: '' },
	privacy: { label: 'Privacy', meta: '' },
	terminal: { label: 'Terminal', meta: 'Command console' },
	'dice-roller': { label: 'Dice Roller', meta: 'Standalone roller' },
	github: { label: 'GitHub', meta: 'stepweaver' }
};

function clip(value: string, max = 72): string {
	const trimmed = value.replace(/\s+/g, ' ').trim();
	if (trimmed.length <= max) return trimmed;
	return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function pile(parts: readonly string[]): string {
	return parts.join(' ').toLowerCase();
}

function matches(haystack: string, query: string): boolean {
	const needle = query.toLowerCase().replace(/\s+/g, ' ').trim();
	if (!needle) return true;
	return needle.split(' ').every((part) => haystack.includes(part));
}

function aliasesFor(name: string, aliases: Readonly<Record<string, string>>): string[] {
	return Object.entries(aliases)
		.filter(([, target]) => target === name)
		.map(([alias]) => alias);
}

function routeEntries(
	destinations: readonly ShellDestination[],
	aliases: Readonly<Record<string, string>>,
	query: string
): PaletteEntry[] {
	const quiet = query.replace(/\s+/g, ' ').trim() === '';
	const items: PaletteEntry[] = [];
	for (const destination of destinations) {
		if (RETIRED_HREFS.has(destination.href)) continue;
		if (quiet && QUIET_HREFS.has(destination.href)) continue;
		const copy = ROUTE_COPY[destination.name] ?? {
			label: destination.name,
			meta: destination.external ? destination.href : ''
		};
		const aliasList = aliasesFor(destination.name, aliases);
		items.push({
			id: `route:${destination.href}`,
			group: 'Navigate',
			label: copy.label,
			meta: copy.meta,
			haystack: pile([
				copy.label,
				copy.meta,
				destination.name,
				destination.href,
				destination.name.replaceAll('-', ' '),
				...aliasList
			]),
			action: {
				kind: 'navigate',
				href: destination.href,
				external: destination.external
			}
		});
	}
	return items;
}

function writingEntries(posts: readonly PaletteWriting[]): PaletteEntry[] {
	return posts.map((post) => ({
		id: `writing:${post.slug}`,
		group: 'Writing',
		label: post.title,
		meta: post.tags[0] ?? clip(post.excerpt),
		haystack: pile([
			post.title,
			post.excerpt,
			post.slug,
			post.slug.replaceAll('-', ' '),
			...post.tags
		]),
		action: { kind: 'navigate', href: `/writing/${post.slug}`, external: false }
	}));
}

function projectEntries(projects: readonly PaletteProject[]): PaletteEntry[] {
	return projects.map((project) => ({
		id: `work:${project.slug}`,
		group: 'Work',
		label: project.title,
		meta: project.tags[0] ?? clip(project.description),
		haystack: pile([
			project.title,
			project.description,
			project.slug,
			project.slug.replaceAll('-', ' '),
			...project.tags
		]),
		action: { kind: 'navigate', href: `/work/${project.slug}`, external: false }
	}));
}

function appearanceEntries(themes: readonly ThemeId[]): PaletteEntry[] {
	const toggle: PaletteEntry = {
		id: 'theme:toggle',
		group: 'Appearance',
		label: 'Switch light and dark',
		meta: 'Appearance',
		haystack: pile(['switch light dark appearance theme']),
		action: { kind: 'theme-toggle' }
	};
	const items = themes.map((theme) => ({
		id: `theme:${theme}`,
		group: 'Appearance',
		label: `Theme: ${theme}`,
		meta: 'Appearance',
		haystack: pile([theme, theme.replaceAll('-', ' '), 'theme', 'appearance']),
		action: { kind: 'theme' as const, theme }
	}));
	return [toggle, ...items];
}

function askEntry(query: string): PaletteEntry {
	const draft = query.replace(/\s+/g, ' ').trim();
	return {
		id: 'ask-lambda',
		group: 'Ask',
		label: `Ask ${LAMBDA}lambda`,
		meta: 'Draft',
		haystack: pile([`ask ${LAMBDA}lambda`, draft]),
		action: { kind: 'ask', draft }
	};
}

export function paletteGroups(input: {
	destinations: readonly ShellDestination[];
	aliases: Readonly<Record<string, string>>;
	writing: readonly PaletteWriting[];
	projects: readonly PaletteProject[];
	themes: readonly ThemeId[];
	chat: boolean;
	query: string;
}): PaletteGroup[] {
	const query = input.query;
	const items = [
		...routeEntries(input.destinations, input.aliases, query),
		...writingEntries(input.writing),
		...projectEntries(input.projects),
		...appearanceEntries(input.themes)
	].filter((item) => matches(item.haystack, query));

	const draft = query.replace(/\s+/g, ' ').trim();
	if (input.chat && draft) items.push(askEntry(draft));

	return GROUP_ORDER.map((label) => ({
		label,
		items: items.filter((item) => item.group === label)
	})).filter((group) => group.items.length > 0);
}

/** Keep the dialog inside the visual viewport so results stay above the keyboard. */
export function paletteFrame(visual: PaletteViewport): { top: number; maxHeight: number } {
	const gap = 8;
	const offset = Number.isFinite(visual.offsetTop) ? Math.max(0, visual.offsetTop) : 0;
	const seen =
		Number.isFinite(visual.height) && visual.height > 0 ? visual.height : visual.layoutHeight;
	const layout =
		Number.isFinite(visual.layoutHeight) && visual.layoutHeight > 0 ? visual.layoutHeight : seen;
	const keyboard = offset > 0 || layout - seen - offset > 48;
	if (keyboard || seen <= 720) {
		return { top: offset + gap, maxHeight: Math.max(0, seen - gap * 2) };
	}
	const inset = Math.round(seen * 0.15);
	return {
		top: offset + inset,
		maxHeight: Math.min(Math.round(seen * 0.62), seen - inset - gap)
	};
}
