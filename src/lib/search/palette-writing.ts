import type { PaletteWriting } from './palette';

export const PALETTE_WRITING_PATH = '/api/palette/writing';

export type PaletteWritingResult =
	{ phase: 'ready'; posts: readonly PaletteWriting[] } | { phase: 'failed' };

export type PaletteWritingRequest =
	| { phase: 'empty' }
	| { phase: 'pending'; request: Promise<PaletteWritingResult> }
	| PaletteWritingResult;

function isWritingPost(value: unknown): value is PaletteWriting {
	if (!value || typeof value !== 'object') return false;
	const post = value as Record<string, unknown>;
	return (
		typeof post.slug === 'string' &&
		typeof post.title === 'string' &&
		typeof post.excerpt === 'string' &&
		Array.isArray(post.tags) &&
		post.tags.every((tag) => typeof tag === 'string')
	);
}

/** Accept only the fields the palette searches. Anything else is a failed load. */
export function paletteWritingPosts(value: unknown): PaletteWriting[] | null {
	if (!value || typeof value !== 'object' || !Array.isArray((value as { posts?: unknown }).posts)) {
		return null;
	}
	const posts = (value as { posts: unknown[] }).posts;
	if (!posts.every(isWritingPost)) return null;
	return posts.map((post) => ({
		slug: post.slug,
		title: post.title,
		excerpt: post.excerpt,
		tags: [...post.tags]
	}));
}

export async function loadPaletteWriting(
	fetchImpl: typeof fetch = fetch
): Promise<readonly PaletteWriting[] | null> {
	try {
		const response = await fetchImpl(PALETTE_WRITING_PATH, {
			headers: { accept: 'application/json' }
		});
		if (!response.ok) return null;
		return paletteWritingPosts(await response.json());
	} catch {
		return null;
	}
}

export type HeldResult<T> = { phase: 'ready'; value: T } | { phase: 'failed' };

export type HeldRequest<T> =
	{ phase: 'empty' } | { phase: 'pending'; request: Promise<HeldResult<T>> } | HeldResult<T>;

/**
 * One successful payload is kept. A pending request is shared.
 * A failure is not kept, so the next call tries again.
 * `null` is a failure. An empty list is a successful payload.
 */
export function holdRequest<T>(
	current: HeldRequest<T>,
	load: () => Promise<T | null>
): HeldRequest<T> {
	if (current.phase === 'ready' || current.phase === 'pending') return current;
	const request = load().then(
		(value) => (value !== null ? { phase: 'ready' as const, value } : { phase: 'failed' as const }),
		() => ({ phase: 'failed' as const })
	);
	return { phase: 'pending', request };
}

export function requestPaletteWriting(
	current: PaletteWritingRequest,
	load: () => Promise<readonly PaletteWriting[] | null>
): PaletteWritingRequest {
	if (current.phase === 'ready' || current.phase === 'pending') return current;
	const held = holdRequest(current.phase === 'empty' ? current : { phase: 'failed' }, load);
	if (held.phase !== 'pending') return { phase: 'failed' };
	return {
		phase: 'pending',
		request: held.request.then((result) =>
			result.phase === 'ready' ? { phase: 'ready', posts: result.value } : { phase: 'failed' }
		)
	};
}
