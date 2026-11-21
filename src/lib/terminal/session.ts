import { PROMPT, bannerLines, dispatchCommand, type TerminalLine } from './commands';
import {
	createHistory,
	recallNewer,
	recallOlder,
	submitToHistory,
	type CommandHistory
} from './history';

export type SessionLine = TerminalLine & { id: string };

export type Session = {
	lines: SessionLine[];
	input: string;
	history: CommandHistory;
	seq: number;
};

function stamp(session: Session, lines: TerminalLine[]): SessionLine[] {
	return lines.map((entry) => {
		session.seq += 1;
		return { ...entry, id: `line-${session.seq}` };
	});
}

export function createSession(): Session {
	const session: Session = { lines: [], input: '', history: createHistory(), seq: 0 };
	session.lines = stamp(session, bannerLines());
	return session;
}

export function replaceInput(session: Session, input: string): Session {
	return { ...session, input };
}

export function submitLine(session: Session): Session {
	const next: Session = {
		lines: [],
		input: '',
		history: submitToHistory(session.history, session.input),
		seq: session.seq
	};
	const result = dispatchCommand(session.input);
	if (result.clear) {
		next.lines = stamp(next, bannerLines());
		return next;
	}
	const echo: TerminalLine = { content: `${PROMPT} ${session.input}`, variant: 'prompt' };
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
