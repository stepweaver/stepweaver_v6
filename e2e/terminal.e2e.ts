import { expect, test, type Locator } from '@playwright/test';

function renderedText(locator: Locator) {
	return locator.evaluate((el) => (el as HTMLElement).innerText);
}

test('help, resume, history, and clear run in the console', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/terminal');

	const input = page.getByRole('textbox', { name: 'Command' });
	const transcript = page.getByRole('log', { name: 'Terminal transcript' });
	await expect(page.locator('.circuit-canvas')).toHaveCount(1);
	await expect(page.locator('.lambda-canvas')).toHaveCount(1);
	await expect(page.locator('.site-footer')).toHaveCount(0);
	await expect(page.locator('.sidebar')).toBeVisible();
	await expect(page.locator('.sidebar')).toContainText('View experience');
	await expect(page.locator('.sidebar')).toContainText('Show commands');
	await expect(page.locator('.sidebar')).toContainText('Clear screen');
	await expect(page.locator('.sidebar')).not.toContainText('codex');
	await expect(page.locator('.mobile-guide')).toBeHidden();

	const product = await renderedText(page.locator('.product-name'));
	expect(product).toContain('λ');
	expect(product).not.toContain('Λ');

	await expect(input).toHaveAttribute('data-ready', 'true');
	await input.fill('help');
	await input.press('Enter');
	await expect(transcript).toContainText('help: Show commands');
	await expect(transcript).toContainText('resume: View experience');
	await expect(transcript).toContainText('clear: Clear screen');
	await expect(transcript).not.toContainText('codex');
	await expect(transcript).not.toContainText('weather');
	await expect(transcript).not.toContainText('blackjack');
	await expect(transcript).not.toContainText('zork');
	await expect(transcript).not.toContainText('chat');

	await input.fill('codex');
	await input.press('Enter');
	await expect(transcript).toContainText('Command not found: codex');
	await expect(transcript).toContainText("Type 'help' for available commands.");

	await input.fill('resume');
	await input.press('Enter');
	await expect(transcript).toContainText('Stephen Weaver');
	await expect(transcript).toContainText(
		'Business Systems Developer & Systems Integration Consultant'
	);
	await expect(transcript).toContainText('University of Notre Dame');
	await expect(transcript).toContainText('Grand Valley State University');
	await expect(page.getByRole('link', { name: /weaver_resume\.pdf/ })).toHaveAttribute(
		'href',
		'/weaver_resume.pdf'
	);

	await input.fill('unsent');
	await page.locator('.site-logo').focus();
	await page.keyboard.press('ArrowUp');
	await expect(input).toHaveValue('unsent');
	await expect(input).not.toBeFocused();

	await input.focus();
	await input.press('ArrowUp');
	await expect(input).toHaveValue('resume');
	await input.press('ArrowUp');
	await expect(input).toHaveValue('codex');
	await input.press('ArrowUp');
	await expect(input).toHaveValue('help');
	await input.press('ArrowDown');
	await expect(input).toHaveValue('codex');
	await input.press('ArrowDown');
	await expect(input).toHaveValue('resume');
	await input.press('ArrowDown');
	await expect(input).toHaveValue('unsent');

	await input.press('Tab');
	await expect(input).not.toBeFocused();

	await input.focus();
	await input.fill('clear');
	await input.press('Enter');
	await expect(transcript).not.toContainText('Available commands:');
	await expect(transcript).not.toContainText('University of Notre Dame');
	await expect(transcript).not.toContainText('Command not found:');
	await expect(transcript).toContainText('Type "help" for available commands.');
	await expect(page.getByRole('link', { name: /weaver_resume\.pdf/ })).toHaveCount(0);

	const box = await input.boundingBox();
	expect(box).not.toBeNull();
	expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(901);
	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
	);
	expect(overflow).toBe(true);
});

test('narrow console keeps the command guide and the prompt on screen', async ({ page }) => {
	for (const width of [390, 768]) {
		await page.setViewportSize({ width, height: 700 });
		await page.goto('/terminal');
		await expect(page.locator('.sidebar')).toBeHidden();
		const guide = page.locator('.mobile-guide');
		await expect(guide).toBeVisible();
		await guide.locator('summary').click();
		await expect(guide).toContainText('Show commands');
		await expect(guide).toContainText('View experience');
		await expect(guide).toContainText('Clear screen');
		await expect(guide).not.toContainText('weather');

		const input = page.getByRole('textbox', { name: 'Command' });
		await expect(input).toBeVisible();
		const box = await input.boundingBox();
		expect(box).not.toBeNull();
		expect(box?.y ?? -1).toBeGreaterThanOrEqual(0);
		expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(701);
		const overflow = await page.evaluate(
			() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
		);
		expect(overflow).toBe(true);
	}
});

test('visible lambda glyphs stay lowercase where labels are uppercased', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/');

	const eyebrow = page.locator('.hero-copy .eyebrow').first();
	expect(await eyebrow.evaluate((el) => getComputedStyle(el).textTransform)).toBe('uppercase');
	const glyph = eyebrow.locator('.lambda-glyph');
	expect(await glyph.evaluate((el) => getComputedStyle(el).textTransform)).toBe('none');
	const eyebrowText = await renderedText(eyebrow);
	expect(eyebrowText.startsWith('λ')).toBe(true);
	expect(eyebrowText).toContain('STEPWEAVER');
	expect(eyebrowText).not.toContain('Λ');

	const logo = await renderedText(page.locator('.site-logo'));
	expect(logo).toContain('λ');
	expect(logo).not.toContain('Λ');
	const footer = await renderedText(page.locator('.site-footer-mark'));
	expect(footer).toContain('λ');
	expect(footer).not.toContain('Λ');

	await page.goto('/resume');
	const kicker = await renderedText(page.locator('.kicker'));
	expect(kicker).toContain('λ');
	expect(kicker).not.toContain('Λ');
	const org = await renderedText(page.locator('.role-org').first());
	expect(org).toBe('λstepweaver');

	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	const mark = page.locator('.scheme-mark');
	await expect(mark).toBeVisible();
	expect(await renderedText(mark)).toBe('λ');
	expect(await mark.evaluate((el) => getComputedStyle(el).textTransform)).toBe('none');
});

test('the signature background stays mounted when opening the terminal', async ({ page }) => {
	await page.goto('/');
	const circuit = page.locator('.circuit-canvas');
	await expect(circuit).toHaveAttribute('data-board-generation', /^[1-9]\d*$/);
	await circuit.evaluate((el) => {
		el.dataset.mounted = 'once';
	});
	await page.getByRole('link', { name: /open the terminal/i }).click();
	await expect(page).toHaveURL('/terminal');
	await expect(circuit).toHaveCount(1);
	await expect(circuit).toHaveAttribute('data-mounted', 'once');
	await expect(page.locator('.lambda-canvas')).toHaveCount(1);
	await expect(page.getByRole('textbox', { name: 'Command' })).toBeVisible();
});
