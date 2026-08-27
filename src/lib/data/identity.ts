export const identity = {
	name: 'Stephen Weaver',
	brand: 'λstepweaver',
	site: 'stepweaver.dev',

	title: 'Software Developer · Business Systems Developer · Automation & AI Integration',
	roles: [
		'Software Developer',
		'Business Systems Developer',
		'Automation & AI Integration'
	] as const,

	positioning: {
		eyebrow: 'λstepweaver // systems builder',
		headline: 'Product-minded systems',
		headlineAccent: 'for operations-heavy teams',
		short: 'Product-minded systems builder for operations-heavy teams.',
		lede: 'I design and ship internal tools, workflow automations, and AI-assisted systems that turn messy business processes into dependable software.'
	},

	statement:
		'Business-facing developer and systems builder. I translate messy workflows into working software, dashboards, automation, and AI-assisted tools.',

	summary: [
		'Full-stack and DevOps engineer with 9+ years’ experience spanning software development, data analysis, and operations.',
		'Former Air Force linguist and business analyst who builds AI-enabled web apps, real-time systems, and automation workflows that reduce friction and improve operations.',
		'Specializes in Next.js, Supabase, PostgreSQL, LLM integrations, and pragmatic DevOps pipelines.',
		'Adept at translating business requirements into scalable systems and communicating across technical and non-technical teams.'
	] as const,

	philosophy: {
		headline: 'I translate business workflows into working systems.',
		body: 'My path into software came through operations, analysis, and real-world process work: Airborne Cryptologic Linguist in the U.S. Air Force, then restaurant operations, business analysis, and finally development. That background still defines how I build. I start with workflows, handoffs, data, integrations, and risk, then turn them into systems people can use, maintain, and trust.'
	},

	currently: 'Current focus: DevOps and infrastructure',

	links: {
		github: 'https://github.com/stepweaver',
		work: '/work',
		about: '/about',
		resume: '/resume',
		resumePdf: '/weaver_resume.pdf',
		contact: '/contact',
		contactHire: '/contact?intent=hire'
	}
} as const;
