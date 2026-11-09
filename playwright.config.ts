import { defineConfig } from '@playwright/test';

export default defineConfig({
	workers: 1,
	webServer: {
		command: 'pnpm exec vite dev --port 4173 --strictPort',
		url: 'http://localhost:4173',
		reuseExistingServer: false,
		timeout: 120_000,
		env: {
			WRITING_SOURCE: 'fixture',
			CONTACT_EMAIL_ADAPTER: 'mock',
			TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA',
			PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA'
		}
	},
	use: {
		baseURL: 'http://localhost:4173'
	},
	testMatch: '**/*.e2e.{ts,js}'
});
