import { defineConfig } from '@playwright/test';

const isolated = {
	// Dev-only. readServerEnv ignores platform secrets from .env while this is set.
	STEPWEAVER_E2E: '1',
	WRITING_SOURCE: 'fixture',
	WEATHER_SOURCE: 'fixture',
	CONTACT_EMAIL_ADAPTER: 'mock',
	TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA',
	PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
	OPENWEATHER_API_KEY: '',
	GROQ_API_KEY: '',
	OPENAI_API_KEY: '',
	GROQ_MODEL: '',
	OPENAI_MODEL: '',
	LAMBDA_CHAT: '',
	NOTION_API_KEY: '',
	NOTION_BLOG_DB_ID: '',
	NOTION_CARRIER_JOURNAL_DB_ID: '',
	CONTACT_FROM_EMAIL: '',
	CONTACT_TO_EMAIL: ''
};

function devServer(port: number, journalSource: string) {
	return {
		command: `pnpm exec vite dev --port ${port} --strictPort`,
		url: `http://localhost:${port}`,
		reuseExistingServer: false,
		timeout: 120_000,
		env: {
			...isolated,
			JOURNAL_SOURCE: journalSource
		}
	};
}

export default defineConfig({
	workers: 1,
	testMatch: '**/*.e2e.{ts,js}',
	reporter: process.env.CI ? [['dot'], ['html', { open: 'never' }]] : [['list']],
	use: {
		trace: process.env.CI ? 'retain-on-failure' : 'off',
		screenshot: process.env.CI ? 'only-on-failure' : 'off'
	},
	webServer: [devServer(4173, 'fixture'), devServer(4174, 'unavailable')],
	projects: [
		{
			name: 'site',
			testIgnore: '**/field-journal-unavailable.e2e.ts',
			use: { baseURL: 'http://localhost:4173' }
		},
		{
			name: 'journal-unavailable',
			testMatch: '**/field-journal-unavailable.e2e.ts',
			use: { baseURL: 'http://localhost:4174' }
		}
	]
});
