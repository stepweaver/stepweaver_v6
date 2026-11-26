import type { WritingCatalog } from '$lib/writing/types';

/** Published search fields only. An unavailable catalog returns no titles. */
export function paletteWritingBody(catalog: WritingCatalog): {
	status: 200 | 503;
	posts: Array<{ slug: string; title: string; excerpt: string; tags: string[] }>;
} {
	if (catalog.status !== 'ok') {
		return { status: catalog.status === 'unavailable' ? 503 : 200, posts: [] };
	}
	return {
		status: 200,
		posts: catalog.posts.map((post) => ({
			slug: post.slug,
			title: post.title,
			excerpt: post.excerpt,
			tags: [...post.tags]
		}))
	};
}
