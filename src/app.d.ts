// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Platform {
			env: Env & {
				WRITING_CACHE?: KVNamespace;
				CHAT_RATE_LIMITER?: RateLimit;
				WEATHER_RATE_LIMITER?: RateLimit;
			};
			cf: CfProperties;
			ctx: ExecutionContext;
		}
	}
}

export {};
