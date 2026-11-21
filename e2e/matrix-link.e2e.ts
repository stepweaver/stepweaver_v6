import { expect, test, type Page } from '@playwright/test';

type MatrixSample = {
	phase: string;
	status: string;
	attempt: string;
	height: number;
	color: string;
};

async function watchMatrix(page: Page) {
	await page.addInitScript(() => {
		type Sample = { phase: string; status: string; attempt: string; height: number; color: string };
		const state: {
			log: Sample[];
			jumped: boolean;
			colors: Record<string, string>;
			header: string;
			done: boolean;
		} = {
			log: [],
			jumped: false,
			colors: {},
			header: '',
			done: false
		};
		(window as Window & { __matrix?: typeof state }).__matrix = state;

		let height = 0;
		const push = () => {
			const panel = document.querySelector('.matrix-link');
			const status = document.querySelector('[data-matrix-status]');
			const attempt = document.querySelector('[data-matrix-attempt]');
			const line = document.querySelector('.matrix-link .status-line');
			if (!(panel instanceof HTMLElement) || !status || !attempt || !(line instanceof HTMLElement)) {
				return;
			}
			const nextHeight = Math.round(panel.getBoundingClientRect().height);
			if (nextHeight > 0) {
				if (!height) height = nextHeight;
				else if (nextHeight !== height) state.jumped = true;
			}
			const phase = panel.dataset.phase ?? '';
			const sample = {
				phase,
				status: (status.textContent ?? '').trim(),
				attempt: (attempt.textContent ?? '').trim(),
				height: nextHeight > 0 ? nextHeight : height,
				color: getComputedStyle(line).color
			};
			if (phase) state.colors[phase] = sample.color;
			const header = document.querySelector('[data-matrix-header]');
			state.header = (header?.textContent ?? '').replace(/\s+/g, ' ').trim();
			const previous = state.log[state.log.length - 1];
			if (
				!previous ||
				previous.phase !== sample.phase ||
				previous.status !== sample.status ||
				previous.attempt !== sample.attempt
			) {
				state.log.push(sample);
			}
			if (state.log.some((entry) => entry.phase === 'init' && entry.attempt === '02')) {
				state.done = true;
			}
		};
		window.setInterval(push, 40);
	});
}

async function readMatrix(page: Page) {
	return page.evaluate(() => {
		const state = (
			window as Window & {
				__matrix?: {
					log: MatrixSample[];
					jumped: boolean;
					colors: Record<string, string>;
					header: string;
					done: boolean;
				};
			}
		).__matrix;
		return state ?? { log: [], jumped: true, colors: {}, header: '', done: false };
	});
}

