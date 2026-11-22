import { expect, test } from '@playwright/test';

test('blackjack and the adventure keep the terminal session', async ({ page }) => {
	for (const width of [1440, 390]) {
		await page.setViewportSize({ width, height: width === 390 ? 700 : 900 });
		await page.goto('/terminal');
		const input = page.getByRole('textbox', { name: 'Command' });
		const transcript = page.getByRole('log', { name: 'Terminal transcript' });
		await expect(input).toHaveAttribute('data-ready', 'true');
		await page.evaluate(() => localStorage.removeItem('stepweaver-adventure-save-v1'));

		await input.fill('bj');
		await input.press('Enter');
		await expect(transcript).toContainText('Blackjack: dealer stands on 17.');
		await expect(page.locator('.prompt-row .prompt')).toHaveText('[blackjack]');
		await input.fill('help');
		await input.press('Enter');
		await expect(transcript).toContainText('hit: draw a card');
		await input.fill('stand');
		await input.press('Enter');
		await expect(transcript).toContainText(/Score: W:\d+ L:\d+ T:\d+/);
		await input.fill('exit');
		await input.press('Enter');
		await expect(transcript).toContainText('Left blackjack.');
		await expect(page.locator('.prompt-row .prompt')).toContainText('user@stepweaver.dev');

		await input.fill('zork');
		await input.press('Enter');
		await expect(transcript).toContainText('Launching terminal adventure.');
		await expect(transcript).toContainText('West of House');
		await expect(page.locator('.prompt-row .prompt')).toHaveText('[adventure]');
		await input.fill('n');
		await input.press('Enter');
		await expect(transcript).toContainText('North of House');
		await input.fill('save');
		await input.press('Enter');
		await expect(transcript).toContainText('Game saved.');
		await input.fill('restart');
		await input.press('Enter');
		await expect(transcript).toContainText('Game restarted.');
		await expect(transcript).toContainText('West of House');
		await input.fill('restore');
		await input.press('Enter');
		await expect(transcript).toContainText('Restored.');
		await expect(transcript).toContainText('North of House');
		await input.fill('cancel');
		await input.press('Enter');
		await expect(transcript).toContainText('Left the adventure.');
		await input.fill('help');
		await input.press('Enter');
		await expect(transcript).toContainText('Available commands:');

		const box = await input.boundingBox();
		expect(box).not.toBeNull();
		expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual((width === 390 ? 700 : 900) + 1);
		const overflow = await page.evaluate(
			() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
		);
		expect(overflow).toBe(true);
	}
});
