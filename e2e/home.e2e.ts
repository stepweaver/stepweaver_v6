import { expect, test } from '@playwright/test';

test('mobile home leads with the offer and keeps one header row', async ({ page }) => {
	for (const width of [390, 464, 768]) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto('/');

		const headline = await page.getByRole('heading', { level: 1 }).boundingBox();
		const cta = await page
			.getByRole('link', { name: "Let's talk about your system" })
			.first()
			.boundingBox();
		const card = await page.getByRole('region', { name: 'Operator profile' }).boundingBox();
		const header = await page.locator('.site-header-inner').boundingBox();

		expect(headline?.y).toBeLessThan(card?.y ?? 0);
		expect(cta?.y).toBeLessThan(card?.y ?? 0);
		expect(header?.height ?? 999).toBeLessThan(72);
		await expect(page.locator('.theme-header').getByLabel('Appearance')).toBeHidden();

		const overflow = await page.evaluate(
			() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
		);
		expect(overflow).toBe(true);
		await expect(page.getByRole('button', { name: 'Open command palette' })).toBeVisible();
		const trigger = await page.getByRole('button', { name: 'Open command palette' }).boundingBox();
		const separated =
			!trigger ||
			!card ||
			trigger.x + trigger.width <= card.x ||
			card.x + card.width <= trigger.x ||
			trigger.y + trigger.height <= card.y ||
			card.y + card.height <= trigger.y;
		expect(separated).toBe(true);

		if (width < 640) {
			const role = await page.locator('.role').boundingBox();
			const portrait = await page.locator('.portrait-bay').boundingBox();
			expect(role && card ? role.width : 0).toBeGreaterThan((card?.width ?? 0) * 0.7);
			expect(portrait?.width ?? 0).toBeGreaterThan(120);
		}
	}

	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	const toggle = page.getByRole('button', { name: 'Switch to light theme' });
	await expect(toggle).toBeEnabled();
	await toggle.focus();
	await page.keyboard.press('Enter');
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

	await page.getByRole('button', { name: 'Open navigation menu' }).click();
	const appearance = page.getByRole('navigation', { name: 'Mobile' }).getByLabel('Appearance');
	await expect(appearance).toBeEnabled();
	await appearance.focus();
	await expect(appearance).toBeFocused();
	await appearance.selectOption('skynet');
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'skynet');
	await page.reload();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'skynet');
	await expect(page.locator('.portrait-bay img').nth(1)).toHaveCSS('opacity', '1');

	await page.getByRole('button', { name: 'Open command palette' }).click();
	await expect(page.getByRole('dialog', { name: 'Navigation' })).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(page.getByRole('dialog', { name: 'Navigation' })).toBeHidden();
	await page.keyboard.press('Control+k');
	await expect(page.getByRole('dialog', { name: 'Navigation' })).toBeVisible();
});

test('desktop home keeps the operator card on the left', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/');

	const card = await page.getByRole('region', { name: 'Operator profile' }).boundingBox();
	const headline = await page.getByRole('heading', { level: 1 }).boundingBox();
	expect(card?.x ?? 0).toBeLessThan(headline?.x ?? 0);
	await expect(page.locator('.theme-header').getByLabel('Appearance')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeHidden();
	await expect(page.getByRole('button', { name: 'Ctrl+K' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Open command palette' })).toBeHidden();

	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
	);
	expect(overflow).toBe(true);
});

test('home states the consulting identity and hides the project catalog', async ({ page }) => {
	await page.goto('/');

	await expect(page.getByRole('heading', { level: 1 })).toContainText('Business Systems Developer');
	await expect(page.getByRole('heading', { level: 1 })).toContainText(
		'Systems Integration Consultant'
	);
	await expect(page.getByRole('link', { name: 'Workflow handoffs' })).toBeVisible();
	await expect(page.getByText('Unpublished operations note')).toHaveCount(0);
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

test('contact rejects invalid and spam submissions and reports delivery honestly', async ({
	page
}) => {
	async function prepare(message: string, email = 'ada@example.com') {
		await page.getByLabel('Name').fill('Ada Lovelace');
		await page.getByLabel('Email').fill(email);
		await page.getByLabel('Message').fill(message);
		await page.locator('form').evaluate((form) => {
			const token = form.querySelector('input[name="cf_turnstile_response"]');
			const opened = form.querySelector('input[name="opened_at"]');
			if (token instanceof HTMLInputElement) token.value = 'XXXX.DUMMY.TOKEN.XXXX';
			if (opened instanceof HTMLInputElement) opened.value = String(Date.now() - 2000);
			if (form instanceof HTMLFormElement) form.requestSubmit();
		});
	}

	await page.goto('/contact');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Consulting inquiry');
	await expect(page.getByRole('link', { name: 'stephen@stepweaver.dev' }).first()).toHaveAttribute(
		'href',
		'mailto:stephen@stepweaver.dev'
	);
	for (const width of [390, 464, 768, 1440]) {
		await page.setViewportSize({ width, height: 900 });
		const overflow = await page.evaluate(
			() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
		);
		expect(overflow).toBe(true);
		await expect(page.getByRole('button', { name: 'Send message' })).toBeVisible();
	}
	await page.setViewportSize({ width: 1280, height: 900 });

	await prepare('A workflow question.', 'not-an-email');
	await expect(page.getByRole('alert')).toContainText('Check the highlighted fields.');
	await expect(page.getByText('Your message was sent')).toHaveCount(0);

	await page.goto('/contact?intent=hire');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hiring conversation');
	await page.locator('#company_website').fill('https://spam.example', { force: true });
	await prepare('A role to discuss.');
	await expect(page.getByRole('alert')).toHaveText('The message was not sent.');
	await expect(page.getByText('Your message was sent')).toHaveCount(0);

	await page.goto('/contact?intent=general');
	await prepare('A short general note.');
	await expect(page.getByRole('status')).toHaveText(
		'Your message was sent. I will read it and reply.'
	);

	await page.goto('/contact');
	await prepare('Please fail [[force-fail]]');
	await expect(page.getByRole('alert')).toContainText('Nothing was delivered');
	await expect(page.getByText('Your message was sent')).toHaveCount(0);
});

test('work explains that no case studies are public', async ({ page }) => {
	await page.goto('/work');

	await expect(page.getByRole('heading', { level: 1 })).toHaveText('No case studies are public.');
	await expect(page.getByText('every one of them is unpublished')).toBeVisible();
	await expect(page.locator('a[href^="/work/"]')).toHaveCount(0);
});
