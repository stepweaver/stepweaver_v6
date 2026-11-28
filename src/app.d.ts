// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { LambdaDailyBudget } from './lib/server/lambda/daily-budget';

declare global {
	namespace App {
		interface Platform {
			env: Env & {
				WRITING_CACHE?: KVNamespace;
				CHAT_RATE_LIMITER?: RateLimit;
				WEATHER_RATE_LIMITER?: RateLimit;
				LAMBDA_DAILY_BUDGET?: DurableObjectNamespace<LambdaDailyBudget>;
			};
			cf: CfProperties;
			ctx: ExecutionContext;
		}
	}
}

export {};
