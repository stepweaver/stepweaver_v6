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
});
