import { expect, test } from '@playwright/test';

test('says the record is unavailable and does not invent a total', async ({ page }) => {
	await page.goto('/field-journal');
	await expect(page.getByRole('heading', { level: 1, name: 'The Long Walk' })).toBeVisible();
	await expect(page.getByText('temporarily unavailable')).toBeVisible();
	await expect(page.getByText('miles recorded')).toHaveCount(0);
	await expect(page.getByText('12.5')).toHaveCount(0);
	await expect(page.getByText('16', { exact: true })).toHaveCount(0);
	await expect(page.getByText('Weight')).toHaveCount(0);
	await expect(page.getByText('Private Note')).toHaveCount(0);
	await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
});

test('other routes stay up without a journal total', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	await expect(page.getByText('The Long Walk')).toHaveCount(0);
	await expect(page.getByText('temporarily unavailable')).toHaveCount(0);
	await page.goto('/writing');
	await expect(page.getByRole('link', { name: 'Field Journal', exact: true })).toBeVisible();
	await expect(page.getByText('miles recorded')).toHaveCount(0);
});
