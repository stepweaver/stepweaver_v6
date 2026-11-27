import { expect, test, type Page, type Route } from '@playwright/test';

const WRITING_API = '/api/palette/writing';

async function ready(page: Page) {
	await expect(page.getByRole('textbox', { name: 'Command' })).toHaveAttribute(
		'data-ready',
		'true'
	);
}

test('opening the terminal skips the writing catalog', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	const requests: string[] = [];
	page.on('request', (request) => {
		if (request.url().includes(WRITING_API)) requests.push(request.url());
	});

	const response = await page.goto('/terminal');
	const html = await response!.text();
	expect(html).not.toContain('workflow-handoffs');
	expect(html).not.toContain('Integration boundaries');
	expect(html).not.toContain('Unpublished operations note');
	expect(response!.headers()['server-timing'] ?? '').not.toContain('writing');
	await ready(page);
	expect(requests).toEqual([]);

	const input = page.getByRole('textbox', { name: 'Command' });
	const transcript = page.getByRole('log', { name: 'Terminal transcript' });
	await input.fill('help');
	await input.press('Enter');
	await expect(transcript).toContainText('help: Show commands');
	await input.fill('resume');
	await input.press('Enter');
	await expect(page.getByRole('link', { name: /weaver_resume\.pdf/ })).toHaveAttribute(
		'href',
		'/weaver_resume.pdf'
	);
	await input.fill('cd resume');
	await input.press('Enter');
	await expect(page).toHaveURL(/\/resume$/);
	expect(requests).toEqual([]);
});

test('codex loads writing on first use and reuses that response', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	const requests: string[] = [];
	let release = () => {};
	const gate = new Promise<void>((resolve) => {
		release = resolve;
	});
	await page.route(`**${WRITING_API}`, async (route: Route) => {
		requests.push(route.request().url());
		await gate;
		await route.continue();
	});

	await page.goto('/terminal');
	await ready(page);
	expect(requests).toEqual([]);

	const input = page.getByRole('textbox', { name: 'Command' });
	const transcript = page.getByRole('log', { name: 'Terminal transcript' });
	await input.fill('cd');
	await input.press('Enter');
	await expect(transcript).toContainText('/writing');
	await expect(page).toHaveURL('/terminal');
	expect(requests).toEqual([]);

	await input.fill('codex');
	await input.press('Enter');
	await expect.poll(() => requests.length).toBe(1);
	await expect(input).toHaveValue('');
	await expect(transcript).not.toContainText('Workflow handoffs');
	await input.fill('help');
	await input.press('Enter');
	await expect(transcript).toContainText('help: Show commands');
	expect(requests).toHaveLength(1);

	release();
	await expect(transcript).toContainText('published post');
	await input.fill('ls');
	await input.press('Enter');
	await expect(transcript).toContainText('Workflow handoffs');
	await expect(transcript).toContainText('[2026-09-02]');
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
	await input.fill('codex');
	await input.press('Enter');
	await expect(transcript.getByText('user@stepweaver.dev:~$ codex')).toHaveCount(2);
	expect(requests).toHaveLength(1);
});

test('a writing failure stays in the console and the next codex retries', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	let attempts = 0;
	await page.route(`**${WRITING_API}`, async (route) => {
		attempts += 1;
		if (attempts === 1) {
			await route.fulfill({
				status: 503,
				contentType: 'application/json',
				headers: { 'cache-control': 'no-store' },
				body: JSON.stringify({ status: 'unavailable', posts: [] })
			});
			return;
		}
		await route.continue();
	});

	await page.goto('/terminal');
	await ready(page);
	const input = page.getByRole('textbox', { name: 'Command' });
	const transcript = page.getByRole('log', { name: 'Terminal transcript' });

	await input.fill('codex');
	await input.press('Enter');
	await expect(transcript).toContainText('Writing could not be loaded.');
	await expect(page.locator('.prompt-row .prompt')).toHaveText('[codex]');
	expect(attempts).toBe(1);

	await input.fill('help');
	await input.press('Enter');
	await expect(transcript).toContainText('ls: list posts');
	await input.fill('exit');
	await input.press('Enter');
	await input.fill('resume');
	await input.press('Enter');
	await expect(page.getByRole('link', { name: /weaver_resume\.pdf/ })).toBeVisible();
	expect(attempts).toBe(1);

	await input.fill('codex');
	await input.press('Enter');
	await expect(transcript).toContainText('published post');
	await input.fill('cat workflow-handoffs');
	await input.press('Enter');
	await expect(transcript).toContainText('Workflow handoffs');
	await expect(page.getByRole('link', { name: '/writing/workflow-handoffs' })).toHaveAttribute(
		'href',
		'/writing/workflow-handoffs'
	);
	expect(attempts).toBe(2);

	await input.fill('ls');
	await input.press('Enter');
	await expect(transcript).toContainText('[2026-09-02]');
	expect(attempts).toBe(2);
});
