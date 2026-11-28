import { expect, test } from '@playwright/test';
import {
	LAMBDA_BUDGET_UNAVAILABLE_MESSAGE,
	LAMBDA_DAILY_LIMIT_MESSAGE,
	LAMBDA_PROVIDER_FAILURE_MESSAGE,
	LAMBDA_TURNED_OFF_MESSAGE
} from '../src/lib/server/lambda/budget';

const fixtures = [
	{ status: 429, message: LAMBDA_DAILY_LIMIT_MESSAGE, retryAfter: '120' },
	{ status: 503, message: LAMBDA_TURNED_OFF_MESSAGE },
	{ status: 503, message: LAMBDA_BUDGET_UNAVAILABLE_MESSAGE },
	{ status: 502, message: LAMBDA_PROVIDER_FAILURE_MESSAGE }
];

test('the terminal shows fixture λlambda limit and outage replies', async ({ page }) => {
	const pending = [...fixtures];
	await page.route('**/api/chat', async (route) => {
		const fixture = pending.shift();
		if (!fixture) throw new Error('unexpected chat request');
		await route.fulfill({
			status: fixture.status,
			contentType: 'application/json',
			headers: {
				'cache-control': 'no-store',
				...(fixture.retryAfter ? { 'retry-after': fixture.retryAfter } : {})
			},
			body: JSON.stringify({ error: fixture.message })
		});
	});
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/terminal');
	const input = page.getByRole('textbox', { name: 'Command' });
	const transcript = page.getByRole('log', { name: 'Terminal transcript' });
	await expect(input).toHaveAttribute('data-ready', 'true');
	for (const fixture of fixtures) {
		await input.fill(`chat ${fixture.status}`);
		await input.press('Enter');
		await expect(transcript).toContainText(fixture.message);
	}
	await input.fill('help');
	await input.press('Enter');
	await expect(transcript).toContainText('Available commands:');
});

test('the site widget shows fixture λlambda limit and outage replies', async ({ page }) => {
	const pending = [...fixtures];
	await page.route('**/api/chat', async (route) => {
		const fixture = pending.shift();
		if (!fixture) throw new Error('unexpected chat request');
		await route.fulfill({
			status: fixture.status,
			contentType: 'application/json',
			headers: {
				'cache-control': 'no-store',
				...(fixture.retryAfter ? { 'retry-after': fixture.retryAfter } : {})
			},
			body: JSON.stringify({ error: fixture.message })
		});
	});
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/');
	const openChat = page.getByRole('button', { name: 'Open chat' });
	await expect(openChat).toHaveAttribute('data-ready', 'true');
	await openChat.click();
	const thread = page.getByRole('log', { name: 'Chat' });
	for (const fixture of fixtures) {
		await page.getByRole('textbox', { name: 'Message' }).fill(fixture.message);
		await page.getByRole('button', { name: 'Send' }).click();
		await expect(thread).toContainText(fixture.message);
	}
});
