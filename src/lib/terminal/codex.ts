import { formatWritingDate } from '$lib/writing/entries';
import { normalizeTag } from '$lib/writing/slug';
import type { WritingSourceState } from '$lib/writing/types';
import type { TerminalLine } from './types';

export type CodexPost = {
	title: string;
	slug: string;
	date: string;
	updated: string;
	excerpt: string;
	tags: string[];
};

export type CodexLibrary = {
	status: WritingSourceState;
	posts: CodexPost[];
};

function line(
	content: string,
	variant: TerminalLine['variant'] = 'default',
	href?: string
): TerminalLine {
	return href ? { content, variant, href } : { content, variant };
}

export function codexHelpLines(): TerminalLine[] {
	return [
		line('Codex shell', 'success'),
		line('ls: list posts   cat <n|slug>: open post   grep <tag>: filter'),
		line('pwd: path   clear: clear screen   exit | cancel: leave codex', 'dimmed'),
		line('')
	];
}

export function codexOpening(library: CodexLibrary): TerminalLine[] {
	const status =
		library.status === 'unconfigured'
			? 'Writing is not configured, so there are no posts to list.'
			: library.status === 'unavailable'
				? 'Writing could not be loaded.'
				: library.posts.length === 1
					? '1 published post.'
					: library.posts.length
						? `${library.posts.length} published posts.`
						: 'No published posts.';
	return [...codexHelpLines(), line(status, 'dimmed'), line('Type ls to list posts.', 'dimmed')];
}

export function runCodexCommand(
	input: string,
	library: CodexLibrary
): { lines: TerminalLine[]; exit?: boolean; clear?: boolean } {
	const trimmed = input.trim();
	if (!trimmed) return { lines: [] };
	const [verb, ...rest] = trimmed.split(/\s+/);
	const arg = rest.join(' ').trim();
	const command = verb.toLowerCase();

	if (command === 'exit' || command === 'quit' || command === 'cancel') {
		return { lines: [line('Left codex mode.', 'dimmed')], exit: true };
	}
	if (command === 'clear') return { lines: [], clear: true };
	if (command === 'pwd') return { lines: [line('~/writing', 'lambda')] };
	if (command === 'help' || command === '?') return { lines: codexHelpLines() };
	if (command === 'ls' || command === 'dir') return { lines: listPosts(library) };
	if (command === 'grep' || command === 'filter') return { lines: filterPosts(library, arg) };
	if (command === 'cat') return { lines: showPost(library, arg) };
	return { lines: [line('Unknown codex command. Type help.', 'warning')] };
}

function emptyReason(library: CodexLibrary): string {
	if (library.status === 'unconfigured') return 'Writing is not configured.';
	if (library.status === 'unavailable') return 'Writing could not be loaded.';
	return 'No posts.';
}

function listPosts(library: CodexLibrary): TerminalLine[] {
	if (!library.posts.length) return [line(emptyReason(library), 'warning')];
	const lines: TerminalLine[] = [line('Posts:', 'success'), line('')];
	library.posts.forEach((post, index) => {
		const when = formatWritingDate(post.updated || post.date);
		const tags = post.tags.length ? ` [${post.tags.join(', ')}]` : '';
		lines.push(line(`${index + 1}. ${post.title}`, 'lambda'));
		lines.push(line(`   ${when}${tags}`, 'dimmed'));
		if (post.excerpt) lines.push(line(`   ${post.excerpt}`));
		lines.push(line(''));
	});
	return lines;
}

function filterPosts(library: CodexLibrary, arg: string): TerminalLine[] {
	if (!arg) return [line('Usage: grep <tag>', 'warning')];
	const tag = normalizeTag(arg);
	const filtered = library.posts.filter((post) =>
		post.tags.some((item) => normalizeTag(item) === tag)
	);
	if (!filtered.length) return [line(`No posts for #${tag}`, 'warning')];
	return [
		line(`Filtered #${tag}:`, 'success'),
		...filtered.map((post) =>
			line(`${post.title} → /writing/${post.slug}`, 'default', `/writing/${post.slug}`)
		)
	];
}

function showPost(library: CodexLibrary, arg: string): TerminalLine[] {
	if (!arg) return [line('Usage: cat <number|slug>', 'warning')];
	if (!library.posts.length) return [line(emptyReason(library), 'warning')];
	const number = Number(arg);
	const post =
		Number.isInteger(number) && number >= 1 && number <= library.posts.length
			? library.posts[number - 1]
			: library.posts.find((entry) => entry.slug === arg);
	if (!post) return [line('Post not found.', 'error')];
	return [
		line(post.title, 'lambda'),
		line(`/writing/${post.slug}`, 'success', `/writing/${post.slug}`),
		line(post.excerpt || '(open the article for the full text)', 'dimmed')
	];
}
