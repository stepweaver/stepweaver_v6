import { expect, test } from '@playwright/test';

test('home states the consulting identity and hides the project catalog', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Business Systems Developer');
	await expect(page.getByRole('heading', { level: 1 })).toContainText(
		'Systems Integration Consultant'
	);
	await expect(page.getByText('no posts are shown')).toBeVisible();
	await expect(page.locator('body')).not.toContainText('Silent Auction');
});
