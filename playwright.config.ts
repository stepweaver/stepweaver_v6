import { defineConfig } from '@playwright/test';

export default defineConfig({
	workers: 1,
	webServer: {
		command: 'pnpm exec vite dev --port 4173 --strictPort',
		url: 'http://localhost:4173',
		reuseExistingServer: false,
		timeout: 120_000,
		env: {
			WRITING_SOURCE: 'fixture'
		}
	},
	use: {
		baseURL: 'http://localhost:4173'
	},
	testMatch: '**/*.e2e.{ts,js}'
});
