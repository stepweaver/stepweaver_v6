import { expect, test, type Page } from '@playwright/test';

type FadeSample = {
	t: number;
	main: string;
	header: string;
	lambda: string;
	path: string;
};

type FadeTrace = {
	id: string;
	duration: number | null;
	easing: string | null;
	from: string | null;
	to: string | null;
	samples: FadeSample[];
};

async function watchAnimations(page: Page) {
	await page.evaluate(() => {
		const state = window as unknown as { __fadeTraces?: FadeTrace[]; __fadePatched?: boolean };
		state.__fadeTraces ??= [];
		if (state.__fadePatched) return;
		state.__fadePatched = true;

		const original = Element.prototype.animate;
		Element.prototype.animate = function (this: Element, ...args: Parameters<Element['animate']>) {
			const animation = original.apply(this, args);
			const effect = animation.effect;
			const timing = effect instanceof KeyframeEffect ? effect.getTiming() : null;
			const frames = effect instanceof KeyframeEffect ? effect.getKeyframes() : [];
			const header = document.querySelector('.site-header');
			const lambda = document.querySelector('.lambda-canvas');
			const opacity = (element: Element | null) =>
				element ? getComputedStyle(element).opacity : '';
			const sample = (): FadeSample => ({
				t: typeof animation.currentTime === 'number' ? Math.round(animation.currentTime) : -1,
				main: opacity(this),
				header: opacity(header),
				lambda: opacity(lambda),
				path: `${location.pathname}${location.search}`
			});
			const trace: FadeTrace = {
				id: this.id,
				duration: typeof timing?.duration === 'number' ? timing.duration : null,
				easing: typeof timing?.easing === 'string' ? timing.easing : null,
				from: frames[0]?.opacity == null ? null : String(frames[0].opacity),
				to: frames[1]?.opacity == null ? null : String(frames[1].opacity),
				samples: [sample()]
			};
			state.__fadeTraces?.push(trace);
			const loop = () => {
				trace.samples.push(sample());
				if (animation.playState === 'running') requestAnimationFrame(loop);
			};
			requestAnimationFrame(loop);
			void animation.finished.then(() => {
				trace.samples.push(sample());
			});
			return animation;
		};
	});
}

async function traces(page: Page) {
	return page.evaluate(
		() => (window as unknown as { __fadeTraces?: FadeTrace[] }).__fadeTraces ?? []
	);
}

async function settleLambda(page: Page) {
	await page.waitForFunction(() => {
		const lambda = document.querySelector('.lambda-canvas');
		return lambda instanceof HTMLElement && lambda.style.opacity !== '';
	});
}

function expectPhosphor(trace: FadeTrace | undefined) {
	expect(trace).toMatchObject({
		id: 'main',
		duration: 160,
		easing: 'ease-out',
		from: '0.6',
		to: '1'
	});
	const samples = trace?.samples ?? [];
	expect(samples.length).toBeGreaterThan(1);
	expect(Number(samples[0]?.main)).toBeGreaterThan(0.55);
	expect(Number(samples[0]?.main)).toBeLessThan(0.75);
	expect(Number(samples[samples.length - 1]?.main)).toBe(1);
	expect(samples[samples.length - 1]?.t).toBeGreaterThanOrEqual(160);
	const header = samples[0]?.header;
	const lambda = samples[0]?.lambda;
	expect(header).toBe('1');
	expect(Number(lambda)).toBeGreaterThan(0);
	for (const sample of samples) {
		expect(sample.header).toBe(header);
		expect(sample.lambda).toBe(lambda);
	}
}

async function settleFade(page: Page) {
	await page.evaluate(async () => {
		const main = document.getElementById('main');
		if (!main) return;
		await Promise.all(
			main.getAnimations().map((animation) => animation.finished.catch(() => undefined))
		);
	});
}

