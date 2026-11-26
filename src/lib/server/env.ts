import { dev } from '$app/environment';

/**
 * Credentials and source switches the browser suite must control itself.
 * Wrangler copies `.env` into platform bindings and ignores process.env unless
 * asked, so an empty Playwright variable would otherwise lose to a local secret.
 * Production builds compile `dev` to false, which makes this isolation unreachable.
 */
const ISOLATED_SERVICE_KEYS = new Set([
	'NOTION_API_KEY',
	'NOTION_BLOG_DB_ID',
	'NOTION_CARRIER_JOURNAL_DB_ID',
	'WRITING_SOURCE',
	'JOURNAL_SOURCE',
	'TURNSTILE_SECRET_KEY',
	'CONTACT_FROM_EMAIL',
	'CONTACT_TO_EMAIL',
	'CONTACT_EMAIL_ADAPTER',
	'OPENWEATHER_API_KEY',
	'WEATHER_SOURCE',
	'GROQ_API_KEY',
	'OPENAI_API_KEY',
	'GROQ_MODEL',
	'OPENAI_MODEL'
]);

export function serviceIsolationEnabled(devMode = dev): boolean {
	return devMode && process.env.STEPWEAVER_E2E === '1';
}

function configured(value: unknown): string | undefined {
	if (typeof value !== 'string') return undefined;
	const trimmed = value.trim();
	return trimmed || undefined;
}

export function readServerEnv(
	platform: App.Platform | undefined,
	key: string,
	options?: { isolated?: boolean }
): string | undefined {
	const isolated = options?.isolated ?? serviceIsolationEnabled();
	if (isolated && ISOLATED_SERVICE_KEYS.has(key)) return configured(process.env[key]);
	const record = platform?.env as unknown as Record<string, unknown> | undefined;
	return configured(record?.[key]) ?? configured(process.env[key]);
}

export function writingRequestFromPlatform(platform: App.Platform | undefined) {
	return {
		source: readServerEnv(platform, 'WRITING_SOURCE'),
		apiKey: readServerEnv(platform, 'NOTION_API_KEY'),
		databaseId: readServerEnv(platform, 'NOTION_BLOG_DB_ID'),
		cache: platform?.env?.WRITING_CACHE,
		waitUntil: platform?.ctx
			? (promise: Promise<unknown>) => platform.ctx.waitUntil(promise)
			: undefined
	};
}

export function journalRequestFromPlatform(platform: App.Platform | undefined) {
	return {
		source: readServerEnv(platform, 'JOURNAL_SOURCE'),
		apiKey: readServerEnv(platform, 'NOTION_API_KEY'),
		databaseId: readServerEnv(platform, 'NOTION_CARRIER_JOURNAL_DB_ID'),
		cache: platform?.env?.WRITING_CACHE,
		waitUntil: platform?.ctx
			? (promise: Promise<unknown>) => platform.ctx.waitUntil(promise)
			: undefined
	};
}