test('matrix link cycles the uplink and keeps the card height stable', async ({ page }) => {
	test.setTimeout(45_000);
	await page.setViewportSize({ width: 1440, height: 900 });
	await watchMatrix(page);
	await page.goto('/');

	await expect(page.locator('canvas.circuit-canvas')).toHaveCount(1);
	await expect(page.locator('canvas.lambda-canvas')).toHaveCount(1);
	await expect(page.locator('.portrait-bay img').first()).toBeVisible();
	await expect(page.locator('[data-matrix-cell]')).toHaveCount(6);
	await expect(page.locator('.matrix-link')).toHaveAttribute('aria-hidden', 'true');
	await expect(page.locator('.matrix-link [aria-live]')).toHaveCount(0);

	const glyph = page.locator('[data-matrix-glyph]');
	await expect(glyph).toHaveText('λ');
	await expect(glyph).toHaveCSS('text-transform', 'none');
	const layers = await glyph.evaluate((element) => ({
		before: getComputedStyle(element, '::before').content,
		after: getComputedStyle(element, '::after').content,
		beforeTransform: getComputedStyle(element, '::before').textTransform,
		afterTransform: getComputedStyle(element, '::after').textTransform
	}));
	const upperLambda = String.fromCodePoint(0x039b);
	expect(layers.before).toContain('λ');
	expect(layers.after).toContain('λ');
	expect(layers.before).not.toContain(upperLambda);
	expect(layers.after).not.toContain(upperLambda);
	expect(layers.beforeTransform).toBe('none');
	expect(layers.afterTransform).toBe('none');

	const eyebrow = page.locator('.hero-copy .eyebrow');
	await expect(eyebrow.locator('.lambda-glyph')).toHaveText('λ');
	await expect(eyebrow.locator('.lambda-glyph')).toHaveCSS('text-transform', 'none');
	await expect(eyebrow).toHaveCSS('text-transform', 'uppercase');
	await expect(page.locator('.site-logo .lambda-glyph')).toHaveText('λ');
	await expect(page.locator('.site-logo .lambda-glyph')).toHaveCSS('text-transform', 'none');

	await page.waitForFunction(
		() => (window as Window & { __matrix?: { done: boolean } }).__matrix?.done === true,
		undefined,
		{ timeout: 25_000 }
	);
	const watched = await readMatrix(page);
	const phases = watched.log.reduce<string[]>((list, entry) => {
		if (list[list.length - 1] !== entry.phase) list.push(entry.phase);
		return list;
	}, []);
	const animated = phases[0] === 'unplugged' ? phases.slice(1) : phases;
	expect(animated).toEqual([
		'init',
		'scan',
		'trace',
		'lock',
		'fail',
		'lost',
		'unplugged',
		'idle',
		'init'
	]);
	expect(watched.log.find((entry) => entry.phase === 'init')?.attempt).toBe('01');
	expect(
		watched.log.find((entry) => entry.phase === 'init' && entry.attempt === '02')
	).toBeTruthy();
	expect(watched.log.find((entry) => entry.phase === 'trace')?.status).toMatch(
		/^TRACE 0x[0-9a-f]{6}$/
	);
	expect(watched.header).toContain('UNPLUGGED');
	expect(watched.header).toContain('MATRIX LINK');
	expect(watched.jumped).toBe(false);
	expect(watched.colors.init).not.toBe(watched.colors.trace);
	expect(watched.colors.trace).not.toBe(watched.colors.fail);
	expect(watched.colors.fail).not.toBe(watched.colors.lost);
	const heights = watched.log.map((entry) => entry.height).filter((height) => height > 0);
	expect(new Set(heights).size).toBe(1);

	const card = await page.getByRole('region', { name: 'Operator profile' }).boundingBox();
	const headline = await page.getByRole('heading', { level: 1 }).boundingBox();
	expect(card?.x ?? 0).toBeLessThan(headline?.x ?? 0);
});

test('matrix link stays in the card on a phone without a layout jump', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await watchMatrix(page);
	await page.goto('/');
	await page.waitForFunction(
		() =>
			(window as Window & { __matrix?: { log: { phase: string }[] } }).__matrix?.log.some(
				(entry) => entry.phase === 'trace'
			) === true,
		undefined,
		{ timeout: 15_000 }
	);
	const watched = await readMatrix(page);
	expect(watched.jumped).toBe(false);
	expect(watched.log.some((entry) => entry.status === 'SCANNING CONSTRUCT')).toBe(true);
	await expect(page.locator('[data-matrix-cell]')).toHaveCount(6);
	await expect(page.locator('[data-matrix-glyph]')).toHaveText('λ');
	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
	);
	expect(overflow).toBe(true);
	const portrait = await page.locator('.portrait-bay').boundingBox();
	expect(portrait?.width ?? 0).toBeGreaterThan(120);
});

test('reduced motion keeps a static unplugged matrix panel', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	for (const width of [390, 1440]) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto('/');
		const panel = page.locator('.matrix-link');
		await expect(panel).toHaveAttribute('data-phase', 'unplugged');
		await expect(panel).toHaveAttribute('aria-hidden', 'true');
		await expect(page.locator('[data-matrix-header]')).toContainText('UNPLUGGED');
		await expect(page.locator('[data-matrix-status]')).toHaveText('USR UNPLUGGED');
		await expect(page.locator('[data-matrix-attempt]')).toHaveText('01');
		await expect(page.locator('[data-matrix-glyph]')).toHaveText('λ');
		await expect(page.locator('[data-matrix-glyph]')).toHaveCSS('text-transform', 'none');
		await expect(page.locator('[data-matrix-cell]')).toHaveText([
			'··',
			'··',
			'··',
			'··',
			'··',
			'··'
		]);
		await expect(page.locator('.glyph.glitching')).toHaveCount(0);
		const before = await panel.boundingBox();
		await page.waitForTimeout(1600);
		await expect(page.locator('[data-matrix-status]')).toHaveText('USR UNPLUGGED');
		await expect(page.locator('[data-matrix-attempt]')).toHaveText('01');
		await expect(panel).toHaveAttribute('data-phase', 'unplugged');
		const after = await panel.boundingBox();
		expect(Math.round(before?.height ?? 0)).toBe(Math.round(after?.height ?? 0));
	}
});
