export function jsonLdScript(data: unknown): string {
	const json = JSON.stringify(data).replaceAll('<', '\\u003c');
	return `<script type="application/ld+json">${json}</script>`;
}
