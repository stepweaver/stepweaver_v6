import { writingRequestFromPlatform } from '$lib/server/env';
import { getWritingCatalog } from '$lib/server/writing/catalog';
import { renderWritingRss } from '$lib/writing/rss';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
	const catalog = await getWritingCatalog(writingRequestFromPlatform(platform));
	if (catalog.status !== 'ok') {
		const message =
			catalog.status === 'unconfigured'
				? 'Writing feed is not configured.'
				: 'Writing feed is temporarily unavailable.';
		return new Response(message, {
			status: 503,
			headers: {
				'cache-control': 'no-store',
				'content-type': 'text/plain; charset=utf-8',
				'retry-after': '300'
			}
		});
	}

	return new Response(renderWritingRss(catalog.posts), {
		headers: {
			'content-type': 'application/rss+xml; charset=utf-8',
			'cache-control': catalog.stale ? 'no-store' : 'public, max-age=60'
		}
	});
};
