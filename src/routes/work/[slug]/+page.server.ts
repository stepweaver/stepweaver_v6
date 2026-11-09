import { error } from '@sveltejs/kit';
import {
	getPublicProjectBySlug,
	recordedRepo,
	recordedUrl,
	workSlugAvailability
} from '#lib/projects/index.ts';
import type { PageServerLoad } from './$types';

const UNAVAILABLE = 'This page is not available.';

export const load: PageServerLoad = ({ params }) => {
	if (workSlugAvailability(params.slug) !== 'public') {
		error(404, UNAVAILABLE);
	}

	const project = getPublicProjectBySlug(params.slug);
	if (!project) error(404, UNAVAILABLE);

	return {
		project: {
			slug: project.slug,
			title: project.title,
			description: project.description,
			tags: project.tags,
			registryStatus: project.registryStatus,
			link: recordedUrl(project),
			repo: recordedRepo(project)
		}
	};
};
