export type ColorScheme = 'light' | 'dark';

export type NoveltyThemeId =
	| 'monochrome'
	| 'monochrome-inverted'
	| 'vintage'
	| 'apple'
	| 'c64'
	| 'amber'
	| 'synthwave'
	| 'dracula'
	| 'solarized'
	| 'nord'
	| 'cobalt'
	| 'skynet';

export type ThemeId = ColorScheme | NoveltyThemeId;

export const THEME_IDS: ThemeId[] = [
	'dark',
	'light',
	'monochrome',
	'monochrome-inverted',
	'vintage',
	'apple',
	'c64',
	'amber',
	'synthwave',
	'dracula',
	'solarized',
	'nord',
	'cobalt',
	'skynet'
];

const LIGHT_APPEARANCES = new Set<ThemeId>(['light', 'monochrome-inverted', 'apple', 'solarized']);

export const APPEARANCE_STORAGE_KEY = 'stepweaver-appearance';
export const COLOR_SCHEME_STORAGE_KEY = 'stepweaver-color-scheme';

export function isThemeId(value: string | null | undefined): value is ThemeId {
	return !!value && (THEME_IDS as readonly string[]).includes(value);
}

export function isLightAppearance(value: ThemeId): boolean {
	return LIGHT_APPEARANCES.has(value);
}
