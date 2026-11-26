import { expect, test, type Page, type Route } from '@playwright/test';

const WRITING_API = '/api/palette/writing';

async function hydrated(page: Page) {
	await expect(page.locator('[data-ready="true"]')).toHaveCount(1);
}

test('about renders without a writing lookup until the palette opens', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	const requests: string[] = [];
	let gate: Promise<void> = Promise.resolve();
	await page.route(`**${WRITING_API}`, async (route: Route) => {
		requests.push(route.request().url());
		await gate;
		await route.continue();
	});

	const response = await page.goto('/about');
	const html = await response!.text();
	expect(html).not.toContain('workflow-handoffs');
	expect(html).not.toContain('Integration boundaries');
	expect(html).not.toContain('Unpublished operations note');
	expect(response!.headers()['server-timing'] ?? '').not.toContain('writing');
	await hydrated(page);
	expect(requests).toEqual([]);

	let release = () => {};
	gate = new Promise<void>((resolve) => {
		release = resolve;
	});
	await page.getByRole('button', { name: 'Search' }).click();
	const dialog = page.getByRole('dialog', { name: 'Command palette' });
	await expect.poll(() => requests.length).toBe(1);
	await expect(dialog.getByRole('option', { name: 'About', exact: true })).toBeVisible();
	await expect(dialog.getByRole('option', { name: /Workflow handoffs/ })).toHaveCount(0);

	release();
	await expect(dialog.getByRole('option', { name: /Workflow handoffs/ })).toBeVisible();
	await page.getByRole('combobox', { name: 'Search' }).fill('workflow handoffs');
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/\/writing\/workflow-handoffs$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Workflow handoffs');
	expect(requests).toHaveLength(1);

	await page.getByRole('button', { name: 'Search' }).click();
	await expect(dialog).toBeVisible();
	await expect(dialog.getByRole('option', { name: /Workflow handoffs/ })).toBeVisible();
	expect(requests).toHaveLength(1);
});

test('static navigation still works when writing search fails, and the next open retries', async ({
	page
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	let attempts = 0;
	await page.route(`**${WRITING_API}`, async (route) => {
		attempts += 1;
		if (attempts === 1) {
			await route.fulfill({
				status: 503,
				contentType: 'application/json',
				body: JSON.stringify({ posts: [] })
			});
			return;
		}
		await route.continue();
	});

	await page.goto('/about');
	await hydrated(page);
	await page.getByRole('button', { name: 'Search' }).click();
	const dialog = page.getByRole('dialog', { name: 'Command palette' });
	await page.getByRole('combobox', { name: 'Search' }).fill('resume');
	const resume = dialog.getByRole('option', { name: 'Resume', exact: true });
	await expect(resume).toBeVisible();
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/\/resume$/);
	expect(attempts).toBe(1);

	await page.getByRole('button', { name: 'Search' }).click();
	await page.getByRole('combobox', { name: 'Search' }).fill('workflow handoffs');
	await expect(dialog.getByRole('option', { name: /Workflow handoffs/ })).toBeVisible();
	expect(attempts).toBe(2);

	await page.keyboard.press('Escape');
	await page.getByRole('button', { name: 'Search' }).click();
	await expect(dialog.getByRole('option', { name: 'Home', exact: true })).toBeVisible();
	await expect.poll(() => attempts).toBe(2);
});

test('featured writing stays on the homepage without a palette request', async ({ page }) => {
	const requests: string[] = [];
	page.on('request', (request) => {
		if (request.url().includes(WRITING_API)) requests.push(request.url());
	});
	const response = await page.goto('/');
	await expect(page.locator('.lead')).toHaveAttribute('href', '/writing/integration-boundaries');
	await expect(page.locator('.lead').getByRole('heading', { level: 2 })).toHaveText(
		'Integration boundaries'
	);
	await expect(page.getByRole('link', { name: 'Open Terminal' }).first()).toBeVisible();
	expect(response!.headers()['server-timing'] ?? '').toContain('writing');
	expect(requests).toEqual([]);
});
