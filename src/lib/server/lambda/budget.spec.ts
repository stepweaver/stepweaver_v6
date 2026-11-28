import { describe, expect, it } from 'vitest';
import {
	LAMBDA_DAILY_ATTEMPT_CAP,
	LAMBDA_DAILY_BUDGET_OBJECT,
	LAMBDA_RESERVATION_WAIT_MS,
	lambdaChatEnabled,
	nextUtcMidnight,
	reserveSlot,
	reserveWithin,
	retryAfterSeconds,
	utcDay,
	type BudgetRow
} from './budget';

describe('daily attempt budget', () => {
	it('names the cap, the wait, and the single site object', () => {
		expect(LAMBDA_DAILY_ATTEMPT_CAP).toBe(200);
		expect(LAMBDA_RESERVATION_WAIT_MS).toBe(1000);
		expect(LAMBDA_DAILY_BUDGET_OBJECT).toBe('lambda-provider-attempts');
	});

	it('resets lazily on the first reservation of the next UTC day', () => {
		const newYearsEve = Date.UTC(2026, 11, 31, 23, 30, 0);
		let state: BudgetRow | null = null;
		for (let attempt = 0; attempt < LAMBDA_DAILY_ATTEMPT_CAP; attempt += 1) {
			const decision = reserveSlot(state, newYearsEve);
			expect(decision.granted).toBe(true);
			if (!decision.granted) return;
			state = decision.state;
		}
		expect(state).toEqual({ day: '2026-12-31', used: 200 });
		const denied = reserveSlot(state, newYearsEve);
		expect(denied.granted).toBe(false);
		if (denied.granted) return;
		expect(denied.state).toEqual({ day: '2026-12-31', used: 200 });
		expect(denied.resetAt).toBe(Date.UTC(2027, 0, 1));
		expect(utcDay(newYearsEve)).toBe('2026-12-31');
		expect(nextUtcMidnight(newYearsEve)).toBe(Date.UTC(2027, 0, 1));

		const nextDay = Date.UTC(2027, 0, 1, 0, 0, 0);
		const rolled = reserveSlot(denied.state, nextDay);
		expect(rolled).toEqual({ granted: true, state: { day: '2027-01-01', used: 1 } });
	});

	it('does not carry a partial count into the next UTC day', () => {
		const decision = reserveSlot({ day: '2026-11-27', used: 5 }, Date.UTC(2026, 10, 28, 0, 0, 1));
		expect(decision).toEqual({ granted: true, state: { day: '2026-11-28', used: 1 } });
	});

	it('turns the reset time into whole seconds until UTC midnight', () => {
		expect(retryAfterSeconds(10_500, 8_000)).toBe(3);
		expect(retryAfterSeconds(1_001, 1_000)).toBe(1);
		expect(retryAfterSeconds(1_000, 5_000)).toBe(1);
	});

	it('treats only the exact value off as the operator switch', () => {
		expect(lambdaChatEnabled(undefined)).toBe(true);
		expect(lambdaChatEnabled('')).toBe(true);
		expect(lambdaChatEnabled('on')).toBe(true);
		expect(lambdaChatEnabled('OFF')).toBe(true);
		expect(lambdaChatEnabled('off')).toBe(false);
		expect(lambdaChatEnabled(' off ')).toBe(false);
	});

	it('fails closed when the counter is missing, throws, or answers too late', async () => {
		expect(await reserveWithin(undefined, 20)).toEqual({ status: 'unavailable' });
		expect(
			await reserveWithin(
				{
					reserve: async () => {
						throw new Error('storage down');
					}
				},
				20
			)
		).toEqual({ status: 'unavailable' });
		let late = false;
		const stalled = reserveWithin(
			{
				reserve: () =>
					new Promise((resolve) => {
						setTimeout(() => {
							late = true;
							resolve({ granted: true });
						}, 50);
					})
			},
			20
		);
		await expect(stalled).resolves.toEqual({ status: 'unavailable' });
		await new Promise((resolve) => setTimeout(resolve, 70));
		expect(late).toBe(true);
	});
});
