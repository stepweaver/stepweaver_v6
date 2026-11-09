import { identity } from './identity';

export const briefData = {
	identity: {
		eyebrow: 'λstepweaver // about',
		name: identity.name,
		roles: identity.roles,
		statement:
			'I came into software through operations, analysis, and real-world process work. My edge is not just shipping code. It is understanding how work moves through a team, where it breaks, and how to turn that into dependable solutions, workflows, and tools.'
	},

	roleFit: {
		title: 'Where I fit',
		items: [
			'Full-stack engineering and implementation (Next.js, React, Node.js)',
			'Custom data workflows, automation, and tool integration (n8n, APIs, webhooks)',
			'AI-assisted systems with explicit guardrails',
			'Internal tools, dashboards, and operational consoles',
			'Product-minded roles on operations-heavy or logistics-adjacent teams',
			'Contract, sprint, and project-based engagements when the fit is clear'
		] as const
	},

	stackSnapshot: {
		title: 'Working stack',
		categories: [
			{
				label: 'Frontend',
				items: ['Next.js', 'React', 'SvelteKit', 'Tailwind CSS', 'TypeScript'] as const
			},
			{
				label: 'Backend',
				items: ['Node.js', 'Next.js API routes', 'PostgreSQL', 'Supabase'] as const
			},
			{
				label: 'Automation',
				items: ['n8n', 'REST APIs', 'Webhooks', 'OpenRouter'] as const
			},
			{
				label: 'Infra',
				items: ['Vercel', 'Neon', 'Cloudflare', 'GitHub', 'Notion API'] as const
			}
		] as const
	},

	ctas: [
		{
			label: 'View Resume',
			href: identity.links.resume,
			variant: 'primary' as const
		},
		{
			label: 'What I Do',
			href: '/services',
			variant: 'secondary' as const
		},
		{
			label: 'GitHub',
			href: identity.links.github,
			variant: 'secondary' as const,
			external: true
		},
		{
			label: 'Contact',
			href: identity.links.contactHire,
			variant: 'secondary' as const
		}
	] as const
} as const;
