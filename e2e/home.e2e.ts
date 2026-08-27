import { expect, test } from '@playwright/test';

test('home page loads', async ({ page }) => {
	await page.goto('/');

	await expect(page.locator('h1')).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Featured systems' })).toBeVisible();
	await expect(page.getByRole('link', { name: /stepweaver\.dev/i })).toHaveAttribute(
		'href',
		'/work/stepweaver-dev'
	);
});
