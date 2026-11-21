import { LAMBDA } from '$lib/text/lambda';

export { LAMBDA };

export const MATRIX_GLYPHS = [
	'ﾊ',
	'ﾐ',
	'ﾋ',
	'ｰ',
	'ｳ',
	'ｼ',
	'ﾅ',
	'ﾓ',
	'ﾆ',
	'ｻ',
	'ﾜ',
	'ﾂ',
	'ｵ',
	'ﾘ',
	'ｱ',
	'ﾎ',
	'ﾃ',
	'ﾏ',
	'ｹ',
	'ﾒ',
	'ｴ',
	'ｶ',
	'ｷ',
	'ﾑ',
	'ﾕ',
	'ﾗ',
	'ｾ',
	'ﾈ',
	'ｽ',
	'ﾀ'
] as const;

export const MATRIX_CELL_COUNT = 6;
export const DIM_CELL = '··';
export const GLITCH_INITIAL_MS = 1000;
export const GLITCH_INTERVAL_MS = 5000;
export const GLITCH_DURATION_MS = 300;

export type MatrixPhase =
	'idle' | 'init' | 'scan' | 'trace' | 'lock' | 'fail' | 'lost' | 'unplugged';

export type MatrixSnapshot = {
	phase: MatrixPhase;
	status: string;
	cells: string[];
	showPrompt: boolean;
	attempt: number;
};

export type MatrixScheduler = {
	setTimeout: (fn: () => void, ms: number) => number;
	clearTimeout: (id: number) => void;
	setInterval: (fn: () => void, ms: number) => number;
	clearInterval: (id: number) => void;
};

type MatrixLinkOptions = {
	glyphs?: readonly string[];
	cellCount?: number;
	random?: () => number;
	scheduler?: MatrixScheduler;
	onChange?: (snapshot: MatrixSnapshot) => void;
};

const browserScheduler: MatrixScheduler = {
	setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms) as unknown as number,
	clearTimeout: (id) => globalThis.clearTimeout(id),
	setInterval: (fn, ms) => globalThis.setInterval(fn, ms) as unknown as number,
	clearInterval: (id) => globalThis.clearInterval(id)
};

export function glitchDelay(base: number, random: () => number = Math.random): number {
	const variance = base * 0.3;
	return base + (random() * variance * 2 - variance);
}

export function staticUnplugged(cellCount = MATRIX_CELL_COUNT): MatrixSnapshot {
	return {
		phase: 'unplugged',
		status: 'USR UNPLUGGED',
		cells: Array.from({ length: cellCount }, () => DIM_CELL),
		showPrompt: false,
		attempt: 1
	};
}

export function createMatrixLink({
	glyphs = MATRIX_GLYPHS,
	cellCount = MATRIX_CELL_COUNT,
	random = Math.random,
	scheduler = browserScheduler,
	onChange
}: MatrixLinkOptions = {}) {
	const alphabet = glyphs.length ? glyphs : MATRIX_GLYPHS;
	let running = false;
	let timeoutId = 0;
	let intervalId = 0;
	let step = 0;
	let currentAttempt = 1;
	let phase: MatrixPhase = 'unplugged';
	let status = 'USR UNPLUGGED';
	let cells = Array.from({ length: cellCount }, () => DIM_CELL);
	let showPrompt = false;
	let attempt = 1;

	const emit = () => {
		onChange?.({
			phase,
			status,
			cells: cells.slice(),
			showPrompt,
			attempt
		});
	};

	const clearTick = () => {
		if (!timeoutId) return;
		scheduler.clearTimeout(timeoutId);
		timeoutId = 0;
	};

	const clearScramble = () => {
		if (!intervalId) return;
		scheduler.clearInterval(intervalId);
		intervalId = 0;
	};

	const stop = () => {
		running = false;
		clearTick();
		clearScramble();
	};

	const delay = (base: number, variance: number) => base + random() * variance;

	const later = (ms: number, fn: () => void) => {
		clearTick();
		timeoutId = scheduler.setTimeout(() => {
			timeoutId = 0;
			if (!running) return;
			fn();
		}, ms);
	};

	const glyph = () => alphabet[Math.floor(random() * alphabet.length)] ?? alphabet[0] ?? '·';

	const createCells = () => Array.from({ length: cellCount }, () => `${glyph()}${glyph()}`);

	const hex = (length: number) =>
		Array.from({ length }, () => Math.floor(random() * 16).toString(16)).join('');

	const scramble = (cycles: number, interval: number, onDone: () => void) => {
		let count = 0;
		clearScramble();
		intervalId = scheduler.setInterval(() => {
			if (!running) return;
			cells = createCells();
			emit();
			count += 1;
			if (count >= cycles) {
				clearScramble();
				onDone();
			}
		}, interval);
	};

	const run = () => {
		if (!running) return;
		step += 1;

		if (step === 1) {
			phase = 'init';
			status = 'INIT UPLINK';
			attempt = currentAttempt;
			showPrompt = false;
			emit();
			later(delay(900, 300), run);
		} else if (step === 2) {
			phase = 'scan';
			status = 'SCANNING CONSTRUCT';
			emit();
			scramble(8, 150, () => later(delay(400, 200), run));
		} else if (step === 3) {
			phase = 'trace';
			status = `TRACE 0x${hex(6)}`;
			emit();
			scramble(5, 120, () => later(delay(600, 200), run));
		} else if (step === 4) {
			phase = 'lock';
			status = 'SIGNAL LOCK';
			emit();
			later(delay(500, 200), run);
		} else if (step === 5) {
			phase = 'fail';
			status = 'HANDSHAKE FAIL';
			emit();
			scramble(12, 100, () => later(delay(500, 200), run));
		} else if (step === 6) {
			phase = 'lost';
			status = 'CARRIER LOST';
			cells = Array.from({ length: cellCount }, () => DIM_CELL);
			emit();
			later(delay(1000, 400), run);
		} else if (step === 7) {
			phase = 'unplugged';
			status = 'USR UNPLUGGED';
			emit();
			later(delay(1500, 500), run);
		} else if (step === 8) {
			phase = 'idle';
			status = '';
			showPrompt = true;
			emit();
			later(delay(2000, 800), run);
		} else {
			showPrompt = false;
			status = '';
			cells = createCells();
			currentAttempt = currentAttempt >= 97 ? 1 : currentAttempt + 1;
			step = 0;
			emit();
			later(delay(400, 200), run);
		}
	};

	const start = () => {
		stop();
		running = true;
		step = 0;
		currentAttempt = 1;
		cells = createCells();
		run();
	};

	return {
		start,
		stop,
		snapshot: (): MatrixSnapshot => ({ phase, status, cells: cells.slice(), showPrompt, attempt })
	};
}
