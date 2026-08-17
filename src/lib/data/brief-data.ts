export const briefData = {
	identity: {
		eyebrow: 'λstepweaver // about',
		name: 'Stephen Weaver',
		roles: ['Full-Stack Developer', 'Systems Builder', 'Automation & AI Integration'] as const,
		statement:
			'I came into software through operations, analysis, and real-world process work. My edge is not just shipping code. It is understanding how work moves through a team, where it breaks, and how to turn that into solutions, workflows, and tools.'
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
	}
} as const;
