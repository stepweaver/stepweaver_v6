import { expect, test } from '@playwright/test';

test('resume keeps the history and labels both pdf downloads', async ({ page, request }) => {
	await page.goto('/resume');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Stephen Weaver');
	await expect(
		page.getByText('Business Systems Developer & Systems Integration Consultant')
	).toBeVisible();
	await expect(page.getByText('Business Analyst')).toBeVisible();
	await expect(page.getByText('Operations Manager')).toBeVisible();
	await expect(page.getByText('Cryptologic Linguist')).toBeVisible();
	await expect(page.getByText('Grand Valley State University')).toBeVisible();
	await expect(page.getByText('Nov 2017 – May 2025')).toBeVisible();
	await expect(page.getByText('pending editorial review')).toBeVisible();

	await expect(page.getByRole('link', { name: 'Download current PDF' })).toHaveAttribute(
		'href',
		'/weaver_resume.pdf'
	);
	await expect(page.getByRole('link', { name: 'Download draft PDF' })).toHaveAttribute(
		'href',
		'/resume/draft.pdf'
	);

	const current = await request.get('/weaver_resume.pdf');
	expect(current.status()).toBe(200);
	expect((await current.body()).subarray(0, 5).toString()).toBe('%PDF-');

	const draft = await request.get('/resume/draft.pdf');
	expect(draft.status()).toBe(200);
	expect(draft.headers()['content-disposition']).toContain('weaver_resume_draft.pdf');
	const draftText = (await draft.body()).toString('latin1');
	expect(draftText.startsWith('%PDF-')).toBe(true);
	expect(draftText).toContain('DRAFT - pending editorial review');
	expect(draftText).toContain('Business Systems Developer');
	expect(draftText).toContain('University of Notre Dame');

	for (const width of [390, 464, 768, 1440]) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto('/resume');
		const overflow = await page.evaluate(
			() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
		);
		expect(overflow).toBe(true);
		await expect(page.getByRole('link', { name: 'Download draft PDF' })).toBeVisible();
	}
});
