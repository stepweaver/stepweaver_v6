import { bannerLines, dispatchCommand, PROMPT, type DispatchContext } from './commands';
import { advanceContact } from './contact-wizard';
import { runCodexCommand } from './codex';
import {
	createHistory,
	recallNewer,
	recallOlder,
	submitToHistory,
	type CommandHistory
} from './history';
import type { ContactDraft, ShellEffect, ShellMode, TerminalLine, WeatherOption } from './types';

export type SessionLine = TerminalLine & { id: string };

export type Session = {
	lines: SessionLine[];
	input: string;
	history: CommandHistory;
	seq: number;
	mode: ShellMode;
	effect: ShellEffect | null;
	contact: ContactDraft | null;
	weather: { options: WeatherOption[]; forecast: boolean } | null;
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
		effect: null,
		contact: null,
		weather: null
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
		effect: null,
		contact: session.contact,
		weather: session.weather
	};
	const echo: TerminalLine = { content: `${PROMPT} ${session.input}`, variant: 'prompt' };

	if (session.mode === 'contact' && session.contact) {
		const result = advanceContact(session.contact, session.input);
		next.contact = result.draft;
		next.mode = result.exit ? 'shell' : 'contact';
		next.effect = result.effect ?? null;
		next.lines = [...session.lines, ...stamp(next, [echo, ...result.lines])];
		return next;
	}

	if (session.mode === 'weather' && session.weather) {
		const choice = chooseWeather(session.input, session.weather);
		next.mode = choice.stay ? 'weather' : 'shell';
		next.weather = choice.stay ? session.weather : null;
		next.effect = choice.effect ?? null;
		next.lines = [...session.lines, ...stamp(next, [echo, ...choice.lines])];
		return next;
	}

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
		next.contact = null;
		next.weather = null;
		next.lines = stamp(next, bannerLines());
		return next;
	}
	next.mode = result.enter ?? 'shell';
	next.contact = result.contact ?? null;
	next.effect = result.effect ?? null;
	next.lines = [...session.lines, ...stamp(next, [echo, ...result.lines])];
	return next;
}

export function pushLines(
	session: Session,
	lines: TerminalLine[],
	patch: Partial<Pick<Session, 'mode' | 'contact' | 'weather'>> = {}
): Session {
	const next: Session = {
		...session,
		...patch,
		effect: null,
		lines: [],
		seq: session.seq
	};
	next.lines = [...session.lines, ...stamp(next, lines)];
	return next;
}

function chooseWeather(
	input: string,
	selection: { options: WeatherOption[]; forecast: boolean }
): { lines: TerminalLine[]; effect?: ShellEffect; stay: boolean } {
	const trimmed = input.trim().toLowerCase();
	if (trimmed === 'cancel' || trimmed === 'escape') {
		return { lines: [{ content: 'Selection cancelled.', variant: 'dimmed' }], stay: false };
	}
	const choice = Number(trimmed);
	if (!Number.isInteger(choice) || choice < 1 || choice > selection.options.length) {
		return {
			lines: [
				{
					content: `Choose 1-${selection.options.length}, or type cancel.`,
					variant: 'warning'
				}
			],
			stay: true
		};
	}
	const option = selection.options[choice - 1];
	if (!option) return { lines: [{ content: 'That choice is not in the list.', variant: 'error' }], stay: true };
	return {
		lines: [{ content: `Using ${option.label}`, variant: 'success' }],
		effect: { type: 'weather-at', lat: option.lat, lon: option.lon, forecast: selection.forecast },
		stay: false
	};
}

export function moveOlder(session: Session): Session {
	const recalled = recallOlder(session.history, session.input);
	return { ...session, history: recalled.history, input: recalled.value };
}

export function moveNewer(session: Session): Session {
	const recalled = recallNewer(session.history, session.input);
	return { ...session, history: recalled.history, input: recalled.value };
}