async function expectInstant(page: Page, action: () => Promise<void>) {
	await settleFade(page);
	await watchAnimations(page);
	const before = (await traces(page)).length;
	const shell = await page.evaluate(() => ({
		main: getComputedStyle(document.getElementById('main') as HTMLElement).opacity,
		header: getComputedStyle(document.querySelector('.site-header') as HTMLElement).opacity,
		lambda: getComputedStyle(document.querySelector('.lambda-canvas') as HTMLElement).opacity
	}));
	await action();
	expect(await traces(page)).toHaveLength(before);
	await expect(page.locator('#main')).toHaveCSS('opacity', '1');
	const after = await page.evaluate(() => ({
		header: getComputedStyle(document.querySelector('.site-header') as HTMLElement).opacity,
		lambda: getComputedStyle(document.querySelector('.lambda-canvas') as HTMLElement).opacity
	}));
	expect(after.header).toBe(shell.header);
	expect(after.lambda).toBe(shell.lambda);
	expect(shell.main).toBe('1');
}

test.beforeEach(async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
});

test('an internal page settles from 60% while the shell stays steady', async ({ page }) => {
	await page.goto('/');
	await settleLambda(page);
	await expect(page.locator('#main')).toHaveCSS('opacity', '1');
	expect(await page.locator('#main').evaluate((element) => element.getAnimations().length)).toBe(0);

	await watchAnimations(page);
	await page
		.getByRole('navigation', { name: 'Primary' })
		.getByRole('link', { name: 'About' })
		.click();
	await expect(page).toHaveURL(/\/about$/);
	await expect(page.getByRole('heading', { level: 1, name: 'Stephen Weaver' })).toBeVisible();
	await page.waitForFunction(() => {
		const latest = (window as unknown as { __fadeTraces?: FadeTrace[] }).__fadeTraces?.at(-1);
		return (latest?.samples.at(-1)?.t ?? 0) >= 160;
	});
	expectPhosphor((await traces(page)).at(-1));

	await page.goto('/writing');
	await settleLambda(page);
	await watchAnimations(page);
	await page.getByRole('link', { name: 'Workflow handoffs' }).click();
	await expect(page).toHaveURL(/\/writing\/workflow-handoffs$/);
	await expect(page.getByRole('heading', { level: 1, name: 'Workflow handoffs' })).toBeVisible();
	await settleFade(page);
	expectPhosphor((await traces(page)).at(-1));
});

test('terminal, history, writing updates, and reduced motion stay instant', async ({ page }) => {
	await page.goto('/');
	await settleLambda(page);

	await expectInstant(page, () => page.getByRole('link', { name: 'Open Terminal' }).click());
	await expect(page).toHaveURL(/\/terminal$/);
	await expect(page.getByRole('textbox', { name: 'Command' })).toBeFocused();

	await expectInstant(page, () => page.locator('.site-logo').click());
	await expect(page).toHaveURL(/\/$/);

	await page
		.getByRole('navigation', { name: 'Primary' })
		.getByRole('link', { name: 'About' })
		.click();
	await expect(page).toHaveURL(/\/about$/);
	await expectInstant(page, () => page.goBack());
	await expect(page).toHaveURL(/\/$/);
	await expectInstant(page, () => page.goForward());
	await expect(page).toHaveURL(/\/about$/);

	await page.goto('/writing');
	await settleLambda(page);
	await expectInstant(page, () =>
		page.getByRole('navigation', { name: 'Tags' }).getByRole('link', { name: 'systems' }).click()
	);
	await expect(page).toHaveURL(/tag=systems/);
	await expect(page.getByRole('link', { name: 'Workflow handoffs' })).toBeVisible();

	await page.goto('/writing');
	await settleLambda(page);
	await expectInstant(page, () => page.getByRole('link', { name: 'Next' }).click());
	await expect(page).toHaveURL(/page=2/);
	await expect(page.getByRole('link', { name: 'Renamed after publication' })).toBeVisible();

	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/');
	await settleLambda(page);
	await expectInstant(page, () =>
		page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Writing' }).click()
	);
	await expect(page).toHaveURL(/\/writing$/);
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
