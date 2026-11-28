import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { originAllowed } from '$lib/server/contact/submit';
import { BodyTimeoutError, readBoundedJson } from '$lib/server/security/bounded-body';
import { publicApiLimit } from '$lib/server/security/public-api';
import { readServerEnv } from '$lib/server/env';
import { lambdaBudget, retryAfterSeconds } from '$lib/server/lambda/budget';
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
		return json(
			{ error: 'λlambda could not take that request.' },
			{ status: 403, headers: HEADERS }
		);
	}
	const contentType = event.request.headers.get('content-type') ?? '';
	if (contentType.toLowerCase().split(';')[0]?.trim() !== 'application/json') {
		return json({ error: 'Expected application/json' }, { status: 415, headers: HEADERS });
	}
	const length = Number(event.request.headers.get('content-length') ?? '0');
	if (Number.isFinite(length) && length > MAX_BODY) {
		return json({ error: 'That message is too large.' }, { status: 413, headers: HEADERS });
	}
	const limit = await publicApiLimit(event, 'chat');
	if (limit !== 200) {
		return json(
			{
				error:
					limit === 429
						? 'Too many messages. Try again in a minute.'
						: 'Chat is temporarily unavailable.'
			},
			{ status: limit, headers: limit === 429 ? { ...HEADERS, 'retry-after': '60' } : HEADERS }
		);
	}
	let body: unknown;
	try {
		body = await readBoundedJson(event.request, MAX_BODY);
	} catch (error) {
		const tooLarge = error instanceof RangeError;
		const timedOut = error instanceof BodyTimeoutError;
		return json(
			{
				error: tooLarge
					? 'That message is too large.'
					: timedOut
						? 'The request timed out.'
						: 'Expected application/json'
			},
			{ status: tooLarge ? 413 : timedOut ? 408 : 400, headers: HEADERS }
		);
	}
	const request = normalizeConversation(body);
	if (!request) return json({ error: 'Usage: chat <message>' }, { status: 400, headers: HEADERS });
	const catalog = await getWritingCatalog({
		...writingRequestFromPlatform(event.platform),
		nonBlocking: true
	});
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
	const budgetBinding = event.platform?.env?.LAMBDA_DAILY_BUDGET;
	const result = await completeLambda({
		brief,
		...request,
		groqKey: readServerEnv(event.platform, 'GROQ_API_KEY'),
		openaiKey: readServerEnv(event.platform, 'OPENAI_API_KEY'),
		groqModel: readServerEnv(event.platform, 'GROQ_MODEL'),
		openaiModel: readServerEnv(event.platform, 'OPENAI_MODEL'),
		lambdaChat: readServerEnv(event.platform, 'LAMBDA_CHAT'),
		budget: budgetBinding ? lambdaBudget(budgetBinding) : undefined,
		requestSignal: event.request.signal
	});
	if (!result.ok) {
		const headers =
			result.status === 429
				? { ...HEADERS, 'retry-after': String(retryAfterSeconds(result.resetAt, Date.now())) }
				: HEADERS;
		return json({ error: result.message }, { status: result.status, headers });
	}
	return json({ message: result.message }, { headers: HEADERS });
};

function visibleText(content: string): string {
	let text = '';
	for (const char of content) {
		const code = char.codePointAt(0) ?? 0;
		if (code <= 8 || code === 11 || code === 12 || (code >= 14 && code <= 31) || code === 127)
			continue;
		text += char;
	}
	return text.trim();
}

function normalizeConversation(body: unknown) {
	if (!body || typeof body !== 'object') return null;
	const { messages, channel } = body as { messages?: unknown; channel?: unknown };
	if (!Array.isArray(messages)) return null;
	const turns: { role: 'user' | 'assistant'; content: string }[] = [];
	for (const entry of messages.slice(-8)) {
		if (!entry || typeof entry !== 'object') continue;
		const { role, content } = entry as { role?: unknown; content?: unknown };
		if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') continue;
		const clean = visibleText(content).slice(0, 1000);
		if (clean) turns.push({ role, content: clean });
	}
	const latest = turns.pop();
	if (latest?.role !== 'user') return null;
	return {
		message: latest.content,
		history: turns,
		channel: channel === 'terminal' ? ('terminal' as const) : ('widget' as const)
	};
}
