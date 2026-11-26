import { expect, test } from '@playwright/test';

test('weather, contact, and lambda leave the terminal usable', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/terminal');
	const input = page.getByRole('textbox', { name: 'Command' });
	const transcript = page.getByRole('log', { name: 'Terminal transcript' });
	await expect(input).toHaveAttribute('data-ready', 'true');

	async function command(line: string) {
		await input.fill(line);
		await input.press('Enter');
	}

	async function expectLatest(text: string) {
		await expect
			.poll(async () => {
				const body = await transcript.innerText();
				const marker = 'user@stepweaver.dev:~$';
				const at = body.lastIndexOf(marker);
				return at === -1 ? body : body.slice(at);
			})
			.toContain(text);
	}

	await command('weather unconfigured');
	await expectLatest('Weather is not configured.');

	await command('help');
	await expectLatest('Available commands:');

	await command('weather South Bend --forecast');
	await expectLatest('Multiple locations:');
	await expectLatest('1. South Bend, Indiana, US');
	await expectLatest('5. South Bend, Texas, US');

	await command('help');
	await expectLatest('Choose 1-5, or type cancel.');

	await command('1');
	await expectLatest('Weather: South Bend, Indiana, US');
	await expectLatest('42°F');
	await expectLatest('Forecast, city local time:');

	await command('help');
	await expectLatest('Available commands:');

	await command('weather South Bend');
	await expectLatest('Type a number (1-5) or cancel.');

	await command('cancel');
	await expectLatest('Selection cancelled.');

	await command('help');
	await expectLatest('Available commands:');

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
		const chat = page.getByRole('region', { name: 'λlambda chat' });
		await expect(page.getByRole('button', { name: 'Minimize chat' })).toBeVisible();
		await chat.getByRole('button', { name: 'Minimize', exact: true }).click();
		const openChatAgain = page.getByRole('button', { name: 'Open chat' });
		await expect(openChatAgain).toBeVisible();
		await openChatAgain.click();
		await expect(page.getByRole('textbox', { name: 'Message' })).toBeVisible();
		await expect(page.getByRole('log', { name: 'Chat' })).toContainText(
			'Business Systems Developer'
		);
	}
});
