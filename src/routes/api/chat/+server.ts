import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { originAllowed } from '$lib/server/contact/submit';
import { allowMemoryRateLimit } from '$lib/server/contact/rate-limit';
import { readServerEnv } from '$lib/server/env';
import { publicLambdaBrief } from '$lib/server/lambda/brief';
import { completeLambda } from '$lib/server/lambda/complete';
import { getPublicWorkCards } from '$lib/projects/publication';
import { getWritingCatalog } from '$lib/server/writing/catalog';
import { writingRequestFromPlatform } from '$lib/server/env';
import type { RequestHandler } from './$types';

const HEADERS = { 'cache-control': 'no-store' };
const MAX_BODY = 20_000;

export const POST: RequestHandler = async (event) => {
	if (!originAllowed(event.request, dev)) {
		return json({ error: 'λlambda could not take that request.' }, { status: 403, headers: HEADERS });
	}
	const contentType = event.request.headers.get('content-type') ?? '';
	if (!contentType.toLowerCase().includes('application/json')) {
		return json({ error: 'Expected application/json' }, { status: 415, headers: HEADERS });
	}
	const length = Number(event.request.headers.get('content-length') ?? '0');
	if (Number.isFinite(length) && length > MAX_BODY) {
		return json({ error: 'That message is too large.' }, { status: 413, headers: HEADERS });
	}
	let address: string;
	try {
		address = event.getClientAddress();
	} catch {
		address = 'unknown';
	}
	if (!allowMemoryRateLimit(`chat:${address}`, 20, 60_000, Date.now())) {
		return json({ error: 'Too many messages. Try again in a minute.' }, { status: 429, headers: HEADERS });
	}
	let body: unknown;
	try {
		body = await event.request.json();
	} catch {
		return json({ error: 'Expected application/json' }, { status: 400, headers: HEADERS });
	}
	const message = latestUserMessage(body);
	if (!message) return json({ error: 'Usage: chat <message>' }, { status: 400, headers: HEADERS });
	const catalog = await getWritingCatalog(writingRequestFromPlatform(event.platform));
	const brief = publicLambdaBrief({
		posts: catalog.posts.map((post) => ({
			title: post.title,
			slug: post.slug,
			date: post.date,
			updated: post.updated,
			excerpt: post.excerpt,
			tags: post.tags
		})),
		projects: getPublicWorkCards()
	});
	const result = await completeLambda({
		brief,
		message,
		groqKey: readServerEnv(event.platform, 'GROQ_API_KEY'),
		openaiKey: readServerEnv(event.platform, 'OPENAI_API_KEY'),
		groqModel: readServerEnv(event.platform, 'GROQ_MODEL'),
		openaiModel: readServerEnv(event.platform, 'OPENAI_MODEL')
	});
	if (!result.ok) return json({ error: result.message }, { status: 502, headers: HEADERS });
	return json({ message: result.message }, { headers: HEADERS });
};

function stripControls(value: string): string {
	let text = '';
	for (const char of value) {
		const code = char.charCodeAt(0);
		if (code === 9 || code === 10 || code === 13 || code >= 32) text += char;
	}
	return text;
}

function latestUserMessage(body: unknown): string {
	if (!body || typeof body !== 'object') return '';
	const messages = (body as { messages?: unknown }).messages;
	if (!Array.isArray(messages)) return '';
	let latest = '';
	for (const entry of messages) {
		if (!entry || typeof entry !== 'object') continue;
		const record = entry as { role?: unknown; content?: unknown };
		if (record.role !== 'user' || typeof record.content !== 'string') continue;
		latest = stripControls(record.content).trim();
	}
	return latest.slice(0, 2000);
}
