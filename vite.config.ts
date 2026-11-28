import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import { ensureWorkerBudgetExport } from './scripts/ensure-worker-budget-export.mjs';

ensureWorkerBudgetExport();

function cloudflareAdapter() {
	const plugin = adapter();
	const adapt = plugin.adapt.bind(plugin);
	plugin.adapt = async (builder) => {
		await adapt(builder);
		if (!ensureWorkerBudgetExport()) {
			throw new Error(
				'The SvelteKit Cloudflare worker was not written, so LambdaDailyBudget could not be exported.'
			);
		}
	};
	return plugin;
}

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: cloudflareAdapter(),
			csp: {
				mode: 'auto',
				directives: {
					'default-src': ['self'],
					'script-src': ['self', 'https://challenges.cloudflare.com'],
					'style-src': ['self', 'unsafe-inline'],
					'img-src': ['self', 'https:', 'data:'],
					'connect-src': ['self', 'https://challenges.cloudflare.com'],
					'frame-src': ['https://challenges.cloudflare.com'],
					'frame-ancestors': ['none'],
					'object-src': ['none'],
					'base-uri': ['none'],
					'form-action': ['self']
				}
			}
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
