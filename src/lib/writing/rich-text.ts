import { SITE_ORIGIN } from '$lib/seo/origin';
import type { RichSpan } from './types';

const SITE_HOSTS = new Set(['stepweaver.dev', 'www.stepweaver.dev']);

export function isSiteHref(value: string): boolean {
	try {
		const url = new URL(value);
		return url.protocol === 'https:' && SITE_HOSTS.has(url.hostname);
	} catch {
		return false;
	}
}

type NotionRichText = {
	plain_text?: string;
	href?: string | null;
	annotations?: {
		bold?: boolean;
		italic?: boolean;
		code?: boolean;
	};
};

export function safeHref(value: string | null | undefined): string | undefined {
	if (!value) return undefined;
	const trimmed = value.trim();
	if (!trimmed) return undefined;
	try {
		const url = new URL(trimmed, SITE_ORIGIN);
		if (url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'mailto:') {
			return url.href;
		}
	} catch {
		return undefined;
	}
	return undefined;
}

export function safeImageSrc(value: string | null | undefined): string | undefined {
	if (!value) return undefined;
	try {
		const url = new URL(value);
		if (url.protocol === 'https:') return url.href;
	} catch {
		return undefined;
	}
	return undefined;
}

/** HTTPS covers use the article image rule. Site portraits stay on local /images paths. */
export function coverImageSrc(value: string | null | undefined): string | undefined {
	const remote = safeImageSrc(value);
	if (remote) return remote;
	const trimmed = value?.trim() ?? '';
	if (/^\/images\/[A-Za-z0-9._-]+$/.test(trimmed)) return trimmed;
	return undefined;
}

export function richSpans(parts: NotionRichText[] | undefined): RichSpan[] {
	if (!parts?.length) return [];
	return parts
		.map((part) => {
			const text = part.plain_text ?? '';
			if (!text) return null;
			const span: RichSpan = { text };
			const href = safeHref(part.href);
			if (href) span.href = href;
			if (part.annotations?.bold) span.bold = true;
			if (part.annotations?.italic) span.italic = true;
			if (part.annotations?.code) span.code = true;
			return span;
		})
		.filter((span): span is RichSpan => span !== null);
}

export function plainText(parts: NotionRichText[] | undefined): string {
	return (parts ?? []).map((part) => part.plain_text ?? '').join('');
}
