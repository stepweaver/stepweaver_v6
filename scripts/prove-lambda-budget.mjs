import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	BUDGET_EXPORT,
	ensureWorkerBudgetExport,
	WORKER_ENTRY
} from './ensure-worker-budget-export.mjs';

const budgetSource = readFileSync(
	new URL('../src/lib/server/lambda/budget.ts', import.meta.url),
	'utf8'
);
const cap = Number(budgetSource.match(/export const LAMBDA_DAILY_ATTEMPT_CAP = (\d+)/)?.[1]);
const objectName = budgetSource.match(/export const LAMBDA_DAILY_BUDGET_OBJECT = '([^']+)'/)?.[1];
const wranglerConfig = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');

if (cap !== 200 || !objectName) {
	throw new Error('The daily budget constants could not be read from budget.ts.');
}
if (!wranglerConfig.includes('"name": "LAMBDA_DAILY_BUDGET"')) {
	throw new Error('wrangler.jsonc is missing the LAMBDA_DAILY_BUDGET binding.');
}
if (!wranglerConfig.includes('"class_name": "LambdaDailyBudget"')) {
	throw new Error('wrangler.jsonc is missing the LambdaDailyBudget class binding.');
}
if (!wranglerConfig.includes('"tag": "v1-lambda-daily-budget"')) {
	throw new Error('wrangler.jsonc is missing the v1-lambda-daily-budget migration.');
}
if (!wranglerConfig.includes('"new_sqlite_classes": ["LambdaDailyBudget"]')) {
	throw new Error('wrangler.jsonc is missing the LambdaDailyBudget SQLite migration.');
}
if (!ensureWorkerBudgetExport()) {
	throw new Error(`${WORKER_ENTRY} was not written. Run the production build first.`);
}

const worker = readFileSync(WORKER_ENTRY, 'utf8');
if (!worker.includes(BUDGET_EXPORT)) {
	throw new Error(`${WORKER_ENTRY} does not export LambdaDailyBudget.`);
}
if (!/export\s*\{[^}]*as default/.test(worker) && !worker.includes('export default')) {
	throw new Error(`${WORKER_ENTRY} no longer has a default Worker export.`);
}

const bundleDir = mkdtempSync(join(tmpdir(), 'lambda-budget-bundle-'));
const wranglerBin = fileURLToPath(
	new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url)
);
const bundled = spawnSync(
	process.execPath,
	[wranglerBin, 'deploy', '--dry-run', '--outdir', bundleDir, '--config', 'wrangler.jsonc'],
	{ stdio: 'inherit' }
);
if (bundled.status !== 0) {
	throw new Error('wrangler deploy --dry-run did not bundle the Worker.');
}

const bundlePath = join(bundleDir, '_worker.js');
const bundle = readFileSync(bundlePath, 'utf8').replace(/\n\/\/# sourceMappingURL=.*$/u, '\n');
if (!bundle.includes('class extends DurableObject') || !bundle.includes('LambdaDailyBudget')) {
	throw new Error('The production bundle does not include LambdaDailyBudget.');
}
if (!/export\s*\{[^}]*LambdaDailyBudget/.test(bundle)) {
	throw new Error('The production bundle does not export LambdaDailyBudget.');
}

const require = createRequire(import.meta.resolve('wrangler'));
const { Miniflare } = require('miniflare');
const mf = new Miniflare({
	workers: [
		{
			config: {
				name: 'stepweaver-v6',
				type: 'worker',
				compatibilityDate: '2026-08-16',
				compatibilityFlags: ['nodejs_als'],
				manifest: {
					mainModule: 'worker.js',
					modulesRoot: '/',
					modules: {
						'worker.js': { type: 'esm', contents: bundle }
					}
				},
				exports: {
					LambdaDailyBudget: { type: 'durable-object', storage: 'sqlite' }
				},
				env: {
					LAMBDA_DAILY_BUDGET: {
						type: 'durable-object',
						workerName: 'stepweaver-v6',
						exportName: 'LambdaDailyBudget'
					}
				}
			}
		}
	]
});

try {
	const namespace = await mf.getDurableObjectNamespace('LAMBDA_DAILY_BUDGET', 'stepweaver-v6');
	const stub = namespace.getByName(objectName);
	for (let used = 0; used < cap - 1; used += 1) {
		const result = await stub.reserve();
		if (result?.granted !== true) {
			throw new Error(`Expected a grant while filling the counter at ${used}.`);
		}
	}
	const first = stub.reserve();
	const second = stub.reserve();
	const pair = await Promise.all([first, second]);
	const grants = pair.filter((result) => result?.granted === true);
	const denials = pair.filter((result) => result?.granted === false);
	if (grants.length !== 1 || denials.length !== 1) {
		throw new Error(
			`Overlapping reservations were not one grant and one denial: ${JSON.stringify(pair)}`
		);
	}
	const resetAt = denials[0].resetAt;
	if (typeof resetAt !== 'number' || resetAt <= Date.now() || resetAt % 86_400_000 !== 0) {
		throw new Error(`Denial did not return the next UTC midnight: ${resetAt}`);
	}
	const persisted = await stub.reserve();
	if (persisted?.granted !== false) {
		throw new Error('The granted overlapping reservation was not stored.');
	}
	console.log(
		`LambdaDailyBudget export verified in ${WORKER_ENTRY} and the production bundle. Overlapping reservations with one slot left: 1 grant, 1 denial, resetAt=${resetAt}.`
	);
} finally {
	await mf.dispose();
	rmSync(bundleDir, { recursive: true, force: true });
}
