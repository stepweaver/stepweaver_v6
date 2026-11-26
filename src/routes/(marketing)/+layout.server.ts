import { getPublicWorkCards } from '$lib/projects/publication';
import { buildStructuredData } from '$lib/seo/site.server';
import type { LayoutServerLoad } from './$types';

/**
 * JSON-LD and approved project cards only. Writing search is loaded when the
 * command palette opens. Project cards stay on the server so the private
 * registry is not shipped to the browser.
 */
export const load: LayoutServerLoad = () => {
	return {
		structuredData: buildStructuredData(),
		commandPalette: {
			projects: getPublicWorkCards().map((card) => ({
				slug: card.slug,
				title: card.title,
				description: card.description,
				tags: [...card.tags]
			}))
		}
	};
};
