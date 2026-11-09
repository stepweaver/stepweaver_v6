import { getPublicWorkCards } from '$lib/projects/publication';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return {
		projects: getPublicWorkCards()
	};
};
