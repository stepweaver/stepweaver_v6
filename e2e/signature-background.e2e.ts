import { expect, test, type Page } from '@playwright/test';

async function placement(page: Page) {
	return page.evaluate(() => {
		const canvas = document.querySelector('canvas.lambda-canvas');
		const transform = canvas instanceof HTMLCanvasElement ? canvas.style.transform : '';
		const scale = Number(/scale\(([^)]+)\)/.exec(transform)?.[1] ?? NaN);
		const x = Number(/translateX\(([-\d.]+)%\)/.exec(transform)?.[1] ?? NaN);
		const y = Number(/translateY\(([-\d.]+)%\)/.exec(transform)?.[1] ?? NaN);
		return {
			scale: Math.round(scale * 1000) / 1000,
			x: Math.round(x * 1000) / 1000,
			y: Math.round(y * 1000) / 1000
		};
	});
}

async function generation(page: Page) {
	return page.locator('canvas.circuit-canvas').getAttribute('data-board-generation');
}

async function lambdaColor(page: Page) {
	return page.evaluate(() => {
		const canvas = document.querySelector('canvas.lambda-canvas');
		if (!(canvas instanceof HTMLCanvasElement) || canvas.width < 32) return '';
		const context = canvas.getContext('2d', { willReadFrequently: true });
		if (!context) return '';
		const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
		let bestAlpha = 0;
		let best = '';
		for (let index = 0; index < data.length; index += 4) {
			const alpha = data[index + 3] ?? 0;
			if (alpha > bestAlpha) {
				bestAlpha = alpha;
				best = `${data[index]},${data[index + 1]},${data[index + 2]}`;
			}
		}
		return best;
	});
}

async function circuitSample(page: Page) {
	return page.evaluate(() => {
		const canvas = document.querySelector('canvas.circuit-canvas');
		if (!(canvas instanceof HTMLCanvasElement) || canvas.width < 32) return { ink: 0, hash: 0 };
		const context = canvas.getContext('2d');
		if (!context) return { ink: 0, hash: 0 };
		const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
		let ink = 0;
		let hash = 2166136261;
		for (let index = 3; index < data.length; index += 16) {
			const alpha = data[index] ?? 0;
			ink += alpha;
			hash ^= alpha;
			hash = Math.imul(hash, 16777619);
		}
		return { ink, hash };
	});
}

async function stretch(page: Page) {
	await page.evaluate(() => {
		document.documentElement.style.scrollBehavior = 'auto';
		const main = document.getElementById('main');
		if (main) main.style.minHeight = '5000px';
		window.scrollTo(0, 0);
	});
}

test('a phone swipe keeps the circuit and a height-only resize rebuilds it', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 760 });
	await page.goto('/');
	const circuit = page.locator('canvas.circuit-canvas');
	const lambda = page.locator('canvas.lambda-canvas');
	const layer = page.locator('.lambda-layer');

	await expect(circuit).toHaveAttribute('data-board-generation', /^[1-9]\d*$/);
	await expect(circuit).toHaveCSS('pointer-events', 'none');
	await expect(lambda).toHaveCSS('pointer-events', 'none');
	await expect(page.locator('.scanlines')).toHaveCSS('pointer-events', 'none');
	await expect(layer).toHaveCSS('justify-content', 'flex-start');
	await expect(lambda).toHaveCSS('opacity', '0.3');
	await expect.poll(() => lambdaColor(page)).toBe('0,255,0');
	await expect(lambda).toHaveAttribute(
		'style',
		/scale\(0\.9\) translateX\(-30%\) translateY\(2%\)/
	);

	const hit = await page.evaluate(() => {
		const target = document.elementFromPoint(24, window.innerHeight / 2);
		return `${target?.tagName ?? ''} ${target?.className ?? ''}`;
	});
	expect(hit).not.toContain('CANVAS');
	expect(hit).not.toContain('scanlines');
	expect(hit).not.toContain('circuit-layer');
	expect(hit).not.toContain('lambda-layer');

	await page.keyboard.press('Tab');
	await expect(page.locator('.skip-link')).toBeFocused();

	const settled = await generation(page);
	const moving = await circuitSample(page);
	expect(moving.ink).toBeGreaterThan(0);
	await expect
		.poll(() => circuitSample(page).then((sample) => sample.hash), { timeout: 2000 })
		.not.toBe(moving.hash);

	await stretch(page);
	expect(await generation(page)).toBe(settled);

	await page.evaluate(() => {
		const max = document.documentElement.scrollHeight - window.innerHeight;
		window.scrollTo(0, max / 2);
	});
	await expect(lambda).not.toHaveAttribute(
		'style',
		/scale\(0\.9\) translateX\(-30%\) translateY\(2%\)/
	);
	await expect.poll(() => lambdaColor(page)).not.toBe('0,255,0');
	expect(await generation(page)).toBe(settled);

	await page.evaluate(() => {
		const max = document.documentElement.scrollHeight - window.innerHeight;
		window.scrollTo(0, max);
	});
	await expect(lambda).toHaveAttribute(
		'style',
		/scale\(0\.5\) translateX\(-50%\) translateY\(2%\)/
	);
	await expect.poll(() => lambdaColor(page)).toBe('0,255,255');
	expect(await generation(page)).toBe(settled);

	await page.setViewportSize({ width: 390, height: 830 });
	await expect(circuit).not.toHaveAttribute('data-board-generation', settled ?? '');
	const tall = await generation(page);
	expect(tall).not.toBe(settled);

	await page.setViewportSize({ width: 390, height: 760 });
	await expect(circuit).not.toHaveAttribute('data-board-generation', tall ?? '');
	const restored = await generation(page);
	expect(restored).not.toBe(tall);
	expect(restored).not.toBe(settled);

	await page.locator('a[href="/about"]:visible').first().click();
	await page.waitForURL('**/about');
	expect(await generation(page)).toBe(restored);
	await page.goBack();
	await page.waitForURL('**/');
	expect(await generation(page)).toBe(restored);

	await page.getByRole('button', { name: 'Switch to light theme' }).click();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
	await expect(lambda).toHaveCSS('opacity', '0.2');
	await expect(circuit).toHaveCSS('opacity', '0.2');
	await stretch(page);
	await page.evaluate(() => {
		const max = document.documentElement.scrollHeight - window.innerHeight;
		window.scrollTo(0, max);
	});
	await expect.poll(() => placement(page)).toEqual({ scale: 0.5, x: -50, y: 2 });
	await expect(lambda).toHaveAttribute('data-color', '0,51,102');
	await expect.poll(() => lambdaColor(page)).toBe('0,51,102');
	expect(await generation(page)).not.toBe(restored);
});

