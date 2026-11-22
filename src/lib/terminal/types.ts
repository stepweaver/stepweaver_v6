export type LineVariant =
	'default' | 'prompt' | 'lambda' | 'success' | 'error' | 'warning' | 'dimmed';

export type TerminalLine = {
	content: string;
	variant: LineVariant;
	href?: string;
};

export type ShellEffect = {
	type: 'navigate';
	href: string;
	external: boolean;
};

export type ShellMode = 'shell' | 'codex';
