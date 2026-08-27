import { describe, expect, it } from 'vitest';
import { getAllProjects, getProjectBySlug } from './registry';

describe('project registry', () => {
	it('returns registered projects and looks them up by slug', () => {
		const project = getAllProjects()[0];

		expect(project).toBeDefined();
		if (!project) return;

		expect(getProjectBySlug(project.slug)).toBe(project);
		expect(getProjectBySlug('missing-project')).toBeUndefined();
	});
});
