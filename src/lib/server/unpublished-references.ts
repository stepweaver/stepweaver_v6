/**
 * Project names and case-study links retained from the original main tree.
 * No public page imports this module. Publication still requires APPROVED_PUBLIC_SLUGS.
 */

export const flagshipReferences = [
	{
		slug: 'parcel-sweep',
		label: 'Parcel Sweep',
		type: 'Last-mile ops prototype',
		summary:
			'Field-aware last-mile delivery workflow tooling grounded in sequencing pressure and ops constraints.',
		tags: ['React', 'Express', 'SQLite', 'Socket.io'] as const,
		href: '/work/parcel-sweep'
	},
	{
		slug: 'silent-auction',
		label: 'Silent Auction Platform',
		type: 'Real-time operational app',
		summary:
			'Fundraising platform with real-time bidding state, Supabase Realtime, role-based access, and live event operations under pressure.',
		tags: ['Next.js', 'Supabase', 'Realtime', 'Auth', 'PostgreSQL'] as const,
		href: '/work/silent-auction'
	},
	{
		slug: 'ai-integrations',
		label: 'AI Integrations',
		type: 'Guarded AI systems',
		summary:
			'Portfolio-native AI with shared protected backends, rate limits, sanitization, and explicit trust boundaries.',
		tags: ['Next.js', 'Groq', 'OpenAI', 'Vercel KV'] as const,
		href: '/work/ai-integrations'
	},
	{
		slug: 'carrier-journal',
		label: 'Field Journal',
		type: 'Personal fitness systems product',
		summary:
			'Walking and fitness journal with KPI/dashboard artifact: miles, hydration, weather, recovery.',
		tags: ['Next.js', 'Notion API', 'Zod', 'TypeScript'] as const,
		href: '/work/carrier-journal'
	}
] as const;

export const resumeProjectReferences = [
	{
		label: 'Silent Auction Platform',
		summary:
			'Real-time auction system for a school PTO fundraiser; built with Next.js, Supabase, and Resend; includes alias-based bidding, realtime updates, donor portals, and admin dashboards.',
		href: '/work/silent-auction'
	},
	{
		label: 'Bill Planner',
		summary:
			'Cash-flow planning app built with Next.js, Neon, and Drizzle ORM; supports mapping income to bills, status pipeline, HUD metrics, and reusable month templates.',
		href: '/work/bill-planner'
	},
	{
		label: 'λlambda LLM Chat Agent',
		summary:
			'Portfolio-native LLM advocate with Groq/OpenAI routing, channel-aware chat across website and terminal, prompt-injection filtering, and provider fallback strategies.',
		href: '/work/llambda-llm-agent'
	}
] as const;
