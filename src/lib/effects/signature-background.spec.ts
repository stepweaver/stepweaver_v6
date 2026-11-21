import { describe, expect, it } from 'vitest';
import { SPRITE_COLORS, SPRITE_PALETTE_BY_THEME } from '$lib/effects/background-constants';
import {
	advanceSprites,
	circuitGeometry,
	createCircuitBoard,
	spriteStartEdges
} from '$lib/effects/circuit-board';
import { clampProgress, documentScrollProgress } from '$lib/effects/document-scroll';
import {
	circuitDim,
	circuitOpacity,
	lambdaGlow,
	lambdaOpacity,
	lambdaPlacement,
	paletteColor
} from '$lib/effects/lambda-motion';
import { createSignatureSession, type SignatureSession } from '$lib/effects/signature-session';
import type { ThemeId } from '$lib/theme/themes';

function mulberry32(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = Math.imul(state ^ (state >>> 15), state | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), state | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function place(session: SignatureSession, theme: ThemeId) {
	const placement = lambdaPlacement(session.progress, session.width);
	return {
		transform: placement.transform,
		color: paletteColor(session.progress, theme).key,
		opacity: lambdaOpacity(theme),
		glow: lambdaGlow(theme)
	};
}

describe('signature background', () => {
	it('keeps the circuit during a swipe and rebuilds it when only the height changes', () => {
		const session = createSignatureSession(mulberry32(0xa8db9d46));
		session.setTheme('dark');
		session.apply({ type: 'resize', width: 390, height: 760, progress: 0 });
		const phone = session.board;
		expect(phone).not.toBeNull();
		if (!phone) return;

		const geometry = circuitGeometry(phone);
		const starts = spriteStartEdges(phone);
		const top = place(session, 'dark');
		expect(top.transform).toBe('scale(0.9) translateX(-30%) translateY(2%)');
		expect(top.color).toBe('0,255,0');

		expect(session.apply({ type: 'scroll', progress: 0.5 })).toBe('scroll');
		const middle = place(session, 'dark');
		expect(session.board).toBe(phone);
		expect(session.generation).toBe(1);
		expect(circuitGeometry(phone)).toBe(geometry);
		expect(spriteStartEdges(phone)).toEqual(starts);
		expect(middle.transform).toBe('scale(0.7) translateX(-40%) translateY(2%)');
		expect(middle.color).toBe('255,0,128');

		session.apply({ type: 'scroll', progress: 1 });
		const bottom = place(session, 'dark');
		expect(session.board).toBe(phone);
		expect(circuitGeometry(phone)).toBe(geometry);
		expect(spriteStartEdges(phone)).toEqual(starts);
		expect(bottom.transform).toBe('scale(0.5) translateX(-50%) translateY(2%)');
		expect(bottom.color).toBe('0,255,255');
		expect(place(session, 'light').color).toBe('0,51,102');
		expect(place(session, 'light').opacity).toBe(0.2);
		expect(bottom.opacity).toBe(0.3);

		const courses = phone.sprites.map((sprite) => sprite.t);
		advanceSprites(phone, () => 0.2);
		expect(circuitGeometry(phone)).toBe(geometry);
		expect(phone.sprites.map((sprite) => sprite.t)).not.toEqual(courses);
		expect(session.board).toBe(phone);

		session.apply({ type: 'resize', width: 390, height: 830, progress: 1 });
		const tall = session.board;
		expect(tall).not.toBeNull();
		if (!tall) return;
		expect(tall).not.toBe(phone);
		expect(session.width).toBe(390);
		expect(session.height).toBe(830);
		expect(circuitGeometry(tall)).not.toBe(geometry);
		expect(spriteStartEdges(tall)).not.toEqual(starts);

		session.apply({ type: 'resize', width: 390, height: 760, progress: 0 });
		const restored = session.board;
		expect(restored).not.toBeNull();
		if (!restored) return;
		expect(circuitGeometry(restored)).not.toBe(circuitGeometry(tall));
		expect(spriteStartEdges(restored)).not.toEqual(spriteStartEdges(tall));

		session.apply({ type: 'resize', width: 1440, height: 900, progress: 0 });
		const desktop = session.board;
		expect(desktop).not.toBeNull();
		if (!desktop) return;
		const desktopGeometry = circuitGeometry(desktop);
		const desktopStarts = spriteStartEdges(desktop);
		expect(place(session, 'dark').transform).toBe('scale(1.4) translateX(4%) translateY(5%)');

		session.apply({ type: 'scroll', progress: 0.5 });
		session.apply({ type: 'scroll', progress: 1 });
		expect(session.board).toBe(desktop);
		expect(circuitGeometry(desktop)).toBe(desktopGeometry);
		expect(spriteStartEdges(desktop)).toEqual(desktopStarts);
		expect(place(session, 'dark').transform).toBe(
			'scale(0.5999999999999999) translateX(26%) translateY(5%)'
		);
		expect(place(session, 'dark').color).toBe('0,255,255');
		expect(place(session, 'light').color).toBe('0,51,102');
	});

	it('matches the phone and desktop placement, palette, and circuit density', () => {
		expect(lambdaPlacement(0, 390).transform).toBe('scale(0.9) translateX(-30%) translateY(2%)');
		expect(lambdaPlacement(0.5, 390).transform).toBe('scale(0.7) translateX(-40%) translateY(2%)');
		expect(lambdaPlacement(1, 390).transform).toBe('scale(0.5) translateX(-50%) translateY(2%)');
		expect(lambdaPlacement(0, 767).scale).toBe(0.9);
		expect(lambdaPlacement(0, 768).transform).toBe('scale(1.4) translateX(4%) translateY(5%)');
		expect(lambdaPlacement(0, 1440).transform).toBe('scale(1.4) translateX(4%) translateY(5%)');
		expect(lambdaPlacement(0.5, 1440).transform).toBe(
			'scale(0.9999999999999999) translateX(15%) translateY(5%)'
		);
		expect(lambdaPlacement(1, 1440).transform).toBe(
			'scale(0.5999999999999999) translateX(26%) translateY(5%)'
		);
		expect(lambdaPlacement(2, 1440).transform).toBe(lambdaPlacement(1, 1440).transform);
		expect(clampProgress(Number.NaN)).toBe(0);
		expect(documentScrollProgress(40, 500, 800)).toBe(0);
		expect(documentScrollProgress(250, 1000, 500)).toBe(0.5);
		expect(documentScrollProgress(900, 1000, 500)).toBe(1);

		expect(paletteColor(0, 'dark').key).toBe('0,255,0');
		expect(paletteColor(0.5, 'dark').key).toBe('255,0,128');
		expect(paletteColor(1, 'dark').key).toBe('0,255,255');
		expect(paletteColor(0, 'light').key).toBe('0,0,0');
		expect(paletteColor(1, 'light').key).toBe('0,51,102');
		expect(lambdaOpacity('skynet')).toBe(0.34);
		expect(circuitOpacity('skynet')).toBe(0.48);
		expect(circuitOpacity('dark')).toBe(0.4);
		expect(circuitDim('light')).toBe(0.3);
		expect(circuitDim('monochrome-inverted')).toBe(0.3);
		expect(circuitDim('apple')).toBe(1);
		expect(circuitDim('dark')).toBe(1);
		expect(lambdaGlow('dark')).toContain('rgba(0,255,65,1)');
		expect(lambdaGlow('light')).toContain('rgba(0,0,0,0.9)');
		expect(lambdaGlow('skynet')).toContain('rgba(204,32,32,0.95)');

		const mobile = createCircuitBoard(390, 760, 'dark', mulberry32(1));
		const desktop = createCircuitBoard(1440, 900, 'dark', mulberry32(1));
		expect(mobile.mobile).toBe(true);
		expect(desktop.mobile).toBe(false);
		expect(mobile.cell).toBeGreaterThanOrEqual(100);
		expect(mobile.cell).toBeLessThan(130);
		expect(desktop.cell).toBeGreaterThanOrEqual(70);
		expect(desktop.cell).toBeLessThan(90);
		expect(mobile.sprites.length).toBeGreaterThanOrEqual(8);
		expect(mobile.sprites.length).toBeLessThanOrEqual(30);
		expect(desktop.sprites.length).toBeLessThanOrEqual(80);
		expect(desktop.sprites.length).toBeGreaterThan(mobile.sprites.length);
		expect(mobile.nodes.every((node) => node.edges.length <= 4)).toBe(true);
		expect(desktop.nodes.every((node) => node.edges.length <= 6)).toBe(true);

		for (const edge of mobile.edges) {
			for (let index = 1; index < edge.pts.length; index++) {
				const previous = edge.pts[index - 1];
				const point = edge.pts[index];
				expect(previous && point && (point.x === previous.x || point.y === previous.y)).toBe(true);
			}
		}

		const skynet = createCircuitBoard(900, 700, 'skynet', mulberry32(2));
		const skynetColors = new Set(
			(SPRITE_PALETTE_BY_THEME.skynet ?? []).map((color) => `${color.r},${color.g},${color.b}`)
		);
		const darkColors = new Set(SPRITE_COLORS.map((color) => `${color.r},${color.g},${color.b}`));
		expect(skynet.sprites.length).toBeGreaterThan(0);
		expect(
			skynet.sprites.every((sprite) =>
				skynetColors.has(`${sprite.color.r},${sprite.color.g},${sprite.color.b}`)
			)
		).toBe(true);
		expect(
			mobile.sprites.every((sprite) =>
				darkColors.has(`${sprite.color.r},${sprite.color.g},${sprite.color.b}`)
			)
		).toBe(true);
	});
});
