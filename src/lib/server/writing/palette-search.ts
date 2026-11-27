import type { WritingCatalog, WritingSourceState } from '$lib/writing/types';

export type PublicWritingPost = {
	slug: string;
	title: string;
	excerpt: string;
	tags: string[];
	date: string;
	updated: string;
};

/**
 * Published listing fields for the palette and the terminal codex.
 * An unavailable catalog returns no titles. `date` and `updated` are the
 * calendar days the terminal prints; the palette searches the other four.
 */
export function paletteWritingBody(catalog: WritingCatalog): {
	httpStatus: 200 | 503;
	status: WritingSourceState;
	posts: PublicWritingPost[];
} {
	if (catalog.status !== 'ok') {
		return {
			httpStatus: catalog.status === 'unavailable' ? 503 : 200,
			status: catalog.status,
			posts: []
		};
	}
	return {
		httpStatus: 200,
		status: 'ok',
		posts: catalog.posts.map((post) => ({
			slug: post.slug,
			title: post.title,
			excerpt: post.excerpt,
			tags: [...post.tags],
			date: post.date,
			updated: post.updated
		}))
	};
}
