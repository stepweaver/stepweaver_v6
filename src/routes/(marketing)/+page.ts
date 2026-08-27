import { getAllProjects } from '$lib/projects/registry';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	return {
		projects: getAllProjects()
	};
};
