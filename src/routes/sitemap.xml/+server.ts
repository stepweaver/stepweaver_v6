import { writingRequestFromPlatform } from '$lib/server/env';
import { getWritingCatalog } from '$lib/server/writing/catalog';
import { SITE_ORIGIN, publicSitemapPaths } from '$lib/seo/site';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
	const paths = publicSitemapPaths();
	const catalog = await getWritingCatalog(writingRequestFromPlatform(platform));
	if (catalog.status === 'ok') {
		for (const post of catalog.posts) paths.push(`/writing/${post.slug}`);
	}
	const urls = paths.map((path) => `<url><loc>${SITE_ORIGIN}${path}</loc></url>`).join('');
	const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
	return new Response(body, {
		headers: {
			'content-type': 'application/xml; charset=utf-8',
			'cache-control': catalog.status === 'ok' && !catalog.stale ? 'public, max-age=60' : 'no-store'
		}
	});
};
