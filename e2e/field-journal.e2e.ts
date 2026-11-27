import { expect, test, type Page } from '@playwright/test';

async function meta(page: Page, selector: string): Promise<string> {
	const value = await page.locator(selector).first().getAttribute('content');
	return value ?? '';
}

async function interactive(page: Page) {
	await expect(page.locator('[data-ready="true"]')).toHaveCount(1);
}

test('renders the public mileage record and its chart', async ({ page }) => {
	await page.goto('/field-journal');
	await expect(page.getByRole('heading', { level: 1, name: 'The Long Walk' })).toBeVisible();
	await expect(page.locator('.total-value')).toHaveText('16');
	await expect(page.getByText('miles recorded')).toBeVisible();
	await expect(page.getByText('4 miles')).toBeVisible();
	await expect(page.getByText('12.5 miles')).toBeVisible();
	await expect(page.getByText('9 miles to 25.')).toBeVisible();
	await expect(page.getByRole('table').getByText('November 2026')).toBeVisible();
	await expect(page.getByRole('table').getByText('16')).toBeVisible();

	await interactive(page);
	await page.getByRole('button', { name: 'Weekly' }).click();
	await expect(page.getByRole('button', { name: 'Weekly' })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	const table = page.getByRole('table');
	await expect(table.getByText('Nov 23 – Nov 29')).toBeVisible();
	await expect(table.getByText('12.5')).toBeVisible();
	await expect(table.getByText('Nov 2 – Nov 8')).toBeVisible();
	await expect(table.getByText('3.5')).toBeVisible();
	await expect(table.getByText('No record').first()).toBeVisible();
	await expect(table).toContainText('not counted as zero');
	await expect(page.getByText('Weight change')).toBeVisible();
	await expect(page.getByText('4.8 lb lost')).toBeVisible();
	await expect(page.getByText('Since first published weigh-in.')).toBeVisible();
	await expect(page.getByText('210', { exact: true })).toHaveCount(0);
	await expect(page.getByText('208', { exact: true })).toHaveCount(0);
	await expect(page.getByText('205.2')).toHaveCount(0);
	await expect(page.getByText('Private Note')).toHaveCount(0);
	await expect(page.getByText('DPS')).toHaveCount(0);
	await expect(page.getByText('Hydration')).toHaveCount(0);
	await expect(page.getByText('carrier route')).toHaveCount(0);
});

test('stays readable on a phone', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/field-journal');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	await expect(page.getByText('miles recorded')).toBeVisible();
	await expect(page.locator('.total-value')).toHaveText('16');
	await expect(page.getByText('12.5 miles')).toBeVisible();
	const weightCaption = page.getByText('Since first published weigh-in.');
	await expect(weightCaption).toBeVisible();
	await expect(page.getByText('4.8 lb lost')).toBeVisible();
	const captionBox = await weightCaption.boundingBox();
	expect(captionBox).not.toBeNull();
	if (captionBox) {
		expect(captionBox.x).toBeGreaterThanOrEqual(0);
		expect(captionBox.x + captionBox.width).toBeLessThanOrEqual(391);
	}
	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
	);
	expect(overflow).toBe(true);
	await interactive(page);
	await page.getByRole('button', { name: 'Weekly' }).click();
	await expect(page.getByRole('table').getByText('Nov 23 – Nov 29')).toBeVisible();
	const stillFits = await page.evaluate(
		() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
	);
	expect(stillFits).toBe(true);
});

test('opens from the writing archive and links back to the tag', async ({ page }) => {
	await page.goto('/writing');
	await expect(page.getByText('12.5')).toHaveCount(0);
	await expect(page.getByText('miles recorded')).toHaveCount(0);
	await page.getByRole('link', { name: 'Field Journal', exact: true }).click();
	await expect(page).toHaveURL('/field-journal');
	await page.getByRole('link', { name: 'Notes tagged Field Journal' }).click();
	await expect(page).toHaveURL(/\/writing\?tag=Field(?:\+|%20)Journal/);
	await expect(page.getByText('No published notes use that tag.')).toBeVisible();
});

test('publishes field journal metadata and keeps mileage off other routes', async ({
	page,
	request
}) => {
	await page.goto('/field-journal');
	await expect(page).toHaveTitle('Field Journal — The Long Walk | λstepweaver');
	expect(await meta(page, 'meta[name="description"]')).toContain('miles walked');
	await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
		'href',
		'https://www.stepweaver.dev/field-journal'
	);
	expect(await meta(page, 'meta[property="og:title"]')).toBe(
		'Field Journal — The Long Walk | λstepweaver'
	);
	expect(await meta(page, 'meta[property="og:image"]')).toContain('/images/lambda-share.jpg');
	expect(await meta(page, 'meta[name="twitter:card"]')).toBe('summary_large_image');
	expect(await meta(page, 'meta[name="twitter:image"]')).toContain('lambda-share.jpg');
	await expect(page.locator('meta[name="robots"]')).toHaveCount(0);

	const sitemap = await request.get('/sitemap.xml');
	const body = await sitemap.text();
	expect(body).toContain('/field-journal');
	expect(body).not.toContain('/field-journal/log');
	expect(body).not.toContain('/carrier-journal');

	await page.goto('/');
	await expect(page.getByText('The Long Walk')).toHaveCount(0);
	await expect(page.getByText('miles recorded')).toHaveCount(0);
	await page.goto('/about');
	await expect(page.getByText('12.5 miles')).toHaveCount(0);
});

test('retired journal paths fold back to the public page', async ({ request }) => {
	for (const path of [
		'/carrier-journal',
		'/carrier-journal/log',
		'/field-journal/log',
		'/field-journal/lab',
		'/field-journal/footwear/old-pair'
	]) {
		const response = await request.get(path, { maxRedirects: 0 });
		expect(response.status()).toBe(301);
		expect(response.headers().location ?? '').toMatch(/\/field-journal$/);
	}
});
