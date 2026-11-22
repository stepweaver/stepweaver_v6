export type LambdaResult = { ok: true; message: string } | { ok: false; message: string };

const OFFLINE = 'λlambda could not reach the model. The conversation is still here.';
const UNCONFIGURED = 'λlambda is answering from the public site brief. The model is not configured.';

export async function completeLambda(input: {
	brief: string;
	message: string;
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
		return { ok: true, message: `${UNCONFIGURED}\n${groundedReply(input.brief, message)}` };
	}
	const fetcher = input.fetch ?? fetch;
	try {
		if (groqKey) {
			return await completeChat(fetcher, {
				url: 'https://api.groq.com/openai/v1/chat/completions',
				key: groqKey,
				model: input.groqModel?.trim() || 'llama-3.3-70b-versatile',
				brief: input.brief,
				message
			});
		}
		return await completeChat(fetcher, {
			url: 'https://api.openai.com/v1/chat/completions',
			key: openaiKey as string,
			model: input.openaiModel?.trim() || 'gpt-4o-mini',
			brief: input.brief,
			message
		});
	} catch {
		return { ok: false, message: OFFLINE };
	}
}

async function completeChat(
	fetcher: typeof fetch,
	input: { url: string; key: string; model: string; brief: string; message: string }
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
			messages: [
				{ role: 'system', content: input.brief },
				{ role: 'user', content: input.message }
			]
		}),
		signal: AbortSignal.timeout(20_000)
	});
	if (!response.ok) return { ok: false, message: OFFLINE };
	const data = (await response.json()) as {
		choices?: { message?: { content?: string } }[];
	};
	const text = data.choices?.[0]?.message?.content?.trim();
	if (!text) return { ok: false, message: OFFLINE };
	return { ok: true, message: text };
}

function groundedReply(brief: string, message: string): string {
	const title = brief.match(/^Title: (.+)$/m)?.[1] ?? 'the public profile';
	const writing = brief.includes('No published posts') ? 'Writing is not loaded right now.' : 'Published writing is listed on /writing.';
	const studies = brief.includes('No case studies are public.')
		? 'No case studies are public on this site.'
		: 'Public case studies are on /work.';
	const topic = message.replace(/\s+/g, ' ').slice(0, 160);
	return `Stephen Weaver is a ${title}. ${writing} ${studies} You asked: ${topic}`;
}
