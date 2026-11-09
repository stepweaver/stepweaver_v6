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

test('contact offers email and does not present a working send action', async ({ page }) => {
	await page.goto('/contact');

	const mail = page.getByRole('link', { name: 'stephen@stepweaver.dev' }).first();
	await expect(mail).toBeVisible();
	await expect(mail).toHaveAttribute('href', 'mailto:stephen@stepweaver.dev');
	await expect(
		page.getByText('Submission is turned off until mail delivery is connected.')
	).toBeVisible();
	await expect(page.getByRole('button', { name: /send/i })).toHaveCount(0);
	await expect(page.locator('form button')).toHaveCount(0);
	await expect(page.getByLabel('Name')).toBeVisible();
	await expect(page.getByLabel('Email')).toBeVisible();
	await expect(page.getByLabel('Message')).toBeVisible();

	await page.getByLabel('Name').fill('Ada Lovelace');
	await page.getByLabel('Email').fill('ada@example.com');
	await page.getByLabel('Message').fill('A workflow question.');
	await page.locator('form').evaluate((form) => {
		if (form instanceof HTMLFormElement) form.requestSubmit();
	});

	await expect(page.getByRole('status')).toContainText('cannot send a message');
	await expect(page).toHaveURL(/\/contact$/);
	await expect(page.getByText(/message sent|thank you/i)).toHaveCount(0);
});

test('work explains that no case studies are public', async ({ page }) => {
	await page.goto('/work');

	await expect(page.getByRole('heading', { level: 1 })).toHaveText('No case studies are public.');
	await expect(page.getByText('every one of them is unpublished')).toBeVisible();
	await expect(page.locator('a[href^="/work/"]')).toHaveCount(0);
});
