import { getPublicWorkCards } from '$lib/projects/publication';
import { buildStructuredData } from '$lib/seo/site.server';
import { writingRequestFromPlatform } from '$lib/server/env';
import { getWritingCatalog } from '$lib/server/writing/catalog';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ platform, depends }) => {
	depends('app:home-writing');
	const catalog = await getWritingCatalog({
		...writingRequestFromPlatform(platform),
		nonBlocking: true
	});
	return {
		structuredData: buildStructuredData(),
		commandPalette: {
			writing:
				catalog.status === 'ok'
					? catalog.posts.map((post) => ({
							slug: post.slug,
							title: post.title,
							excerpt: post.excerpt,
							tags: post.tags
						}))
					: [],
			projects: getPublicWorkCards().map((card) => ({
				slug: card.slug,
				title: card.title,
				description: card.description,
				tags: [...card.tags]
			}))
		}
	};
};
