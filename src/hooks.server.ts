import { dev } from '$app/environment';
import { redirect, type Handle } from '@sveltejs/kit';

function isPath(pathname: string, base: string): boolean {
	return pathname === base || pathname.startsWith(`${base}/`);
}

/**
 * Retired entry points. Lab tools stay on the terminal.
 * /carrier-journal was the old name of the public journal.
 * Log, lab, and footwear paths are not separate apps anymore.
 */
export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;
	if (isPath(pathname, '/lab')) redirect(301, '/terminal');
	if (isPath(pathname, '/play')) redirect(301, '/dice-roller');
	if (isPath(pathname, '/carrier-journal')) redirect(301, '/field-journal');
	if (pathname.startsWith('/field-journal/')) redirect(301, '/field-journal');
	const response = await resolve(event);
	const headers = new Headers(response.headers);
	headers.set('x-content-type-options', 'nosniff');
	headers.set('x-frame-options', 'DENY');
	headers.set('referrer-policy', 'strict-origin-when-cross-origin');
	headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=(self)');
	if (!dev && event.url.protocol === 'https:') {
		headers.set('strict-transport-security', 'max-age=31536000');
	}
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers
	});
};
