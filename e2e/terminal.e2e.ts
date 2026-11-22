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
	await expect(page.locator('.sidebar')).toContainText('Browse published writing');
	await expect(page.locator('.sidebar')).toContainText('Roll dice');
	await expect(page.locator('.sidebar')).not.toContainText('weather');
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
	await expect(transcript).toContainText('cd <place>: Open a listed page');
	await expect(transcript).toContainText('codex: Browse published writing');
	await expect(transcript).toContainText('roll <notation>: Roll dice');
	await expect(transcript).not.toContainText('weather');
	await expect(transcript).not.toContainText('blackjack');
	await expect(transcript).not.toContainText('zork');
	await expect(transcript).not.toContainText('chat');

	await input.fill('nope');
	await input.press('Enter');
	await expect(transcript).toContainText('Command not found: nope');
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
	await expect(input).toHaveValue('nope');
	await input.press('ArrowUp');
	await expect(input).toHaveValue('help');
	await input.press('ArrowDown');
	await expect(input).toHaveValue('nope');
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

test('cd, codex, and roll keep the transcript usable', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/terminal');
	const input = page.getByRole('textbox', { name: 'Command' });
	const transcript = page.getByRole('log', { name: 'Terminal transcript' });
	await expect(input).toHaveAttribute('data-ready', 'true');
	const screen = page.locator('.console-screen');

	await input.fill('cd');
	await input.press('Enter');
	await expect(transcript).toContainText('/writing');
	await expect(transcript).toContainText('/dice-roller');
	await expect(transcript).not.toContainText('field-journal');

	await input.fill('cd nope');
	await input.press('Enter');
	await expect(transcript).toContainText('Unknown destination: nope');
	await expect(page).toHaveURL('/terminal');

	await input.fill('roll 2d6foo');
	await input.press('Enter');
	await expect(transcript).toContainText('not dice notation');

	await input.fill('roll 1d6');
	await input.press('Enter');
	await expect(transcript).toContainText('Rolling 1d6:');
	await expect(transcript).toContainText('die 1:');
	await expect(transcript).toContainText('Total:');

	await input.fill('resume');
	await input.press('Enter');
	await expect(transcript).toContainText('University of Notre Dame');
	await expect
		.poll(() =>
			screen.evaluate(
				(element) => element.scrollHeight > element.clientHeight + 20 && element.scrollTop > 20
			)
		)
		.toBe(true);
	await input.fill('roll advantage');
	await screen.evaluate((element) => {
		element.scrollTop = 0;
	});
	await input.dispatchEvent('keydown', { key: 'Enter' });
	await expect(transcript).toContainText('Advantage (2d20 keep high)');
	await expect.poll(() => screen.evaluate((element) => element.scrollTop)).toBeLessThan(5);

	await input.fill('codex');
	await input.press('Enter');
	await expect(transcript).toContainText('published post');
	await input.fill('ls');
	await input.press('Enter');
	await expect(transcript).toContainText('Workflow handoffs');
	await expect(transcript).not.toContainText('Unpublished operations note');
	await input.fill('grep systems');
	await input.press('Enter');
	await expect(page.getByRole('link', { name: /Workflow handoffs/ })).toHaveAttribute(
		'href',
		'/writing/workflow-handoffs'
	);
	await input.fill('exit');
	await input.press('Enter');
	await expect(transcript).toContainText('Left codex mode.');

	await input.fill('still drafting');
	await input.press('ArrowUp');
	await expect(input).toHaveValue('exit');
	await input.press('ArrowDown');
	await expect(input).toHaveValue('still drafting');

	await page.setViewportSize({ width: 390, height: 700 });
	await expect(input).toHaveValue('still drafting');
	await input.scrollIntoViewIfNeeded();
	const box = await input.boundingBox();
	expect(box).not.toBeNull();
	expect(box?.y ?? -1).toBeGreaterThanOrEqual(0);
	expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(701);
});
