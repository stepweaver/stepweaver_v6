import { expect, test, type Page } from '@playwright/test';

async function meta(page: Page, selector: string): Promise<string> {
	const value = await page.locator(selector).first().getAttribute('content');
	return value ?? '';
}

test.describe('server-rendered metadata', () => {
	test.use({ javaScriptEnabled: false });

	test('homepage card is complete and not duplicated', async ({ page }) => {
		const response = await page.goto('/');
		expect(response?.status()).toBe(200);
		await expect(page).toHaveTitle(
			'Stephen Weaver | Business Systems Developer & Systems Integration Consultant'
		);
		await expect(page.locator('title')).toHaveCount(1);
		await expect(page.locator('meta[name="description"]')).toHaveCount(1);
		await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
		expect(await meta(page, 'meta[property="og:site_name"]')).toBe('λstepweaver');
		expect(await meta(page, 'meta[property="og:locale"]')).toBe('en_US');
		expect(await meta(page, 'meta[property="og:type"]')).toBe('website');
		expect(await meta(page, 'meta[property="og:url"]')).toBe('https://www.stepweaver.dev/');
		await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
			'href',
			'https://www.stepweaver.dev/'
		);
		expect(await meta(page, 'meta[name="twitter:card"]')).toBe('summary_large_image');
		expect(await meta(page, 'meta[property="og:image"]')).toBe(
			'https://www.stepweaver.dev/images/lambda-share.jpg'
		);
		expect(await meta(page, 'meta[property="og:image:width"]')).toBe('1200');
		expect(await meta(page, 'meta[property="og:image:height"]')).toBe('630');
		expect(await meta(page, 'meta[property="og:image:type"]')).toBe('image/jpeg');
		expect(await meta(page, 'meta[name="twitter:image"]')).toContain('lambda-share.jpg');
		expect((await meta(page, 'meta[property="og:image:alt"]')).length).toBeGreaterThan(0);
		await expect(page.locator('meta[property="article:published_time"]')).toHaveCount(0);
		await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
	});

	test('a published article uses its own title, excerpt, dates, and tags', async ({
		page,
		request
	}) => {
		const raw = await request.get('/writing/workflow-handoffs');
		expect(raw.status()).toBe(200);
		const html = await raw.text();
		expect(html.match(/<title>/g)?.length).toBe(1);
		expect(html.match(/property="og:title"/g)?.length).toBe(1);
		expect(html).toContain('Where a handoff drops the work');
		expect(html).not.toContain('This draft must not appear');

		await page.goto('/writing/workflow-handoffs');
		await expect(page).toHaveTitle('Workflow handoffs | λstepweaver');
		expect(await meta(page, 'meta[property="og:title"]')).toBe('Workflow handoffs');
		expect(await meta(page, 'meta[name="description"]')).toBe(
			'Where a handoff drops the work, and what the system has to remember.'
		);
		await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
			'href',
			'https://www.stepweaver.dev/writing/workflow-handoffs'
		);
		expect(await meta(page, 'meta[property="og:type"]')).toBe('article');
		expect(await meta(page, 'meta[property="article:published_time"]')).toBe('2026-09-01');
		expect(await meta(page, 'meta[property="article:modified_time"]')).toBe('2026-09-02');
		const tags = await page
			.locator('meta[property="article:tag"]')
			.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('content')));
		expect(tags).toEqual(['systems', 'operations']);
		expect(html).toContain('"@type":"BlogPosting"');
	});

	test('portrait and remote covers fall back to the branded card', async ({ page }) => {
		await page.goto('/writing/integration-boundaries');
		expect(await meta(page, 'meta[property="og:image"]')).toBe(
			'https://www.stepweaver.dev/images/lambda-share.jpg'
		);
		expect(await meta(page, 'meta[property="og:image:width"]')).toBe('1200');
		expect(await meta(page, 'meta[name="description"]')).toBe(
			'The line between the tools a team already has and the software that joins them.'
		);
	});

	test('quotes, ampersands, and lambda survive in the initial HTML', async ({ page, request }) => {
		const raw = await request.get('/writing/quotes');
		expect(raw.status()).toBe(200);
		const html = await raw.text();
		const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
		expect(title).toContain('λ');
		expect(title).toContain('&amp;');
		expect(title.includes('"quotes"') || title.includes('&quot;') || title.includes('&#34;')).toBe(
			true
		);
		expect(html).toContain('Systems &amp; &lt;handoffs>');
		expect(html).not.toContain('Systems & <handoffs>');
		expect(html).toContain('\\u003chandoffs');

		await page.goto('/writing/quotes');
		await expect(page).toHaveTitle('λ & "quotes" | λstepweaver');
		expect(await meta(page, 'meta[property="og:title"]')).toBe('λ & "quotes"');
		expect(await meta(page, 'meta[name="description"]')).toBe('Systems & <handoffs> — "notes".');
		expect(await meta(page, 'meta[property="article:published_time"]')).toBe('2024-06-01');
		expect(await meta(page, 'meta[property="article:modified_time"]')).toBe('2024-06-04');
	});

	test('drafts, unpublished projects, and unknown routes stay generic', async ({
		page,
		request
	}) => {
		const draft = await request.get('/writing/unpublished-operations-note');
		expect(draft.status()).toBe(404);
		const draftHtml = await draft.text();
		expect(draftHtml).not.toContain('This draft must not appear');
		expect(draftHtml).not.toContain('Unpublished operations note');
		await page.goto('/writing/unpublished-operations-note');
		expect(await meta(page, 'meta[name="robots"]')).toBe('noindex');
		expect(await meta(page, 'meta[property="og:type"]')).toBe('website');
		await expect(page.locator('meta[property="article:published_time"]')).toHaveCount(0);

		const project = await request.get('/work/silent-auction');
		expect(project.status()).toBe(404);
		const projectHtml = await project.text();
		expect(projectHtml).not.toContain('Silent Auction Platform');
		expect(projectHtml).not.toContain('bidder onboarding');
		await page.goto('/work/silent-auction');
		expect(await meta(page, 'meta[name="robots"]')).toBe('noindex');

		const missing = await request.get('/this-route-is-not-real');
		expect(missing.status()).toBe(404);
		const missingHtml = await missing.text();
		expect(missingHtml).toContain('noindex');
		expect(missingHtml).not.toContain('Silent Auction Platform');
	});

	test('other public pages name themselves and keep the work index out of the index', async ({
		page
	}) => {
		await page.goto('/about');
		await expect(page).toHaveTitle('About | λstepweaver');
		expect(await meta(page, 'meta[property="og:url"]')).toBe('https://www.stepweaver.dev/about');
		await page.goto('/resume');
		await expect(page).toHaveTitle('Resume | λstepweaver');
		await page.goto('/services');
		expect(await meta(page, 'meta[name="description"]')).toContain('systems integration');
		await page.goto('/contact');
		await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
			'href',
			'https://www.stepweaver.dev/contact'
		);
		await page.goto('/terminal');
		await expect(page).toHaveTitle('Terminal | λstepweaver');
		await page.goto('/dice-roller');
		await expect(page).toHaveTitle('Dice roller | λstepweaver');
		await page.goto('/writing');
		expect(await meta(page, 'meta[property="og:url"]')).toBe('https://www.stepweaver.dev/writing');
		await page.goto('/work');
		expect(await meta(page, 'meta[name="robots"]')).toBe('noindex');
		expect(await meta(page, 'meta[name="description"]')).toContain('unpublished');
	});
});