test('desktop scroll moves the lambda and leaves the circuit in place', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/');
	const circuit = page.locator('canvas.circuit-canvas');
	const lambda = page.locator('canvas.lambda-canvas');

	await expect(page.locator('.lambda-layer')).toHaveCSS('justify-content', 'flex-end');
	await expect(page.locator('.lambda-layer')).toHaveCSS('padding-right', '64px');
	await expect(lambda).toHaveAttribute('style', /scale\(1\.4\) translateX\(4%\) translateY\(5%\)/);
	await expect.poll(() => lambdaColor(page)).toBe('0,255,0');
	const settled = await generation(page);

	await stretch(page);
	await page.evaluate(() => {
		const max = document.documentElement.scrollHeight - window.innerHeight;
		window.scrollTo(0, max);
	});
	await expect.poll(() => placement(page)).toEqual({ scale: 0.6, x: 26, y: 5 });
	await expect.poll(() => lambdaColor(page)).toBe('0,255,255');
	expect(await generation(page)).toBe(settled);

	await page.getByRole('combobox', { name: 'Appearance' }).selectOption('skynet');
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'skynet');
	await expect(lambda).toHaveCSS('opacity', '0.34');
	await expect(circuit).toHaveCSS('opacity', '0.48');
	await expect(circuit).toHaveAttribute('data-motion', 'run');
});

test.describe('reduced motion', () => {
	test.use({ reducedMotion: 'reduce', viewport: { width: 390, height: 760 } });

	test('draws a still circuit until the viewport height changes', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/');
		const circuit = page.locator('canvas.circuit-canvas');
		const lambda = page.locator('canvas.lambda-canvas');
		await expect(circuit).toHaveAttribute('data-motion', 'reduced');
		await expect.poll(() => circuitSample(page).then((sample) => sample.ink)).toBeGreaterThan(0);
		const still = await circuitSample(page);
		await page.waitForTimeout(400);
		expect(await circuitSample(page)).toEqual(still);

		await stretch(page);
		const settled = await generation(page);
		await page.evaluate(() => {
			const max = document.documentElement.scrollHeight - window.innerHeight;
			window.scrollTo(0, max);
		});
		await expect(lambda).toHaveAttribute('style', /translateX\(-50%\)/);
		expect(await generation(page)).toBe(settled);
		expect(await circuitSample(page)).toEqual(still);

		await page.setViewportSize({ width: 390, height: 830 });
		await expect(circuit).not.toHaveAttribute('data-board-generation', settled ?? '');
		await expect(circuit).toHaveAttribute('data-motion', 'reduced');
		await expect.poll(() => circuitSample(page).then((sample) => sample.hash)).not.toBe(still.hash);
		const rearranged = await circuitSample(page);
		await page.waitForTimeout(400);
		expect(await circuitSample(page)).toEqual(rearranged);
	});
});
