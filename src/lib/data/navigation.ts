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

/**
 * Default command-palette pages. Work and What I Do stay off this list.
 * Search still resolves /work and /services. Lab and Play are redirects, not pages.
 */
export const PALETTE_LINKS: NavLink[] = [
	{ href: '/', label: 'Home' },
	{ href: '/about', label: 'About' },
	{ href: '/writing', label: 'Writing' },
	{ href: '/resume', label: 'Resume' },
	{ href: '/contact', label: 'Contact' },
	{
		href: '/terminal',
		label: 'Terminal',
		note: 'Résumé, writing, dice, weather, contact, and λlambda.'
	},
	{
		href: '/dice-roller',
		label: 'Dice Roller',
		note: 'Shared notation with the terminal roll command.'
	},
	{ href: '/privacy', label: 'Privacy' }
];
