import { expect, test } from '@playwright/test';

test('published writing is listed and drafts stay hidden', async ({ page }) => {
	await page.goto('/writing');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Notes from the work.');
	await expect(page.getByRole('link', { name: 'Workflow handoffs' })).toBeVisible();
	await expect(page.getByText('Unpublished operations note')).toHaveCount(0);
	await expect(page.getByText('This draft must not appear')).toHaveCount(0);

	await page
		.getByRole('navigation', { name: 'Tags' })
		.getByRole('link', { name: 'systems' })
		.click();
	await expect(page).toHaveURL(/tag=systems/);
	await expect(page.getByRole('link', { name: 'Workflow handoffs' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Automation and review' })).toHaveCount(0);

	await page.goto('/writing');
	await page.getByRole('link', { name: 'Next' }).click();
	await expect(page).toHaveURL(/page=2/);
	await expect(page.getByRole('link', { name: 'Renamed after publication' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Workflow handoffs' })).toHaveCount(0);
});

test('article links, legacy slugs, and page ids stay valid', async ({ page }) => {
	await page.goto('/writing/workflow-handoffs');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Workflow handoffs');
	await expect(page.getByRole('heading', { name: 'The handoff' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'A public note' })).toHaveAttribute(
		'href',
		'https://stepweaver.dev/writing'
	);
	await expect(page.getByRole('img', { name: 'Diagram of a handoff' })).toBeVisible();

	await page.goto('/writing/renamed-after-publication');
	await expect(page).toHaveURL(/\/writing\/original-stable-slug$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Renamed after publication');

	const missing = await page.goto('/writing/unpublished-operations-note');
	expect(missing?.status()).toBe(404);
	await expect(page.getByText('This note is not published.')).toBeVisible();

	await page.goto('/writing/p/fixture000-0000-4000-8000-000000000010');
	await expect(page).toHaveURL(/\/writing\/workflow-handoffs$/);
});

test('writing feed and sitemap include published notes only', async ({ request }) => {
	const feed = await request.get('/writing/rss.xml');
	expect(feed.status()).toBe(200);
	const xml = await feed.text();
	expect(xml).toContain('/writing/workflow-handoffs');
	expect(xml).not.toContain('Unpublished operations note');

	const sitemap = await request.get('/sitemap.xml');
	const body = await sitemap.text();
	expect(body).toContain('/writing/workflow-handoffs');
	expect(body).not.toContain('/work/silent-auction');
	expect(body).not.toContain('unpublished-operations-note');
});

test('writing layout holds at the review widths', async ({ page }) => {
	for (const width of [390, 464, 768, 1440]) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto('/writing/workflow-handoffs');
		const overflow = await page.evaluate(
			() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
		);
		expect(overflow).toBe(true);
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	}
});
