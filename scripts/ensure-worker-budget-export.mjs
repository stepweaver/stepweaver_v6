import { existsSync, readFileSync, writeFileSync } from 'node:fs';

/**
 * adapter-cloudflare writes `.svelte-kit/cloudflare/_worker.js` with only a
 * default export. Durable Objects have to be exported from that same entry.
 * Append the class after the adapter finishes so Wrangler still bundles it.
 */
export const WORKER_ENTRY = '.svelte-kit/cloudflare/_worker.js';
export const BUDGET_EXPORT =
	"export { LambdaDailyBudget } from '../../src/lib/server/lambda/daily-budget.ts';";

export function ensureWorkerBudgetExport() {
	if (!existsSync(WORKER_ENTRY)) return false;
	const source = readFileSync(WORKER_ENTRY, 'utf8');
	if (source.includes(BUDGET_EXPORT)) return true;
	const next = source.endsWith('\n') ? source : `${source}\n`;
	writeFileSync(WORKER_ENTRY, `${next}${BUDGET_EXPORT}\n`);
	return true;
}
