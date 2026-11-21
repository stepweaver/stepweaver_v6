import { describe, expect, it } from 'vitest';
import {
	DIM_CELL,
	GLITCH_INITIAL_MS,
	GLITCH_INTERVAL_MS,
	MATRIX_CELL_COUNT,
	createMatrixLink,
	glitchDelay,
	staticUnplugged,
	type MatrixScheduler,
	type MatrixSnapshot
} from './matrix-link';

type Scheduled = { kind: 'timeout' | 'interval'; ms: number };

class FakeClock {
	now = 0;
	readonly calls: Scheduled[] = [];
	private tasks: {
		id: number;
		kind: Scheduled['kind'];
		at: number;
		every: number;
		fn: () => void;
		cleared: boolean;
	}[] = [];
	private nextId = 1;

	readonly scheduler: MatrixScheduler = {
		setTimeout: (fn, ms) => this.schedule('timeout', fn, ms),
		clearTimeout: (id) => this.clear(id),
		setInterval: (fn, ms) => this.schedule('interval', fn, ms),
		clearInterval: (id) => this.clear(id)
	};

	flushNext(): boolean {
		const next = this.tasks
			.filter((task) => !task.cleared)
			.sort((a, b) => a.at - b.at || a.id - b.id)[0];
		if (!next) return false;
		this.now = next.at;
		if (next.kind === 'timeout') next.cleared = true;
		else next.at += next.every;
		next.fn();
		return true;
	}

	private schedule(kind: Scheduled['kind'], fn: () => void, ms: number) {
		this.calls.push({ kind, ms });
		const id = this.nextId++;
		this.tasks.push({
			id,
			kind,
			at: this.now + ms,
			every: kind === 'interval' ? ms : 0,
			fn,
			cleared: false
		});
		return id;
	}

	private clear(id: number) {
		const task = this.tasks.find((item) => item.id === id);
		if (task) task.cleared = true;
	}
}

function compress(frames: MatrixSnapshot[]) {
	const steps: MatrixSnapshot[] = [];
	for (const frame of frames) {
		const previous = steps[steps.length - 1];
		if (
			previous &&
			previous.phase === frame.phase &&
			previous.status === frame.status &&
			previous.showPrompt === frame.showPrompt &&
			previous.attempt === frame.attempt
		) {
			continue;
		}
		steps.push(frame);
	}
	return steps;
}

