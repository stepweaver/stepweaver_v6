import { expect, test } from '@playwright/test';

test('home states the consulting identity and hides the project catalog', async ({ page }) => {
	await page.goto('/');

	await expect(page.getByRole('heading', { level: 1 })).toContainText('Business Systems Developer');
	await expect(page.getByRole('heading', { level: 1 })).toContainText(
		'Systems Integration Consultant'
	);
	await expect(page.getByText('no posts are shown')).toBeVisible();
	await expect(page.getByText('HMFIC-01')).toBeVisible();
	await expect(page.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
		'href',
		'https://github.com/stepweaver'
	);
	await expect(page.locator('a[href="/work/stepweaver-dev"]')).toHaveCount(0);
	await expect(page.locator('a[href="/work/silent-auction"]')).toHaveCount(0);
	await expect(page.locator('body')).not.toContainText('Silent Auction');
});

test('unpublished project urls stay unavailable', async ({ page }) => {
	for (const slug of ['silent-auction', 'stepweaver-dev', 'not-a-real-slug']) {
		const response = await page.goto(`/work/${slug}`);
		expect(response?.status()).toBe(404);
		await expect(page.getByText('This page is not available.')).toBeVisible();
		await expect(page.getByText('Silent Auction')).toHaveCount(0);
		await expect(page.getByRole('heading', { name: 'stepweaver.dev' })).toHaveCount(0);
	}
});
