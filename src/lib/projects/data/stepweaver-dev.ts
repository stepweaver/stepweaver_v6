import type { Project } from '../types';

export const stepweaverDev = {
	slug: 'stepweaver-dev',
	title: 'stepweaver.dev',
	description:
		'A SvelteKit portfolio platform and working systems lab built around typed project data, route-driven case studies, a terminal-forward design system, and a Cloudflare deployment target.',
	status: 'live',
	tags: [
		'SvelteKit',
		'Svelte 5',
		'TypeScript',
		'Tailwind CSS 4',
		'Cloudflare',
		'Data-Driven UI',
		'Portfolio Platform'
	],
	keywords: ['portfolio', 'sveltekit', 'systems', 'case studies', 'cloudflare'],
	githubRepo: 'stepweaver/stepweaver_v6',

	builtFor: 'Visitors who want the whole system story, not a single UI trick',
	solved:
		'Treating a portfolio as a brochure instead of using the portfolio itself to demonstrate how I structure interfaces, routes, data, and systems',
	delivered: [
		'SvelteKit file-based application with shared layouts and a growing set of portfolio, service, resume, contact, playground, and project routes',
		'Semantic Tailwind design system with reusable Svelte components and a terminal-forward visual language',
		'Typed project domain with route loaders, a project registry, dynamic `/work/[slug]` pages, and real 404 handling'
	],

	cardDescription:
		'SvelteKit portfolio and systems lab with typed project data, data-driven case studies, semantic design tokens, and a Cloudflare-oriented architecture.',
	cardBuiltFor: 'visitors who want the whole system story, not a single UI trick',
	cardSolved: 'showing how I think by making the portfolio itself part of the engineering work',
	cardDelivered: [
		'SvelteKit routes and layouts with structured TypeScript data driving project pages',
		'Svelte 5 components, semantic Tailwind styling, and a typed dynamic case-study system'
	],

	sections: [
		{
			id: 'overview',
			title: 'Overview',
			type: 'overview',
			content:
				'stepweaver.dev is both my portfolio and a project in its own right. It is a SvelteKit application designed to make my work, technical interests, and way of thinking visible through the application itself. The site combines conventional portfolio routes with a terminal-forward visual language, structured project data, and space for interactive tools and experiments as the platform grows.'
		},
		{
			id: 'problem',
			title: 'The Problem',
			type: 'problem',
			bullets: [
				'A conventional portfolio would have been easier, but it would not reflect how I actually like to build: systems, terminals, structured data, deliberate interfaces, and reusable tools',
				'The previous implementation had grown into a broad application, so rebuilding it was also an opportunity to understand the architecture directly instead of mechanically translating framework-specific patterns'
			]
		},
		{
			id: 'solution',
			title: 'The Solution',
			type: 'solution',
			bullets: [
				'Rebuilt the application from a clean SvelteKit foundation while preserving the existing content, visual identity, and product intent',
				'Started with routes, layouts, static TypeScript data, and reusable Svelte components before introducing external services or backend complexity',
				'Organized shared application concepts as domains while keeping route-specific behavior close to the routes that use it'
			]
		},
		{
			id: 'architecture',
			title: 'Architecture',
			type: 'architecture',
			bullets: [
				'SvelteKit file-based routing with route groups and nested layouts separating shared application structure from individual pages',
				'Universal `+page.ts` load functions establish route data contracts for public static content',
				'Project case studies live in a plain TypeScript domain under `$lib/projects`, with discriminated union types and a central registry',
				'Semantic CSS variables in `src/app.css` map into Tailwind utilities so components use design-language names instead of hardcoded colors',
				'Cloudflare adapter provides the deployment/runtime target while database, content-sync, and other server integrations remain intentionally deferred'
			]
		},
		{
			id: 'features',
			title: 'Key Features',
			type: 'features',
			bullets: [
				'Responsive shared navigation and footer through a SvelteKit marketing layout',
				'Portfolio routes for About, Resume, Services, Contact, Privacy, Play, and Work',
				'Typed project registry powering `/work` and dynamic `/work/[slug]` case-study routes',
				'Real 404 behavior for invalid project slugs',
				'Intent-aware Contact interface using Svelte 5 state and derived values',
				'Semantic terminal-inspired design system using IBM 3270 and OCR A typography',
				'Static content and domain logic kept separate from presentation so later backend services can be introduced without rewriting the UI model'
			]
		},
		{
			id: 'engineering',
			title: 'Engineering Decisions',
			type: 'engineering',
			bullets: [
				'Use Svelte 5 runes such as `$props`, `$state`, and `$derived` where component state actually requires them',
				'Use generated SvelteKit `PageLoad` and `PageProps` types to carry route data safely from `load()` into page components',
				'Use discriminated unions for project sections so TypeScript understands which payload belongs to each section type',
				'Keep project data and other framework-independent logic as plain TypeScript rather than making it Svelte-specific',
				'Prefer semantic Tailwind utilities and real Svelte components over recreating the previous application’s large global CSS component layer',
				'Delay abstractions until reuse is demonstrated rather than reproducing old React component boundaries automatically'
			]
		},
		{
			id: 'outcome',
			title: 'Outcome',
			type: 'outcome',
			bullets: [
				'A functioning SvelteKit portfolio foundation with shared routes, layouts, components, and design primitives',
				'A data-driven project system that can scale to the rest of the case-study catalog without creating a page file for every project',
				'A clearer separation between domain data, route responsibilities, and Svelte presentation',
				'A codebase being rebuilt deliberately enough that the architecture itself becomes part of what the project demonstrates'
			]
		},
		{
			id: 'tradeoffs',
			title: 'Tradeoffs',
			type: 'tradeoffs',
			bullets: [
				'The rebuild does not yet have feature parity with the previous application',
				'Interactive applications such as the terminal and Field Journal are intentionally deferred until the core SvelteKit architecture is established',
				'Notion, database persistence, AI integrations, uploads, and production security infrastructure have not yet been reintroduced',
				'The Contact page currently implements the interface and intent behavior but not the production email submission backend',
				'Only the first project case study has been migrated while the generic renderer and remaining catalog are still being built'
			]
		},
		{
			id: 'tech-stack',
			title: 'Tech Stack',
			type: 'tech-stack',
			techStack: [
				{ name: 'SvelteKit', category: 'Framework' },
				{ name: 'Svelte 5', category: 'UI' },
				{ name: 'TypeScript', category: 'Language' },
				{ name: 'Tailwind CSS 4', category: 'Styling' },
				{ name: 'Cloudflare', category: 'Runtime' }
			]
		}
	]
} satisfies Project;