describe('matrix link', () => {
	it('shows a static unplugged panel before the loop starts', () => {
		const frame = staticUnplugged();
		expect(frame).toEqual({
			phase: 'unplugged',
			status: 'USR UNPLUGGED',
			cells: Array.from({ length: MATRIX_CELL_COUNT }, () => DIM_CELL),
			showPrompt: false,
			attempt: 1
		});
	});

	it('keeps the v5 phase order, holds, scramble counts, and attempt counter', () => {
		const clock = new FakeClock();
		const frames: MatrixSnapshot[] = [];
		const link = createMatrixLink({
			random: () => 0,
			scheduler: clock.scheduler,
			onChange: (frame) => frames.push(frame)
		});

		link.start();
		let guard = 0;
		while (frames.filter((frame) => frame.phase === 'init').length < 2 && guard < 500) {
			expect(clock.flushNext()).toBe(true);
			guard += 1;
		}

		const steps = compress(frames);
		expect(
			steps.slice(0, 10).map((frame) => ({
				phase: frame.phase,
				status: frame.status,
				showPrompt: frame.showPrompt,
				attempt: frame.attempt
			}))
		).toEqual([
			{ phase: 'init', status: 'INIT UPLINK', showPrompt: false, attempt: 1 },
			{ phase: 'scan', status: 'SCANNING CONSTRUCT', showPrompt: false, attempt: 1 },
			{ phase: 'trace', status: 'TRACE 0x000000', showPrompt: false, attempt: 1 },
			{ phase: 'lock', status: 'SIGNAL LOCK', showPrompt: false, attempt: 1 },
			{ phase: 'fail', status: 'HANDSHAKE FAIL', showPrompt: false, attempt: 1 },
			{ phase: 'lost', status: 'CARRIER LOST', showPrompt: false, attempt: 1 },
			{ phase: 'unplugged', status: 'USR UNPLUGGED', showPrompt: false, attempt: 1 },
			{ phase: 'idle', status: '', showPrompt: true, attempt: 1 },
			{ phase: 'idle', status: '', showPrompt: false, attempt: 1 },
			{ phase: 'init', status: 'INIT UPLINK', showPrompt: false, attempt: 2 }
		]);

		expect(frames.filter((frame) => frame.phase === 'scan')).toHaveLength(9);
		expect(frames.filter((frame) => frame.phase === 'trace')).toHaveLength(6);
		expect(frames.filter((frame) => frame.phase === 'fail')).toHaveLength(13);
		expect(frames.find((frame) => frame.phase === 'lost')?.cells).toEqual([
			DIM_CELL,
			DIM_CELL,
			DIM_CELL,
			DIM_CELL,
			DIM_CELL,
			DIM_CELL
		]);
		expect(frames.every((frame) => frame.cells.length === MATRIX_CELL_COUNT)).toBe(true);
		expect(clock.calls.slice(0, 13)).toEqual([
			{ kind: 'timeout', ms: 900 },
			{ kind: 'interval', ms: 150 },
			{ kind: 'timeout', ms: 400 },
			{ kind: 'interval', ms: 120 },
			{ kind: 'timeout', ms: 600 },
			{ kind: 'timeout', ms: 500 },
			{ kind: 'interval', ms: 100 },
			{ kind: 'timeout', ms: 500 },
			{ kind: 'timeout', ms: 1000 },
			{ kind: 'timeout', ms: 1500 },
			{ kind: 'timeout', ms: 2000 },
			{ kind: 'timeout', ms: 400 },
			{ kind: 'timeout', ms: 900 }
		]);
	});

	it('pads the visible counter and wraps after attempt 97', () => {
		const clock = new FakeClock();
		const frames: MatrixSnapshot[] = [];
		const link = createMatrixLink({
			random: () => 0,
			scheduler: clock.scheduler,
			onChange: (frame) => frames.push(frame)
		});
		link.start();
		let guard = 0;
		while (frames.filter((frame) => frame.phase === 'init').length < 98 && guard < 20000) {
			if (!clock.flushNext()) break;
			guard += 1;
		}
		const attempts = frames.filter((frame) => frame.phase === 'init').map((frame) => frame.attempt);
		expect(attempts).toEqual([...Array.from({ length: 97 }, (_, index) => index + 1), 1]);
		expect(String(attempts[0]).padStart(2, '0')).toBe('01');
		expect(String(attempts[96]).padStart(2, '0')).toBe('97');
	});

	it('clears the loop timers on stop', () => {
		const clock = new FakeClock();
		const frames: MatrixSnapshot[] = [];
		const link = createMatrixLink({
			random: () => 0,
			scheduler: clock.scheduler,
			onChange: (frame) => frames.push(frame)
		});
		link.start();
		expect(clock.flushNext()).toBe(true);
		const count = frames.length;
		link.stop();
		expect(clock.flushNext()).toBe(false);
		expect(frames).toHaveLength(count);
	});

	it('varies the lambda glitch around the v5 interval', () => {
		expect(glitchDelay(GLITCH_INITIAL_MS, () => 0)).toBe(700);
		expect(glitchDelay(GLITCH_INITIAL_MS, () => 0.5)).toBe(1000);
		expect(glitchDelay(GLITCH_INTERVAL_MS, () => 0)).toBe(3500);
		expect(glitchDelay(GLITCH_INTERVAL_MS, () => 0.5)).toBe(5000);
	});
});
