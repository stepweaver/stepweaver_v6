import { describe, expect, it } from 'vitest';
import { PRIMARY_TITLE } from '$lib/data/identity';
import { publicLambdaBrief } from '$lib/server/lambda/brief';
import { completeLambda } from '$lib/server/lambda/complete';

describe('λlambda', () => {
	it('builds a brief from public writing and public case studies only', () => {
		const brief = publicLambdaBrief({
			posts: [
				{
					title: 'Workflow handoffs',
					slug: 'workflow-handoffs',
					date: '2026-09-01',
					updated: '2026-09-02',
					excerpt: 'Where a handoff drops the work.',
					tags: ['systems']
				}
			],
			projects: []
		});
		expect(brief).toContain(PRIMARY_TITLE);
		expect(brief).toContain('Workflow handoffs');
		expect(brief).toContain('No case studies are public.');
		expect(brief).not.toContain('λledger');
		expect(brief).not.toContain('Silent Auction');
		expect(brief).not.toContain('Parcel Sweep');
	});

	it('answers from the brief when no model is configured', async () => {
		const brief = publicLambdaBrief({ posts: [], projects: [] });
		const result = await completeLambda({ brief, message: 'What does Stephen do?' });
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.message).toContain('not configured');
		expect(result.message).toContain(PRIMARY_TITLE);
		expect(result.message).not.toContain('λledger');
	});

	it('keeps a failure when the provider errors', async () => {
		const result = await completeLambda({
			brief: 'Title: Example',
			message: 'Hello',
			groqKey: 'test-key',
			fetch: async () => new Response('no', { status: 500 })
		});
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.message).toContain('could not reach the model');
	});
	it('falls back on a network failure and treats visitor history as untrusted', async () => {
		const providers: string[] = [];
		const result = await completeLambda({
			brief: 'Use the public brief.',
			message: 'Can you elaborate?',
			history: [{ role: 'assistant', content: 'Earlier answer' }],
			groqKey: 'groq-test-key',
			openaiKey: 'openai-test-key',
			fetch: async (url, init) => {
				const host = new URL(String(url)).hostname;
				providers.push(host);
				if (host === 'api.groq.com') throw new Error('Network failure');
				const payload = JSON.parse(String(init?.body));
				expect(payload.messages.map(({ role }: { role: string }) => role)).toEqual([
					'system',
					'user',
					'user'
				]);
				expect(payload.messages[1].content).toContain('Earlier answer');
				return Response.json({ choices: [{ message: { content: 'A public answer.' } }] });
			}
		});
		expect(providers).toEqual(['api.groq.com', 'api.openai.com']);
		expect(result).toEqual({ ok: true, message: 'A public answer.' });
	});
});
