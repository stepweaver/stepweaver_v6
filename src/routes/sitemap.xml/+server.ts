import { publicSitemapPaths, SITE_ORIGIN } from '#lib/seo/site.ts';

export function GET() {
	const urls = publicSitemapPaths()
		.map((path) => `<url><loc>${SITE_ORIGIN}${path}</loc></url>`)
		.join('');
	const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

	return new Response(body, {
		headers: {
			'content-type': 'application/xml; charset=utf-8',
			'cache-control': 'no-store'
		}
	});
}
