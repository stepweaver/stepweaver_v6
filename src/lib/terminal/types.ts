export type LineVariant =
	'default' | 'prompt' | 'lambda' | 'success' | 'error' | 'warning' | 'dimmed';

export type TerminalLine = {
	content: string;
	variant: LineVariant;
	href?: string;
};

export type WeatherOption = { lat: number; lon: number; label: string };

export type ContactDraft = {
	step: 'name' | 'email' | 'intent' | 'message' | 'confirm';
	name: string;
	email: string;
	intent: 'consult' | 'hire' | 'general' | '';
	message: string;
	openedAt: number;
};

export type ShellEffect =
	| { type: 'navigate'; href: string; external: boolean }
	| { type: 'weather'; query: string; forecast: boolean }
	| { type: 'geo-weather'; forecast: boolean }
	| { type: 'weather-at'; lat: number; lon: number; forecast: boolean; note?: string }
	| { type: 'contact-send'; draft: ContactDraft }
	| { type: 'chat'; message: string };

export type ShellMode = 'shell' | 'codex' | 'contact' | 'weather';
