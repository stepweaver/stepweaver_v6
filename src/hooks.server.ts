import { redirect, type Handle } from '@sveltejs/kit';

function isPath(pathname: string, base: string): boolean {
	return pathname === base || pathname.startsWith(`${base}/`);
}

/** Retired entry points. Lab tools and data stay; this app does not host them. */
export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;
	if (isPath(pathname, '/lab')) redirect(301, '/terminal');
	if (isPath(pathname, '/play')) redirect(301, '/dice-roller');
	return resolve(event);
};
