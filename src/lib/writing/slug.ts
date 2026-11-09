/** v5 permalink rule: lowercase, non-alphanumerics become hyphens, trimmed, 100 chars. */
export function slugifyTitle(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 100);
}

export function normalizePageId(id: string): string {
	return id.replace(/-/g, '').toLowerCase();
}

export function normalizeTag(tag: string): string {
	return tag.trim().toLowerCase().replace(/^#+/, '');
}
