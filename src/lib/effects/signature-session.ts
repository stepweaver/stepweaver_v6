import { createCircuitBoard, type CircuitBoard, type Rng } from '$lib/effects/circuit-board';
import { clampProgress } from '$lib/effects/document-scroll';
import type { ThemeId } from '$lib/theme/themes';

export type ViewportEvent =
	| { type: 'scroll'; progress: number }
	| { type: 'resize'; width: number; height: number; progress: number };

/**
 * Scroll updates the lambda progress only.
 * Any resize, including a height-only change, deals a new circuit and new packet edges.
 */
export function createSignatureSession(random: Rng = Math.random) {
	let theme: ThemeId = 'dark';
	let progress = 0;
	let width = 0;
	let height = 0;
	let generation = 0;
	let board: CircuitBoard | null = null;

	return {
		get theme() {
			return theme;
		},
		get progress() {
			return progress;
		},
		get width() {
			return width;
		},
		get height() {
			return height;
		},
		get generation() {
			return generation;
		},
		get board() {
			return board;
		},
		setTheme(next: ThemeId) {
			theme = next;
		},
		apply(event: ViewportEvent) {
			if (event.type === 'scroll') {
				progress = clampProgress(event.progress);
				return 'scroll' as const;
			}
			width = event.width;
			height = event.height;
			progress = clampProgress(event.progress);
			generation += 1;
			board = createCircuitBoard(width, height, theme, random);
			return 'resize' as const;
		}
	};
}

export type SignatureSession = ReturnType<typeof createSignatureSession>;
