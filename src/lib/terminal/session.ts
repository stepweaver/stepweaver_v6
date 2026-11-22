import { bannerLines, dispatchCommand, PROMPT, type DispatchContext } from './commands';
import { runCodexCommand } from './codex';
import {
	createHistory,
	recallNewer,
	recallOlder,
	submitToHistory,
	type CommandHistory
} from './history';
import type { ShellEffect, ShellMode, TerminalLine } from './types';

export type SessionLine = TerminalLine & { id: string };

export type Session = {
	lines: SessionLine[];
	input: string;
	history: CommandHistory;
	seq: number;
	mode: ShellMode;
	effect: ShellEffect | null;
};

function stamp(session: Session, lines: TerminalLine[]): SessionLine[] {
	return lines.map((entry) => {
		session.seq += 1;
		return { ...entry, id: `line-${session.seq}` };
	});
}

function codexBanner(): TerminalLine[] {
	return [
		...bannerLines(),
		{ content: '[codex]', variant: 'dimmed' },
		{ content: '', variant: 'default' }
	];
}

export function createSession(): Session {
	const session: Session = {
		lines: [],
		input: '',
		history: createHistory(),
		seq: 0,
		mode: 'shell',
		effect: null
	};
	session.lines = stamp(session, bannerLines());
	return session;
}

export function replaceInput(session: Session, input: string): Session {
	return { ...session, input };
}

export function submitLine(session: Session, context: DispatchContext = {}): Session {
	const next: Session = {
		lines: [],
		input: '',
		history: submitToHistory(session.history, session.input),
		seq: session.seq,
		mode: session.mode,
		effect: null
	};
	const echo: TerminalLine = { content: `${PROMPT} ${session.input}`, variant: 'prompt' };

	if (session.mode === 'codex') {
		const result = runCodexCommand(
			session.input,
			context.library ?? { status: 'unconfigured', posts: [] }
		);
		if (result.clear) {
			next.lines = stamp(next, codexBanner());
			return next;
		}
		next.mode = result.exit ? 'shell' : 'codex';
		next.lines = [...session.lines, ...stamp(next, [echo, ...result.lines])];
		return next;
	}

	const result = dispatchCommand(session.input, context);
	if (result.clear) {
		next.mode = 'shell';
		next.lines = stamp(next, bannerLines());
		return next;
	}
	next.mode = result.enter ?? 'shell';
	next.effect = result.effect ?? null;
	next.lines = [...session.lines, ...stamp(next, [echo, ...result.lines])];
	return next;
}

export function moveOlder(session: Session): Session {
	const recalled = recallOlder(session.history, session.input);
	return { ...session, history: recalled.history, input: recalled.value };
}

export function moveNewer(session: Session): Session {
	const recalled = recallNewer(session.history, session.input);
	return { ...session, history: recalled.history, input: recalled.value };
}
