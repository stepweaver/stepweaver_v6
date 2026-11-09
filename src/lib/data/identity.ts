/**
 * Canonical identity for the reconciled Milestone 1 shell.
 * Career facts follow the v5 identity. The title follows the preservation brief.
 * The GitHub profile is the repository owner, github.com/stepweaver.
 */

export const PRIMARY_TITLE = 'Business Systems Developer & Systems Integration Consultant';

export const SUPPORTING_LINE =
	'Business analysis · systems integration · automation · custom software · applied AI';

export const PROFESSIONAL_SUMMARY = [
	'I work on business systems: how the work actually moves, where it breaks, and the software, integrations, and automation that make it dependable.',
	'Nine years across business analysis, data, and operations, then independent product development. I enter unfamiliar domains, learn what the work requires, and deliver working applications.',
	'I communicate across technical and nontechnical teams and translate business requirements into operable software with tests, integrations, and deployment.'
] as const;

export const ABOUT_STATEMENT =
	'I came into software through operations, analysis, and real-world process work. Then I learned to build the systems I used to specify. My edge is not just shipping code, and it is not analysis without implementation. It is understanding how work moves through a team, where it breaks, and writing the software that makes that work dependable. Frameworks, APIs, infrastructure, and domains are tools to acquire, not boundaries around the work I can do.';

export const BACKGROUND_LEAD =
	'My path into software came through operations, analysis, and real-world process work: Airborne Cryptologic Linguist in the U.S. Air Force, then restaurant operations, business analysis, and finally development. That background still defines how I build. I start with workflows, handoffs, data, integrations, and risk, then turn them into systems people can use, maintain, and trust.';

export const CAREER_TRANSITION =
	'From 2017 to 2025 I was a business analyst at Notre Dame: SQL pipelines, Tableau, campus transaction systems, requirements, and UAT. In 2024 I started shipping production software independently as λstepweaver. I am currently in a field-operations chapter; that is context, not the whole of the work. The work is the systems I build.';

export const HOW_I_WORK = [
	{
		step: '01',
		title: 'Understand the workflow',
		body: 'Map the real workflow, including exceptions, handoffs, and the data that actually moves.'
	},
	{
		step: '02',
		title: 'Design practical architecture',
		body: 'Define boundaries, rules, and failure modes before picking a stack or reaching for a model.'
	},
	{
		step: '03',
		title: 'Build and integrate',
		body: 'Ship the interface, data model, and the integrations that connect the systems the team already uses.'
	},
	{
		step: '04',
		title: 'Validate and maintain',
		body: 'Check the system against the workflow, including the unhappy paths, and leave it operable by the people who own it.'
	}
] as const;

export const AGENT_OWNERSHIP_NOTE =
	'AI-assisted engineering is part of how I work. When an agent drafts code, a person still owns the result: reading it, testing it, and deciding whether it ships.';

export const WHAT_I_DO = [
	{
		title: 'Business analysis and systems discovery',
		body: 'Workflow mapping, a current-state look, and a priority order when something is broken and it is not yet clear what to build.'
	},
	{
		title: 'APIs and integration',
		body: 'Handoffs between the tools a team already has: intake, routing, reporting, and data movement shaped around the work.'
	},
	{
		title: 'Automation',
		body: 'Event-driven workflows and business rules where automation removes a brittle handoff. n8n, APIs, and webhooks are tools, not the product.'
	},
	{
		title: 'Custom software',
		body: 'Internal tools and applications: the interface, the data model, and the operational rules the team actually runs.'
	},
	{
		title: 'Applied AI',
		body: 'Assistants and drafting inside a real workflow, with explicit boundaries. Generated code is reviewed before it is trusted.'
	}
] as const;

export const HOMEPAGE_EXPERIENCE = [
	{
		org: 'λstepweaver',
		role: 'Founder & Developer',
		when: 'Nov 2024 – Present',
		body: 'Designing and shipping web applications: realtime systems, internal tools, automation, and AI-assisted products.'
	},
	{
		org: 'University of Notre Dame',
		role: 'Business Analyst',
		when: 'Nov 2017 – May 2025',
		body: 'SQL pipelines, Tableau, campus transaction systems, requirements, UAT, and vendor/developer translation.'
	}
] as const;

export const HOMEPAGE_CHAPTER_NOTE =
	'Currently in a field-operations chapter while building independently. Dates above match the résumé.';

export const OPERATOR_CHAPTER = 'Occupational Endurance Athlete';
export const OPERATOR_TAGS = ['Veteran', 'Business Analyst', 'Developer'] as const;

export const identity = {
	name: 'Stephen Weaver',
	brand: 'λstepweaver',
	site: 'stepweaver.dev',
	title: PRIMARY_TITLE,
	roles: ['Business Systems Developer', 'Systems Integration Consultant'] as const,
	positioning: {
		eyebrow: 'λstepweaver // systems',
		headline: 'Business Systems Developer',
		headlineAccent: '& Systems Integration Consultant',
		short: 'Business Systems Developer and Systems Integration Consultant.',
		lede: PROFESSIONAL_SUMMARY[0]
	},
	statement: ABOUT_STATEMENT,
	summary: PROFESSIONAL_SUMMARY,
	philosophy: {
		headline: 'I translate business workflows into working systems.',
		body: BACKGROUND_LEAD
	},
	currently: 'Current build: this SvelteKit rebuild of λstepweaver',
	location: 'Granger, IN',
	email: 'stephen@stepweaver.dev',
	supportingLine: SUPPORTING_LINE,
	links: {
		github: 'https://github.com/stepweaver',
		work: '/work',
		about: '/about',
		resume: '/resume',
		resumePdf: '/weaver_resume.pdf',
		contact: '/contact',
		contactHire: '/contact?intent=hire',
		contactConsult: '/contact?intent=consult'
	}
} as const;
