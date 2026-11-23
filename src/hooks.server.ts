import { dev } from '$app/environment';
import { redirect, type Handle } from '@sveltejs/kit';

function isPath(pathname: string, base: string): boolean {
	return pathname === base || pathname.startsWith(`${base}/`);
}

/** Retired entry points. Lab tools and data stay; this app does not host them. */
export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;
	if (isPath(pathname, '/lab')) redirect(301, '/terminal');
	if (isPath(pathname, '/play')) redirect(301, '/dice-roller');
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
