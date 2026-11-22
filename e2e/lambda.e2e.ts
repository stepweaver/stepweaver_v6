import { expect, test } from '@playwright/test';

test('weather, contact, and lambda leave the terminal usable', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/terminal');
	const input = page.getByRole('textbox', { name: 'Command' });
	const transcript = page.getByRole('log', { name: 'Terminal transcript' });
	await expect(input).toHaveAttribute('data-ready', 'true');

	await input.fill('weather South Bend --forecast');
	await input.press('Enter');
	await expect(transcript).toContainText(/Weather is not configured|Weather:|Multiple locations/);
	await input.fill('help');
	await input.press('Enter');
	await expect(transcript).toContainText('Available commands:');

	await input.fill('chat what does Stephen do');
	await input.press('Enter');
	await expect(transcript).toContainText('λlambda:');
	await expect(transcript).not.toContainText('λledger');
	await expect(transcript).not.toContainText('Silent Auction');

	await input.fill('contact');
	await input.press('Enter');
	await expect(transcript).toContainText('Step 1/5');
	await input.fill('Ada');
	await input.press('Enter');
	await input.fill('not-an-email');
	await input.press('Enter');
	await expect(transcript).toContainText('Enter a valid email address.');
	await input.fill('cancel');
	await input.press('Enter');
	await expect(transcript).toContainText('Contact form cancelled.');
	await expect(input).toBeVisible();
});

test('site chat answers from the public brief on wide and narrow screens', async ({ page }) => {
	for (const width of [1440, 390]) {
		await page.setViewportSize({ width, height: width === 390 ? 700 : 900 });
		await page.goto('/');
		const openChat = page.getByRole('button', { name: 'Open chat' });
		await expect(openChat).toHaveAttribute('data-ready', 'true');
		await openChat.click();
		await page.getByRole('textbox', { name: 'Message' }).fill('What is the public title?');
		await page.getByRole('button', { name: 'Send' }).click();
		const thread = page.getByRole('log', { name: 'Chat' });
		await expect(thread).toContainText('Business Systems Developer');
		await expect(thread).not.toContainText('λledger');
		await expect(thread).not.toContainText('Silent Auction');
		const box = await page.locator('.chat').boundingBox();
		expect(box).not.toBeNull();
		expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(width + 1);
		await page.getByRole('button', { name: 'Minimize' }).click();
		await expect(page.getByRole('button', { name: 'Open chat' })).toBeVisible();
	}
});
