import { defineConfig } from '@playwright/test';

export default defineConfig({
	workers: 1,
	webServer: {
		command: 'pnpm exec vite dev --port 4173 --strictPort',
		url: 'http://localhost:4173',
		reuseExistingServer: false,
		timeout: 120_000,
		env: {
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
			NOTION_API_KEY: '',
			NOTION_BLOG_DB_ID: '',
			CONTACT_FROM_EMAIL: '',
			CONTACT_TO_EMAIL: ''
		}
	},
	use: {
		baseURL: 'http://localhost:4173'
	},
	testMatch: '**/*.e2e.{ts,js}'
});
