import { homeWritingView } from '$lib/writing/entries';
import { writingRequestFromPlatform } from '$lib/server/env';
import { getWritingCatalog } from '$lib/server/writing/catalog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform, setHeaders }) => {
	const catalog = await getWritingCatalog(writingRequestFromPlatform(platform));
	setHeaders({
		'cache-control': catalog.status === 'ok' && !catalog.stale ? 'public, max-age=60' : 'no-store'
	});
	return {
		writing: homeWritingView(catalog.status, catalog.posts)
	};
};
