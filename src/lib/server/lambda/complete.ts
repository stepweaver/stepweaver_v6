type Turn = { role: 'user' | 'assistant'; content: string };

export type LambdaResult = { ok: true; message: string } | { ok: false; message: string };

const OFFLINE = 'λlambda could not reach the model. The conversation is still here.';
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
	fetch?: typeof fetch;
}): Promise<LambdaResult> {
	const message = input.message.trim();
	if (!message) return { ok: false, message: 'Usage: chat <message>' };
	const groqKey = input.groqKey?.trim();
	const openaiKey = input.openaiKey?.trim();
	if (!groqKey && !openaiKey) {
		return { ok: true, message: `${UNCONFIGURED}\n${groundedReply(input.brief)}` };
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
	const signal = AbortSignal.timeout(20_000);
	for (const { url, key, model } of providers) {
		if (!key || signal.aborted) continue;
		try {
			const result = await completeChat(
				fetcher,
				{ url, key, model, messages },
				AbortSignal.any([signal, AbortSignal.timeout(9000)])
			);
			if (result.ok) return result;
		} catch {
			// Continue to the configured fallback on timeout, network, or response parsing errors.
		}
	}
	return { ok: false, message: OFFLINE };
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
		redirect: 'error',
		signal
	});
	if (!response.ok) return { ok: false, message: OFFLINE };
	const data = (await response.json()) as {
		choices?: { message?: { content?: string } }[];
	};
	const text = data.choices?.[0]?.message?.content?.trim();
	if (!text) return { ok: false, message: OFFLINE };
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
