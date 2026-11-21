export type RichSpan = {
	text: string;
	href?: string;
	bold?: boolean;
	italic?: boolean;
	code?: boolean;
};

export type RenderBlock =
	| { type: 'paragraph'; spans: RichSpan[] }
	| { type: 'heading'; level: 2 | 3 | 4; text: string; id: string }
	| { type: 'quote'; spans: RichSpan[] }
	| { type: 'code'; text: string; language: string }
	| { type: 'divider' }
	| { type: 'list'; ordered: boolean; items: RichSpan[][] }
	| { type: 'image'; src: string; alt: string }
	| { type: 'unsupported'; name: string };

export type WritingEntry = {
	id: string;
	title: string;
	slug: string;
	legacySlugs: string[];
	date: string;
	updated: string;
	excerpt: string;
	tags: string[];
};

export type WritingSourceState = 'ok' | 'unconfigured' | 'unavailable';

export type WritingCatalog = {
	status: WritingSourceState;
	stale: boolean;
	posts: WritingEntry[];
};
