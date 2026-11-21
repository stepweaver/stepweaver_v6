export function readServerEnv(platform: App.Platform | undefined, key: string): string | undefined {
	const record = platform?.env as unknown as Record<string, unknown> | undefined;
	const fromPlatform = record?.[key];
	if (typeof fromPlatform === 'string' && fromPlatform.trim()) return fromPlatform.trim();
	const fromProcess = process.env[key];
	if (typeof fromProcess === 'string' && fromProcess.trim()) return fromProcess.trim();
	return undefined;
}

export function writingRequestFromPlatform(platform: App.Platform | undefined) {
	return {
		source: readServerEnv(platform, 'WRITING_SOURCE'),
		apiKey: readServerEnv(platform, 'NOTION_API_KEY'),
		databaseId: readServerEnv(platform, 'NOTION_BLOG_DB_ID')
	};
}
