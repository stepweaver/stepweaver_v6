import {
	LAMBDA_BUDGET_UNAVAILABLE_MESSAGE,
	LAMBDA_DAILY_LIMIT_MESSAGE,
	LAMBDA_PROVIDER_FAILURE_MESSAGE,
	LAMBDA_RESERVATION_WAIT_MS,
	LAMBDA_TURNED_OFF_MESSAGE,
	lambdaChatEnabled,
	reserveWithin,
	type LambdaAttemptBudget
} from '$lib/server/lambda/budget';

type Turn = { role: 'user' | 'assistant'; content: string };

export type LambdaResult =
	| { ok: true; message: string }
	| { ok: false; status: 400 | 502 | 503; message: string }
	| { ok: false; status: 429; message: string; resetAt: number };

const UNCONFIGURED =
	'λlambda is answering from the public site brief. The model is not configured.';

export async function completeLambda(input: {
	brief: string;
	message: string;
	history?: Turn[];
	channel?: 'widget' | 'terminal';
	groqKey?: string;
	openaiKey?: string;
	groqModel?: string;
	openaiModel?: string;
	lambdaChat?: string;
	budget?: LambdaAttemptBudget;
	deadline?: AbortSignal;
	requestSignal?: AbortSignal;
	reservationWaitMs?: number;
	fetch?: typeof fetch;
}): Promise<LambdaResult> {
	const message = input.message.trim();
	if (!message) return { ok: false, status: 400, message: 'Usage: chat <message>' };
	const groqKey = input.groqKey?.trim();
	const openaiKey = input.openaiKey?.trim();
	if (!groqKey && !openaiKey) {
		return { ok: true, message: `${UNCONFIGURED}\n${groundedReply(input.brief)}` };
	}
	if (!lambdaChatEnabled(input.lambdaChat)) {
		return { ok: false, status: 503, message: LAMBDA_TURNED_OFF_MESSAGE };
	}
	const fetcher = input.fetch ?? fetch;
	const providers = [
		{
			url: 'https://api.groq.com/openai/v1/chat/completions',
			key: groqKey,
			model: input.groqModel?.trim() || 'llama-3.3-70b-versatile'
		},
		{
			url: 'https://api.openai.com/v1/chat/completions',
			key: openaiKey,
			model: input.openaiModel?.trim() || 'gpt-4o-mini'
		}
	];
	const mode =
		input.channel === 'terminal'
			? 'Terminal mode. Keep it punchy and use plain URLs.'
			: 'Website mode. Give a concise answer and point to a relevant site page when helpful.';
	const messages = [
		{ role: 'system', content: `${mode}\n${input.brief}` },
		// The browser controls the transcript. Keep it at user privilege.
		...(input.history?.length
			? [
					{
						role: 'user',
						content: `Unverified conversation history for context only:\n${JSON.stringify(input.history)}`
					}
				]
			: []),
		{ role: 'user', content: message }
	];
	const deadline = input.deadline ?? AbortSignal.timeout(20_000);
	const waitMs = input.reservationWaitMs ?? LAMBDA_RESERVATION_WAIT_MS;
	for (const { url, key, model } of providers) {
		if (deadline.aborted || input.requestSignal?.aborted) break;
		if (!key) continue;
		const reservation = await reserveWithin(input.budget, waitMs);
		if (reservation.status === 'unavailable') {
			return { ok: false, status: 503, message: LAMBDA_BUDGET_UNAVAILABLE_MESSAGE };
		}
		if (reservation.status === 'denied') {
			return {
				ok: false,
				status: 429,
				message: LAMBDA_DAILY_LIMIT_MESSAGE,
				resetAt: reservation.resetAt
			};
		}
		// A slot granted after the deadline, or after the visitor left, stays spent.
		if (deadline.aborted || input.requestSignal?.aborted) break;
		try {
			const result = await completeChat(
				fetcher,
				{ url, key, model, messages },
				AbortSignal.any([deadline, AbortSignal.timeout(9000)])
			);
			if (result.ok) return result;
		} catch (error) {
			console.error('Lambda provider failed', {
				errorType: error instanceof Error ? error.name : 'UnknownError'
			});
		}
	}
	return { ok: false, status: 502, message: LAMBDA_PROVIDER_FAILURE_MESSAGE };
}

async function completeChat(
	fetcher: typeof fetch,
	input: { url: string; key: string; model: string; messages: { role: string; content: string }[] },
	signal: AbortSignal
): Promise<LambdaResult> {
	const response = await fetcher(input.url, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			authorization: `Bearer ${input.key}`
		},
		body: JSON.stringify({
			model: input.model,
			temperature: 0.4,
			max_tokens: 300,
			messages: input.messages
		}),
		redirect: 'manual',
		signal
	});
	if (!response.ok) {
		console.error('Lambda provider failed', { status: response.status });
		return { ok: false, status: 502, message: LAMBDA_PROVIDER_FAILURE_MESSAGE };
	}
	const data = (await response.json()) as {
		choices?: { message?: { content?: string } }[];
	};
	const text = data.choices?.[0]?.message?.content?.trim();
	if (!text) return { ok: false, status: 502, message: LAMBDA_PROVIDER_FAILURE_MESSAGE };
	return { ok: true, message: text.slice(0, 2000) };
}

function groundedReply(brief: string): string {
	const title = brief.match(/^Title: (.+)$/m)?.[1] ?? 'the public profile';
	const writing = brief.includes('No published posts')
		? 'Writing is not loaded right now.'
		: 'Published writing is listed on /writing.';
	const studies = brief.includes('No case studies are public.')
		? 'No case studies are public on this site.'
		: 'Public case studies are on /work.';
	return `Stephen Weaver is a ${title}. ${writing} ${studies}`;
}
