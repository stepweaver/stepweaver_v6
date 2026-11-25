/** Public canonical origin. Apex requests redirect here; do not derive this from Host. */
export const SITE_ORIGIN = 'https://www.stepweaver.dev';

export function absoluteSiteUrl(path = '/'): string {
	if (path.startsWith('https://')) return path;
	const normalized = path.startsWith('/') ? path : `/${path}`;
	return normalized === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${normalized}`;
}
