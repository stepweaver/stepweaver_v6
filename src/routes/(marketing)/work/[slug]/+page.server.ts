import { error } from '@sveltejs/kit';
import { getPublicWorkPage } from '$lib/projects/publication';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const page = getPublicWorkPage(params.slug);
	if (!page) error(404, 'This page is not available.');
	return page;
};
