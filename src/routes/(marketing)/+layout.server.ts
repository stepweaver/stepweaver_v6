import { buildStructuredData } from '$lib/seo/site';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = () => {
	return {
		structuredData: buildStructuredData()
	};
};
