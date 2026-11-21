import { SITE_ORIGIN } from '$lib/seo/site';
import type { WritingEntry } from '$lib/writing/types';

function escapeXml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}

function rfc822(date: string): string {
	const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
	if (!match) return new Date(0).toUTCString();
	const [, year, month, day] = match;
	return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).toUTCString();
}

export function renderWritingRss(posts: WritingEntry[]): string {
	const self = `${SITE_ORIGIN}/writing/rss.xml`;
	const items = posts
		.map((post) => {
			const link = `${SITE_ORIGIN}/writing/${post.slug}`;
			const description = post.excerpt || post.title;
			return `<item><title>${escapeXml(post.title)}</title><link>${escapeXml(link)}</link><guid isPermaLink="false">${escapeXml(post.id)}</guid><pubDate>${rfc822(post.date)}</pubDate><description>${escapeXml(description)}</description></item>`;
		})
		.join('');
	return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escapeXml('λstepweaver writing')}</title><link>${SITE_ORIGIN}/writing</link><description>${escapeXml('Published notes from Stephen Weaver.')}</description><atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${self}" rel="self" type="application/rss+xml"/>${items}</channel></rss>`;
}
