import { COLOR_PALETTES, GLOW_FILTERS } from '$lib/effects/background-constants';
import { clampProgress } from '$lib/effects/document-scroll';
import type { ThemeId } from '$lib/theme/themes';

export const LAMBDA_DESKTOP_MIN = 768;

export type LambdaPlacement = {
	scale: number;
	translateX: number;
	translateY: number;
	transform: string;
};

export type LambdaColor = {
	r: number;
	g: number;
	b: number;
	key: string;
};

export function isMobileLambda(viewportWidth: number): boolean {
	return viewportWidth < LAMBDA_DESKTOP_MIN;
}

/** Scale, then translateX, then translateY. Matches the v5 transform string. */
export function lambdaPlacement(progress: number, viewportWidth: number): LambdaPlacement {
	const p = clampProgress(progress);
	const mobile = isMobileLambda(viewportWidth);
	const scale = mobile ? 0.9 - p * 0.4 : 1.4 - p * 0.8;
	const translateX = mobile ? -30 - p * 20 : 4 + p * 22;
	const translateY = mobile ? 2 : 5;
	return {
		scale,
		translateX,
		translateY,
		transform: `scale(${scale}) translateX(${translateX}%) translateY(${translateY}%)`
	};
}

export function paletteColor(progress: number, theme: ThemeId): LambdaColor {
	const colors = COLOR_PALETTES[theme] ?? COLOR_PALETTES.dark;
	const p = clampProgress(progress);
	const colorProgress = p * (colors.length - 1);
	const colorIndex = Math.floor(colorProgress);
	const nextColorIndex = Math.min(colorIndex + 1, colors.length - 1);
	const blend = colorProgress - colorIndex;
	const current = colors[colorIndex] ?? colors[0] ?? [0, 255, 0];
	const next = colors[nextColorIndex] ?? current;
	const r = Math.round((current[0] ?? 0) * (1 - blend) + (next[0] ?? 0) * blend);
	const g = Math.round((current[1] ?? 0) * (1 - blend) + (next[1] ?? 0) * blend);
	const b = Math.round((current[2] ?? 0) * (1 - blend) + (next[2] ?? 0) * blend);
	return { r, g, b, key: `${r},${g},${b}` };
}

export function isLightishTheme(theme: ThemeId): boolean {
	return theme === 'light' || theme === 'monochrome-inverted';
}

export function circuitOpacity(theme: ThemeId): number {
	if (isLightishTheme(theme)) return 0.2;
	if (theme === 'skynet') return 0.48;
	return 0.4;
}

export function lambdaOpacity(theme: ThemeId): number {
	if (isLightishTheme(theme)) return 0.2;
	if (theme === 'skynet') return 0.34;
	return 0.3;
}

export function circuitDim(theme: ThemeId): number {
	return isLightishTheme(theme) ? 0.3 : 1;
}

export function lambdaGlow(theme: ThemeId): string {
	return GLOW_FILTERS[theme] ?? GLOW_FILTERS.dark;
}
