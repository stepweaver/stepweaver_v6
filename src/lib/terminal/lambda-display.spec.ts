import { describe, expect, it } from 'vitest';
import {
	LAMBDA_BUDGET_UNAVAILABLE_MESSAGE,
	LAMBDA_DAILY_LIMIT_MESSAGE,
	LAMBDA_PROVIDER_FAILURE_MESSAGE,
	LAMBDA_TURNED_OFF_MESSAGE
} from '$lib/server/lambda/budget';
import { performEffect } from '$lib/terminal/effects';

const fixtures = [
	{ status: 429, message: LAMBDA_DAILY_LIMIT_MESSAGE },
	{ status: 503, message: LAMBDA_TURNED_OFF_MESSAGE },
	{ status: 503, message: LAMBDA_BUDGET_UNAVAILABLE_MESSAGE },
	{ status: 502, message: LAMBDA_PROVIDER_FAILURE_MESSAGE }
];

describe('terminal λlambda errors', () => {
	it('shows fixture chat errors in the existing error line', async () => {
		for (const fixture of fixtures) {
			const outcome = await performEffect({ type: 'chat', message: 'Hello' }, async () =>
				Response.json(
					{ error: fixture.message },
					{ status: fixture.status, headers: { 'cache-control': 'no-store' } }
				)
			);
			expect(outcome.lines).toEqual([{ content: fixture.message, variant: 'error' }]);
		}
	});
});