test('share image is public without a session', async ({ request }) => {
	const image = await request.get('/images/lambda-share.jpg');
	expect(image.status()).toBe(200);
	expect(image.headers()['content-type'] ?? '').toContain('image/jpeg');
	const bytes = await image.body();
	expect(bytes[0]).toBe(0xff);
	expect(bytes[1]).toBe(0xd8);
	expect(bytes.byteLength).toBeGreaterThan(10_000);
});

test('client navigation replaces metadata instead of stacking it', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto('/');
	const nav = page.getByRole('navigation', { name: 'Primary' });
	await nav.getByRole('link', { name: 'About' }).click();
	await expect(page).toHaveURL(/\/about$/);
	await expect(page).toHaveTitle('About | λstepweaver');
	await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
	expect(await meta(page, 'meta[property="og:url"]')).toBe('https://www.stepweaver.dev/about');

	await nav.getByRole('link', { name: 'Writing' }).click();
	await page.getByRole('link', { name: 'Workflow handoffs' }).click();
	await expect(page).toHaveURL(/\/writing\/workflow-handoffs$/);
	await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
	await expect(page.locator('meta[property="article:published_time"]')).toHaveCount(1);
	expect(await meta(page, 'meta[property="og:title"]')).toBe('Workflow handoffs');

	await page.locator('a.site-logo').click();
	await expect(page).toHaveURL(/\/$/);
	await expect(page).toHaveTitle(
		'Stephen Weaver | Business Systems Developer & Systems Integration Consultant'
	);
	await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
	await expect(page.locator('meta[property="article:published_time"]')).toHaveCount(0);
	await expect(page.locator('meta[property="article:tag"]')).toHaveCount(0);
});
