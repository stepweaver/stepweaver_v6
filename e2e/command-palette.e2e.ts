import { expect, test, type Page } from '@playwright/test';

async function hydrated(page: Page) {
	await expect(page.locator('[data-ready="true"]')).toHaveCount(1);
}

test('keyboard search stays local, restores focus, and skips unpublished routes', async ({
	page
}) => {
	const chat: string[] = [];
	page.on('request', (request) => {
		if (request.url().includes('/api/chat')) chat.push(request.url());
	});

	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	await hydrated(page);
	const search = page.getByRole('button', { name: 'Search' });
	await search.click();
	const dialog = page.getByRole('dialog', { name: 'Command palette' });
	await expect(dialog).toBeVisible();
	const input = page.getByRole('combobox', { name: 'Search' });
	await expect(input).toBeFocused();

	await input.fill('codex');
	await expect(page.getByRole('option', { name: 'Writing' })).toBeVisible();
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/\/writing$/);
	await expect(dialog).toBeHidden();
	expect(chat).toEqual([]);

	await search.click();
	await input.fill('dice');
	await expect(page.getByRole('option', { name: /^Dice Roller/ })).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(dialog).toBeHidden();
	await expect(search).toBeFocused();

	await search.click();
	await input.fill('silent auction');
	await expect(dialog).not.toContainText('Silent Auction');
	await expect(dialog).not.toContainText('Unpublished operations note');
	await expect(page.getByRole('option', { name: /Silent Auction|Field Journal/ })).toHaveCount(0);
	await input.fill('field-journal');
	await expect(dialog.locator('[href="/field-journal"]')).toHaveCount(0);
	await input.fill('meshtastic');
	await expect(dialog.locator('[href="/meshtastic"]')).toHaveCount(0);
	const dialogText = await dialog.innerText();
	expect(dialogText).not.toContain('Λ');
	const ask = page.getByRole('option', { name: /Ask/ });
	await expect(ask).toBeVisible();
	await ask.click();
	const message = page.getByRole('textbox', { name: 'Message' });
	await expect(message).toBeFocused();
	await expect(message).toHaveValue('meshtastic');
	await message.fill('meshtastic draft');
	await expect(message).toHaveValue('meshtastic draft');
	expect(chat).toEqual([]);

	await search.click();
	await expect(dialog).toBeVisible();
	await input.fill('');
	const first = await page.locator('[aria-selected="true"]').innerText();
	await page.keyboard.press('ArrowDown');
	const second = await page.locator('[aria-selected="true"]').innerText();
	expect(second).not.toBe(first);
	await page.keyboard.press('ArrowUp');
	expect(await page.locator('[aria-selected="true"]').innerText()).toBe(first);
	await page.keyboard.press('Escape');
});

test.describe('touch palette', () => {
	test.use({ hasTouch: true, viewport: { width: 390, height: 420 } });

	test('a short screen keeps the tapped result in view', async ({ page }) => {
		await page.goto('/');
		await hydrated(page);
		await page.getByRole('button', { name: 'Search' }).tap();
		const input = page.getByRole('combobox', { name: 'Search' });
		await input.fill('about');
		const option = page.getByRole('option', { name: 'About' });
		const box = await option.boundingBox();
		expect(box).not.toBeNull();
		expect(box!.y).toBeGreaterThanOrEqual(0);
		expect(box!.y + box!.height).toBeLessThanOrEqual(420);
		await option.tap();
		await expect(page).toHaveURL(/\/about$/);
	});
});

test('desktop palette opens with the keyboard and applies a theme locally', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/');
	await hydrated(page);
	await page.keyboard.press('Control+k');
	const dialog = page.getByRole('dialog', { name: 'Command palette' });
	await expect(dialog).toBeVisible();
	await page.getByRole('combobox', { name: 'Search' }).fill('skynet');
	await page.keyboard.press('Enter');
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'skynet');
	await expect(dialog).toBeHidden();
	await expect(page).toHaveURL(/\/$/);
});
