import { identity, PRIMARY_TITLE, SUPPORTING_LINE } from '$lib/data/identity';
import { getPublicWorkCards, privateProjectSlugs } from '$lib/projects/publication';

import { absoluteSiteUrl, SITE_ORIGIN } from './origin';
import { SHARE_CARD } from './share-image';
export { SITE_ORIGIN } from './origin';

const SHARE_IMAGE = absoluteSiteUrl(SHARE_CARD.path);

/** Indexable routes. Holding pages and unimplemented tools stay out. */
export function publicSitemapPaths(): string[] {
	const paths = [
		'/',
		'/about',
		'/services',
		'/writing',
		'/writing/rss.xml',
		'/resume',
		'/contact',
		'/terminal',
		'/dice-roller'
	];
	for (const project of getPublicWorkCards()) {
		paths.push(`/work/${project.slug}`);
	}
	return paths;
}

export function buildStructuredData() {
	return {
		website: {
			'@context': 'https://schema.org',
			'@type': 'WebSite',
			name: 'λstepweaver',
			url: SITE_ORIGIN,
			description: `${PRIMARY_TITLE}. ${SUPPORTING_LINE}.`,
			image: SHARE_IMAGE
		},
		person: {
			'@context': 'https://schema.org',
			'@type': 'Person',
			name: identity.name,
			jobTitle: PRIMARY_TITLE,
			url: SITE_ORIGIN,
			image: SHARE_IMAGE,
			email: identity.email,
			address: {
				'@type': 'PostalAddress',
				addressLocality: 'Granger',
				addressRegion: 'IN',
				addressCountry: 'US'
			},
			sameAs: [identity.links.github]
		}
	};
}

/** Used by tests to prove project slugs are absent from public metadata. */
export function publicMetadataBlob(): string {
	return JSON.stringify({
		sitemap: publicSitemapPaths(),
		structured: buildStructuredData(),
		publicProjects: getPublicWorkCards()
	});
}

export { privateProjectSlugs };
