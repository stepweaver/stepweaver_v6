import { filterByTag, paginateWriting, writingTags } from '$lib/writing/entries';
import { writingRequestFromPlatform } from '$lib/server/env';
import { getWritingCatalog } from '$lib/server/writing/catalog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, platform, setHeaders }) => {
	const catalog = await getWritingCatalog(writingRequestFromPlatform(platform));
	if (catalog.status !== 'ok') {
		setHeaders({ 'cache-control': 'no-store' });
		return {
			status: catalog.status,
			stale: false,
			tags: [],
			tag: null,
			items: [],
			page: 1,
			pages: 1,
			total: 0
		};
	}

	setHeaders({ 'cache-control': catalog.stale ? 'no-store' : 'public, max-age=60' });
	const tag = url.searchParams.get('tag');
	const requested = Number(url.searchParams.get('page') ?? '1');
	const filtered = filterByTag(catalog.posts, tag);
	const page = paginateWriting(filtered, Number.isFinite(requested) ? requested : 1);
	return {
		status: 'ok' as const,
		stale: catalog.stale,
		tags: writingTags(catalog.posts),
		tag,
		...page
	};
};
