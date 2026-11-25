import { homeWritingView } from '$lib/writing/entries';
import { writingRequestFromPlatform } from '$lib/server/env';
import { getWritingCatalog } from '$lib/server/writing/catalog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform, setHeaders, depends }) => {
	depends('app:home-writing');
	const started = performance.now();
	const catalog = await getWritingCatalog({
		...writingRequestFromPlatform(platform),
		nonBlocking: true
	});
	setHeaders({
		'server-timing': `writing;dur=${(performance.now() - started).toFixed(1)}`,
		'cache-control': catalog.status === 'ok' && !catalog.stale ? 'public, max-age=60' : 'no-store'
	});
	return {
		writingPending: catalog.status === 'unavailable',
		writing: homeWritingView(catalog.status, catalog.posts)
	};
};
