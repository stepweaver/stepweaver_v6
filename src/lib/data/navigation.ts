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
 * Static pages the command palette can offer.
 * The palette itself reads shell destinations in src/lib/terminal/routes.ts.
 * Field Journal is one of those destinations. It stays off the primary nav.
 */
export const PALETTE_LINKS: NavLink[] = [
	{ href: '/', label: 'Home' },
	{ href: '/about', label: 'About' },
	{ href: '/writing', label: 'Writing' },
	{ href: '/field-journal', label: 'Field Journal', note: 'The Long Walk' },
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
