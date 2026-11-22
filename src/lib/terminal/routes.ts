import { identity } from '$lib/data/identity';

export type ShellDestination = {
	name: string;
	href: string;
	external: boolean;
};

/** Pages this app actually serves, plus the public GitHub profile. */
export const SHELL_DESTINATIONS: readonly ShellDestination[] = [
	{ name: 'home', href: '/', external: false },
	{ name: 'about', href: '/about', external: false },
	{ name: 'services', href: '/services', external: false },
	{ name: 'writing', href: '/writing', external: false },
	{ name: 'work', href: '/work', external: false },
	{ name: 'resume', href: '/resume', external: false },
	{ name: 'contact', href: '/contact', external: false },
	{ name: 'lab', href: '/lab', external: false },
	{ name: 'play', href: '/play', external: false },
	{ name: 'privacy', href: '/privacy', external: false },
	{ name: 'terminal', href: '/terminal', external: false },
	{ name: 'dice-roller', href: '/dice-roller', external: false },
	{ name: 'github', href: identity.links.github, external: true }
];

const ALIASES: Record<string, string> = {
	'~': 'home',
	codex: 'writing',
	dice: 'dice-roller',
	'what-i-do': 'services'
};

export function destinationNames(): string[] {
	return SHELL_DESTINATIONS.map((destination) => destination.name);
}

export function resolveDestination(token: string): ShellDestination | null {
	const key = ALIASES[token] ?? token;
	return SHELL_DESTINATIONS.find((destination) => destination.name === key) ?? null;
}
