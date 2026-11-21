export type ViewportFrame = {
	height: string;
	offset: string;
	shifted: boolean;
};

/** Fit the console shell to the visual viewport so the prompt stays above the keyboard. */
export function consoleViewportFrame(visual: {
	height: number;
	offsetTop: number;
}): ViewportFrame | null {
	if (visual.height <= 0) return null;
	return {
		height: `${visual.height}px`,
		offset: `${visual.offsetTop}px`,
		shifted: visual.offsetTop !== 0
	};
}
