export type NavLink = {
	href: string;
	label: string;
	note?: string;
};

/** Primary navigation. /work stays off this list until a case study is approved. */
export const PRIMARY_NAV: NavLink[] = [
	{ href: '/about', label: 'About' },
	{ href: '/services', label: 'What I Do' },
	{ href: '/writing', label: 'Writing' },
	{ href: '/resume', label: 'Resume' },
	{ href: '/contact', label: 'Contact' }
];

/** Command palette destinations. These are pages, not terminal commands. */
export const PALETTE_LINKS: NavLink[] = [
	{ href: '/', label: 'Home' },
	...PRIMARY_NAV,
	{ href: '/work', label: 'Work', note: 'Curation page. No case studies are public.' },
	{ href: '/terminal', label: 'Terminal', note: 'help, resume, cd, codex, roll, and clear.' },
	{
		href: '/dice-roller',
		label: 'Dice roller',
		note: 'Shared notation with the terminal roll command.'
	},
	{ href: '/lab', label: 'Lab', note: 'Not rebuilt in this app.' },
	{ href: '/play', label: 'Play', note: 'Dice roller is connected. The other tools are not.' },
	{ href: '/privacy', label: 'Privacy' }
];
