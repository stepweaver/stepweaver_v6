/**
 * Frozen public URLs for pages that are already published on stepweaver.dev.
 * Audited 2026-11-09 against the live /writing index and the Notion page ids.
 * There is no editable Slug property on the database. Do not rename these.
 *
 * Resolution order for a published page:
 * 1. This registry, so a later title edit cannot move an existing URL.
 * 2. A rich-text property named Slug, if one is added later for a page that is not listed here.
 * 3. slugify(title), for a page published after this audit.
 *
 * New articles keep slugify(title) until their page id is added here. Add the id
 * and the slug you want to keep before renaming the title. /writing/p/{pageId}
 * always redirects to the canonical slug and does not depend on the title.
 * A title-derived slug that differs from the canonical slug redirects to it.
 */
export const PUBLISHED_PAGE_SLUGS = [
	{
		pageId: '304bc620-4ba0-8079-a195-e87f5c46eaf7',
		slug: 'ai-resume-guide',
		title: 'AI Resume Guide'
	},
	{
		pageId: '304bc620-4ba0-8070-b0f4-e3e6652ae681',
		slug: 'why-do-ladybugs-flip-over-when-they-die',
		title: 'Why Do Ladybugs Flip Over When They Die?'
	},
	{
		pageId: '359bc620-4ba0-80b8-8c9e-d28168da82f7',
		slug: 'how-i-found-my-professional-positioning',
		title: 'How I Found My Professional Positioning'
	},
	{
		pageId: '32ebc620-4ba0-8105-bcd8-dc1184dcbc84',
		slug: 'sigil-first-contact',
		title: 'λsigil: First Contact'
	},
	{
		pageId: '31cbc620-4ba0-8018-8522-fcef67050f08',
		slug: 'building-cerebro-a-postgres-mcp-integrated-memory-layer-for-ai-tools',
		title: 'Building λcerebro: A Postgres + MCP Integrated Memory Layer for AI Tools'
	},
	{
		pageId: '304bc620-4ba0-8094-8b3f-d734d64d7afe',
		slug: 'i-built-the-coolest-ai-resume-and-it-actually-talks-back',
		title: 'I Built the COOLEST AI Resume! (And It Actually Talks Back)'
	},
	{
		pageId: '310bc620-4ba0-8007-b49d-e2038d6c4b6b',
		slug: 'building-a-home-meshtastic-gateway',
		title: 'Building a Home Meshtastic Gateway'
	},
	{
		pageId: '304bc620-4ba0-80bc-be6d-ea41a7a6dd60',
		slug: 'exploring-meshtastic',
		title: 'Exploring Meshtastic'
	},
	{
		pageId: '304bc620-4ba0-80a1-b1df-db22f4d50625',
		slug: 'rpg-dice-roller',
		title: 'RPG Dice Roller'
	},
	{
		pageId: '304bc620-4ba0-806b-8b01-f2312c29505a',
		slug: 'terminal-calculator',
		title: 'Terminal Calculator'
	}
] as const;

export function registrySlug(pageId: string, extra: Record<string, string> = {}): string | null {
	const key = pageId.replace(/-/g, '').toLowerCase();
	for (const [id, slug] of Object.entries(extra)) {
		if (id.replace(/-/g, '').toLowerCase() === key) return slug;
	}
	const row = PUBLISHED_PAGE_SLUGS.find(
		(entry) => entry.pageId.replace(/-/g, '').toLowerCase() === key
	);
	return row?.slug ?? null;
}
