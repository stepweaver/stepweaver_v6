/**
 * One named object per deployment. The cap is a single site-wide counter,
 * so every reservation has to land on the same Durable Object.
 */
export const LAMBDA_DAILY_BUDGET_OBJECT = 'lambda-provider-attempts';

/** Outbound model attempts shared by the site widget and the terminal. */
export const LAMBDA_DAILY_ATTEMPT_CAP = 200;

/** How long a request waits for the Durable Object before it refuses to call a model. */
export const LAMBDA_RESERVATION_WAIT_MS = 1_000;

export const LAMBDA_DAILY_LIMIT_MESSAGE =
	"λlambda has reached the site's daily limit. Try again after 00:00 UTC.";

export const LAMBDA_TURNED_OFF_MESSAGE = 'λlambda is turned off. The public pages are still here.';

export const LAMBDA_BUDGET_UNAVAILABLE_MESSAGE =
	'λlambda could not check the site limit, so it did not call the model.';

export const LAMBDA_PROVIDER_FAILURE_MESSAGE =
	'λlambda could not reach the model. The conversation is still here.';

export type BudgetRow = { day: string; used: number };

export type SlotDecision =
	{ granted: true; state: BudgetRow } | { granted: false; resetAt: number; state: BudgetRow };

export type ReservationResponse = { granted: true } | { granted: false; resetAt: number };

export type AttemptReservation =
	{ status: 'granted' } | { status: 'denied'; resetAt: number } | { status: 'unavailable' };

export type LambdaAttemptBudget = {
	reserve(): Promise<ReservationResponse> | ReservationResponse;
};

export type LambdaBudgetNamespace = {
	getByName(name: string): {
		reserve(): Promise<ReservationResponse> | ReservationResponse;
	};
};

/** Unset means on. Only the exact value `off` disables provider calls. */
export function lambdaChatEnabled(value: string | undefined): boolean {
	return value?.trim() !== 'off';
}

export function utcDay(now: number): string {
	return new Date(now).toISOString().slice(0, 10);
}

/** First millisecond of the next UTC day. The route turns this into Retry-After. */
export function nextUtcMidnight(now: number): number {
	const [year, month, date] = utcDay(now).split('-').map(Number);
	return Date.UTC(year, month - 1, date + 1);
}

export function retryAfterSeconds(resetAt: number, now: number): number {
	return Math.max(1, Math.ceil((resetAt - now) / 1000));
}

/**
 * Pure reservation step. The Durable Object calls this with its own clock.
 * A new UTC day resets on this call, then takes one slot. A denial does not increment.
 */
export function reserveSlot(
	current: BudgetRow | null,
	now: number,
	cap = LAMBDA_DAILY_ATTEMPT_CAP
): SlotDecision {
	const day = utcDay(now);
	const usedToday = current?.day === day ? current.used : 0;
	if (usedToday >= cap) {
		return { granted: false, resetAt: nextUtcMidnight(now), state: { day, used: usedToday } };
	}
	return { granted: true, state: { day, used: usedToday + 1 } };
}

export function lambdaBudget(namespace: LambdaBudgetNamespace): LambdaAttemptBudget {
	const stub = namespace.getByName(LAMBDA_DAILY_BUDGET_OBJECT);
	return {
		reserve: () => stub.reserve()
	};
}

/**
 * A grant that arrives after the wait is ignored. The object may already have
 * stored that slot; callers must not refund it and must not start a model call.
 */
export async function reserveWithin(
	budget: LambdaAttemptBudget | undefined,
	waitMs = LAMBDA_RESERVATION_WAIT_MS
): Promise<AttemptReservation> {
	if (!budget) return { status: 'unavailable' };
	let abandoned = false;
	let timer: ReturnType<typeof setTimeout> | undefined;
	try {
		const pending = Promise.resolve(budget.reserve()).then((value) => {
			if (abandoned) return null;
			return value;
		});
		const timeout = new Promise<null>((resolve) => {
			timer = setTimeout(() => {
				abandoned = true;
				resolve(null);
			}, waitMs);
		});
		const result = await Promise.race([pending, timeout]);
		if (!result) return { status: 'unavailable' };
		if (result.granted === true) return { status: 'granted' };
		if (result.granted === false && Number.isFinite(result.resetAt)) {
			return { status: 'denied', resetAt: result.resetAt };
		}
		return { status: 'unavailable' };
	} catch (error) {
		console.error('Lambda budget reservation failed', {
			errorType: error instanceof Error ? error.name : 'UnknownError'
		});
		return { status: 'unavailable' };
	} finally {
		if (timer) clearTimeout(timer);
	}
}
