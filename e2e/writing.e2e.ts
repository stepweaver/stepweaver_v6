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
	await expect(page.getByRole('heading', { name: 'The handoff', level: 2 })).toBeVisible();
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

test('article heading is fluid on a phone and stays 3rem on desktop', async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 800 });
	await page.goto('/writing/workflow-handoffs');
	await page.evaluate(() => document.fonts.ready);
	const narrow = await page.evaluate(() => {
		const heading = document.querySelector('article h1');
		const article = document.querySelector('.article');
		const dek = document.querySelector('.dek');
		return {
			font: heading ? parseFloat(getComputedStyle(heading).fontSize) : 0,
			pad: article ? parseFloat(getComputedStyle(article).paddingTop) : 999,
			body: parseFloat(getComputedStyle(document.body).fontSize),
			dek: dek ? parseFloat(getComputedStyle(dek).fontSize) : 0,
			text: heading?.textContent ?? ''
		};
	});
	expect(narrow.text.trim()).toBe('Workflow handoffs');
	expect(narrow.font).toBeGreaterThan(narrow.body);
	expect(narrow.font).toBeLessThan(30);
	expect(narrow.pad).toBeLessThan(40);
	expect(narrow.dek).toBe(narrow.body);

	for (const width of [390, 464]) {
		await page.setViewportSize({ width, height: 800 });
		const font = await page
			.locator('article h1')
			.evaluate((node) => parseFloat(getComputedStyle(node).fontSize));
		expect(font).toBeGreaterThan(16);
		expect(font).toBeLessThan(48);
	}

	await page.setViewportSize({ width: 1440, height: 900 });
	const desktop = await page
		.locator('article h1')
		.evaluate((node) => parseFloat(getComputedStyle(node).fontSize));
	expect(Math.round(desktop)).toBe(48);
	const body = await page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize));
	expect(Math.round(body)).toBe(16);
});

test('writing layout holds at the review widths', async ({ page }) => {
	for (const width of [320, 390, 464, 768, 1440]) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto('/writing/workflow-handoffs');
		const overflow = await page.evaluate(
			() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
		);
		expect(overflow).toBe(true);
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	}
});

test('article section headings are distinct from body text on phone and desktop', async ({
	page
}) => {
	for (const width of [390, 1440]) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto('/writing/workflow-handoffs');
		const heading = page.getByRole('heading', { level: 2, name: 'The handoff' });
		const styles = await heading.evaluate((element) => {
			const headingStyle = getComputedStyle(element);
			const paragraphStyle = getComputedStyle(element.nextElementSibling!);
			return {
				headingSize: parseFloat(headingStyle.fontSize),
				bodySize: parseFloat(paragraphStyle.fontSize),
				headingWeight: Number(headingStyle.fontWeight),
				bodyWeight: Number(paragraphStyle.fontWeight),
				overflows: document.documentElement.scrollWidth > window.innerWidth
			};
		});
		expect(styles.headingSize).toBeGreaterThan(styles.bodySize);
		expect(styles.headingWeight).toBeGreaterThan(styles.bodyWeight);
		expect(styles.overflows).toBe(false);
	}
});
