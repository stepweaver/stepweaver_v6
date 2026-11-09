import {
	APPEARANCE_STORAGE_KEY,
	COLOR_SCHEME_STORAGE_KEY,
	isLightAppearance,
	isThemeId,
	type ThemeId
} from './themes';

export function readStoredTheme(): ThemeId | null {
	if (typeof localStorage === 'undefined') return null;
	try {
		const appearance = localStorage.getItem(APPEARANCE_STORAGE_KEY);
		if (isThemeId(appearance)) return appearance;
		const scheme = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
		if (isThemeId(scheme)) return scheme;
	} catch {
		return null;
	}
	return null;
}

export function applyTheme(theme: ThemeId): void {
	document.documentElement.setAttribute('data-theme', theme);
	try {
		localStorage.setItem(APPEARANCE_STORAGE_KEY, theme);
		if (theme === 'light' || theme === 'dark') {
			localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, theme);
		}
	} catch {
		/* Storage can be blocked. The attribute still updates this visit. */
	}
}

export function currentTheme(): ThemeId {
	const attr = document.documentElement.getAttribute('data-theme');
	if (isThemeId(attr)) return attr;
	const stored = readStoredTheme();
	if (stored) return stored;
	return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function toggleLightDark(theme: ThemeId): ThemeId {
	return isLightAppearance(theme) ? 'dark' : 'light';
}
