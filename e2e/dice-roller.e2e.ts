import { expect, test } from '@playwright/test';

test('dice roller shares notation, explains bad input, and keeps history', async ({ page }) => {
	for (const width of [1440, 390]) {
		await page.setViewportSize({ width, height: width === 390 ? 700 : 900 });
		await page.goto('/dice-roller');
		await page.evaluate(() => localStorage.removeItem('diceRollerHistory'));
		await page.reload();
		await expect(page.locator('.roller')).toHaveAttribute('data-ready', 'true');

		const add = page.getByRole('button', { name: 'd6', exact: true });
		const box = await add.boundingBox();
		expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
		await add.click();
		await expect(page.locator('#notation-status')).toContainText('Roll will use 1d6');

		await page.getByRole('button', { name: 'Roll', exact: true }).click();
		await expect(page.getByRole('region', { name: 'Roll result' })).toContainText('Total:');
		await expect(page.getByRole('region', { name: 'Roll result' })).toContainText('die 1:');

		await page.getByRole('textbox', { name: 'Notation' }).fill('2d6foo');
		await expect(page.locator('#notation-status')).toContainText('not dice notation');
		await expect(page.getByRole('button', { name: 'Roll', exact: true })).toBeDisabled();

		await page.getByRole('button', { name: 'Advantage', exact: true }).click();
		await expect(page.getByRole('region', { name: 'Roll result' })).toContainText(
			'Advantage (2d20 keep high)'
		);

		await page.reload();
		await expect(page.locator('.history')).toContainText(/advantage/);
		const overflow = await page.evaluate(
			() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
		);
		expect(overflow).toBe(true);
	}
});

test('pool, held dice, saved notes, and terminal roll follow one set of rules', async ({
	page
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/play');
	await expect(page).toHaveURL('/dice-roller');
	await page.evaluate(() => localStorage.removeItem('diceRollerHistory'));
	await page.reload();
	await expect(page.locator('.roller')).toHaveAttribute('data-ready', 'true');

	const touchNames = ['d6', 'Roll', 'Increase modifier', 'Advantage', 'Disadvantage'] as const;
	for (const name of touchNames) {
		const control = page.getByRole('button', { name, exact: true });
		await control.scrollIntoViewIfNeeded();
		const box = await control.boundingBox();
		expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
		expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
	}

	await page.getByRole('button', { name: 'd6', exact: true }).click();
	await page.getByRole('button', { name: 'More d6' }).click();
	await page.getByRole('button', { name: 'Increase modifier' }).click();
	await expect(page.locator('#notation-status')).toContainText('Roll will use 2d6+1');
	await page.getByRole('textbox', { name: 'Note' }).fill('door check');
	await page.getByRole('button', { name: 'Roll', exact: true }).click();

	const result = page.getByRole('region', { name: 'Roll result' });
	await expect(result).toContainText('Modifier: +1');
	await expect(result).toContainText('door check');
	const rolled = await result.innerText();
	const faces = [...rolled.matchAll(/die \d+: (\d+)/g)].map((match) => Number(match[1]));
	const total = Number(rolled.match(/Total: (\d+)/)?.[1]);
	expect(faces).toHaveLength(2);
	expect(faces.every((face) => face >= 1 && face <= 6)).toBe(true);
	expect(total).toBe((faces[0] ?? 0) + (faces[1] ?? 0) + 1);

	const held = page.getByRole('button', { name: /Hold die/ }).first();
	const heldValue = (await held.getAttribute('aria-label'))?.match(/\d+/)?.[0];
	await held.click();
	await page.getByRole('button', { name: 'Re-roll unheld' }).click();
	await expect(page.getByRole('button', { name: `Release die ${heldValue}` })).toBeVisible();

	await page.getByRole('button', { name: 'Advantage', exact: true }).click();
	await expect(result).toContainText(/Advantage \(2d20 keep high\): rolled \d+ and \d+ → \d+/);
	const advantage = await result.innerText();
	const high = advantage.match(/rolled (\d+) and (\d+) → (\d+)/);
	expect(Number(high?.[3])).toBe(Math.max(Number(high?.[1]), Number(high?.[2])));

	await page.reload();
	await expect(page.locator('.history')).toContainText('advantage');
	await expect(page.locator('.history')).toContainText('2d6+1');
	await expect(page.getByRole('textbox', { name: 'Comment' }).nth(1)).toHaveValue('door check');

	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
	);
	expect(overflow).toBe(true);

	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/terminal');
	const input = page.getByRole('textbox', { name: 'Command' });
	const transcript = page.getByRole('log', { name: 'Terminal transcript' });
	await expect(input).toHaveAttribute('data-ready', 'true');
	await input.fill('roll 2d6+1');
	await input.press('Enter');
	await expect(transcript).toContainText('Rolling 2d6+1:');
	await expect(transcript).toContainText('Modifier: +1');
	const terminalRoll = await transcript.innerText();
	const terminalFaces = [...terminalRoll.matchAll(/die \d+: (\d+)/g)].map((match) =>
		Number(match[1])
	);
	const terminalTotal = Number(terminalRoll.match(/Total: (\d+)/)?.[1]);
	expect(terminalFaces).toHaveLength(2);
	expect(terminalTotal).toBe((terminalFaces[0] ?? 0) + (terminalFaces[1] ?? 0) + 1);

	await input.fill('roll advantage');
	await input.press('Enter');
	await expect(transcript).toContainText('Advantage (2d20 keep high)');
	const terminalHigh = (await transcript.innerText()).match(
		/Advantage \(2d20 keep high\): rolled (\d+) and (\d+) → (\d+)/
	);
	expect(Number(terminalHigh?.[3])).toBe(
		Math.max(Number(terminalHigh?.[1]), Number(terminalHigh?.[2]))
	);

	await input.fill('roll dis');
	await input.press('Enter');
	const terminalLow = (await transcript.innerText()).match(
		/Disadvantage \(2d20 keep low\): rolled (\d+) and (\d+) → (\d+)/
	);
	expect(Number(terminalLow?.[3])).toBe(
		Math.min(Number(terminalLow?.[1]), Number(terminalLow?.[2]))
	);

	await input.fill('roll 2d6foo');
	await input.press('Enter');
	await expect(transcript).toContainText('not dice notation');
});
