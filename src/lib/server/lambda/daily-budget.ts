import { DurableObject } from 'cloudflare:workers';
import { LAMBDA_DAILY_ATTEMPT_CAP, reserveSlot, type BudgetRow } from './budget';

/**
 * Site-wide daily attempt counter. The UTC day is read here so every isolate
 * shares one clock. Storage is updated inside one synchronous transaction, and
 * a granted slot is never released by this object.
 */
export class LambdaDailyBudget extends DurableObject<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		ctx.blockConcurrencyWhile(async () => {
			this.ctx.storage.sql.exec(
				`CREATE TABLE IF NOT EXISTS budget (
					id INTEGER PRIMARY KEY CHECK (id = 1),
					day TEXT NOT NULL,
					used INTEGER NOT NULL
				)`
			);
		});
	}

	reserve(): { granted: true } | { granted: false; resetAt: number } {
		return this.ctx.storage.transactionSync(() => {
			const now = Date.now();
			const row = this.ctx.storage.sql
				.exec<{ day: string; used: number }>('SELECT day, used FROM budget WHERE id = 1')
				.toArray()[0];
			const decision = reserveSlot(row ? readRow(row) : null, now, LAMBDA_DAILY_ATTEMPT_CAP);
			this.ctx.storage.sql.exec(
				`INSERT INTO budget (id, day, used) VALUES (1, ?, ?)
				 ON CONFLICT(id) DO UPDATE SET day = excluded.day, used = excluded.used`,
				decision.state.day,
				decision.state.used
			);
			if (decision.granted) return { granted: true };
			return { granted: false, resetAt: decision.resetAt };
		});
	}
}

function readRow(row: { day: string; used: number }): BudgetRow {
	if (typeof row.day !== 'string' || !Number.isInteger(row.used) || row.used < 0) {
		throw new Error('Lambda budget row is unreadable');
	}
	return { day: row.day, used: row.used };
}
