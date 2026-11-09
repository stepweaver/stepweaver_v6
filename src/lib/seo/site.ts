import { identity, PRIMARY_TITLE, SUPPORTING_LINE } from '$lib/data/identity';
import { getPublicWorkCards, privateProjectSlugs } from '$lib/projects/publication';

export const SITE_ORIGIN = 'https://stepweaver.dev';

/** Indexable routes. Holding pages and unimplemented tools stay out. */
export function publicSitemapPaths(): string[] {
	const paths = ['/', '/about', '/services', '/resume', '/contact'];
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
			description: `${PRIMARY_TITLE}. ${SUPPORTING_LINE}.`
		},
		person: {
			'@context': 'https://schema.org',
			'@type': 'Person',
			name: identity.name,
			jobTitle: PRIMARY_TITLE,
			url: SITE_ORIGIN,
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
