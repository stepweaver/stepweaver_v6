import { articleDescription, isoDate } from '$lib/seo/metadata';
import { SITE_ORIGIN } from '$lib/seo/site.server';
import type { WritingEntry } from '$lib/writing/types';

function escapeXml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}

function rfc822(date: string): string | null {
	const iso = isoDate(date);
	if (!iso) return null;
	const [year, month, day] = iso.split('-').map((part) => Number(part));
	return new Date(Date.UTC(year, month - 1, day)).toUTCString();
}

export function renderWritingRss(posts: WritingEntry[]): string {
	const self = `${SITE_ORIGIN}/writing/rss.xml`;
	const items = posts
		.map((post) => {
			const link = `${SITE_ORIGIN}/writing/${post.slug}`;
			const description = articleDescription(post);
			const published = rfc822(post.date);
			const pubDate = published ? `<pubDate>${published}</pubDate>` : '';
			return `<item><title>${escapeXml(post.title)}</title><link>${escapeXml(link)}</link><guid isPermaLink="false">${escapeXml(post.id)}</guid>${pubDate}<description>${escapeXml(description)}</description></item>`;
		})
		.join('');
	return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escapeXml('λstepweaver writing')}</title><link>${SITE_ORIGIN}/writing</link><description>${escapeXml('Published notes from Stephen Weaver.')}</description><atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${self}" rel="self" type="application/rss+xml"/>${items}</channel></rss>`;
}
