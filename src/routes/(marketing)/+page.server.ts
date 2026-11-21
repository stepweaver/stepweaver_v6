import { writingRequestFromPlatform } from '$lib/server/env';
import { getWritingCatalog } from '$lib/server/writing/catalog';
import { latestWriting } from '$lib/writing/entries';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	const catalog = await getWritingCatalog(writingRequestFromPlatform(platform));
	if (catalog.status !== 'ok') {
		return { writing: { status: catalog.status, stale: false, posts: [] } };
	}
	return {
		writing: {
			status: 'ok' as const,
			stale: catalog.stale,
			posts: latestWriting(catalog.posts, 3).map((post) => ({
				slug: post.slug,
				title: post.title,
				date: post.date,
				excerpt: post.excerpt
			}))
		}
	};
};
