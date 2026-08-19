import { stepweaverDev } from './data/stepweaver-dev';
import type { Project } from './types';

const PROJECTS = [stepweaverDev] satisfies readonly Project[];

export function getAllProjects(): readonly Project[] {
	return PROJECTS;
}

export function getProjectBySlug(slug: string): Project | undefined {
	return PROJECTS.find((project) => project.slug === slug);
}
