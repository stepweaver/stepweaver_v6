import { PALETTE_WRITING_PATH } from '$lib/search/palette-writing';
import { parseCommand } from './commands';
import type { CodexLibrary, CodexPost } from './codex';
import type { ShellMode } from './types';

const CODEX_LIST = new Set(['ls', 'dir']);
const CODEX_QUERY = new Set(['grep', 'filter', 'cat']);

/** Same client deadline as weather, chat, and contact send. */
export const CODEX_LIBRARY_DEADLINE_MS = 20_000;

/**
 * Shell `codex` needs the catalog for its opening count.
 * Inside codex, only commands that read posts need it.
 * `cd`, including `cd writing` and `cd codex`, is a static route.
 */
export function commandNeedsWriting(mode: ShellMode, input: string): boolean {
	const trimmed = input.trim();
	if (!trimmed) return false;
	if (mode === 'codex') {
		const [verb, ...rest] = trimmed.split(/\s+/);
		const command = verb?.toLowerCase() ?? '';
		if (CODEX_LIST.has(command)) return true;
		if (CODEX_QUERY.has(command)) return rest.join(' ').trim().length > 0;
		return false;
	}
	if (mode !== 'shell') return false;
	const parsed = parseCommand(trimmed);
	if (!parsed) return false;
	return parsed.name === 'codex';
}

function codexPost(value: unknown): CodexPost | null {
	if (!value || typeof value !== 'object') return null;
	const post = value as Record<string, unknown>;
	if (
		typeof post.slug !== 'string' ||
		typeof post.title !== 'string' ||
		typeof post.excerpt !== 'string' ||
		typeof post.date !== 'string' ||
		typeof post.updated !== 'string' ||
		!Array.isArray(post.tags) ||
		!post.tags.every((tag) => typeof tag === 'string')
	) {
		return null;
	}
	return {
		slug: post.slug,
		title: post.title,
		excerpt: post.excerpt,
		date: post.date,
		updated: post.updated,
		tags: [...post.tags]
	};
}

/**
 * Palette search fields plus the calendar days `ls` prints, and the source
 * state the opening line reports. Unavailable is a failed load so it can be
 * retried. Anything else malformed is a failed load too.
 */
export function codexLibraryFromPayload(value: unknown): CodexLibrary | null {
	if (!value || typeof value !== 'object') return null;
	const body = value as { status?: unknown; posts?: unknown };
	if (body.status === 'unavailable') return null;
	if (body.status !== 'ok' && body.status !== 'unconfigured') return null;
	if (!Array.isArray(body.posts)) return null;
	if (body.status === 'unconfigured') {
		return body.posts.length === 0 ? { status: 'unconfigured', posts: [] } : null;
	}
	const posts: CodexPost[] = [];
	for (const item of body.posts) {
		const post = codexPost(item);
		if (!post) return null;
		posts.push(post);
	}
	return { status: 'ok', posts };
}

function untilDeadline<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
	if (signal.aborted) return Promise.reject(signal.reason);
	return new Promise((resolve, reject) => {
		const fail = () => reject(signal.reason);
		signal.addEventListener('abort', fail, { once: true });
		work.then(
			(value) => {
				signal.removeEventListener('abort', fail);
				if (signal.aborted) fail();
				else resolve(value);
			},
			(error) => {
				signal.removeEventListener('abort', fail);
				reject(error);
			}
		);
	});
}

/**
 * One 20 second deadline covers the response and its body. The timer aborts
 * the fetch, and the same signal settles a body that keeps the connection
 * open. A timeout, a non-ok response, or a body that cannot be read is a
 * failed load.
 */
export async function loadCodexLibrary(
	fetchImpl: typeof fetch = fetch
): Promise<CodexLibrary | null> {
	const controller = new AbortController();
	const signal = controller.signal;
	const timer = setTimeout(() => controller.abort(), CODEX_LIBRARY_DEADLINE_MS);
	let response: Response | undefined;
	try {
		response = await untilDeadline(
			fetchImpl(PALETTE_WRITING_PATH, {
				headers: { accept: 'application/json' },
				signal
			}),
			signal
		);
		if (!response.ok) return null;
		return codexLibraryFromPayload(await untilDeadline(response.json(), signal));
	} catch {
		if (signal.aborted) await response?.body?.cancel().catch(() => undefined);
		return null;
	} finally {
		clearTimeout(timer);
	}
}
