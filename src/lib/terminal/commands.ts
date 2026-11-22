import { identity } from '$lib/data/identity';
import { resumeData } from '$lib/data/resume-data';
import {
	evaluateKeep,
	evaluateNotation,
	formatRollResult,
	rollDie,
	type DieSource
} from '$lib/dice/engine';
import { codexOpening, type CodexLibrary } from './codex';
import { destinationNames, resolveDestination } from './routes';
import type { ShellEffect, TerminalLine } from './types';

export const SHELL_HOST = 'user@stepweaver.dev';
export const PROMPT = `${SHELL_HOST}:~$`;

export type { LineVariant, ShellEffect, ShellMode, TerminalLine } from './types';

export type CommandResult = {
	lines: TerminalLine[];
	clear?: boolean;
	enter?: 'codex';
	effect?: ShellEffect;
};

export type CommandGuideEntry = {
	command: string;
	summary: string;
};

export type CommandModule = {
	title: string;
	tag: string;
	body: string;
	command: string;
};

export type DispatchContext = {
	library?: CodexLibrary;
	rollDie?: DieSource;
	now?: () => string;
};

type CommandSpec = {
	name: string;
	usage: string;
	summary: string;
	run: (_args: string[], _context: DispatchContext) => CommandResult;
};

const MODULES: readonly CommandModule[] = [
	{
		title: 'Resume',
		tag: 'MOD-01',
		body: 'Experience, education, and skills from the résumé on this site, with the current PDF.',
		command: 'resume'
	},
	{
		title: 'Codex',
		tag: 'MOD-02',
		body: 'Browse the published writing on this site. ls lists posts, cat opens one, grep filters by tag.',
		command: 'codex'
	},
	{
		title: 'Dice',
		tag: 'MOD-03',
		body: 'Roll notation, advantage, and disadvantage. The same engine runs on /dice-roller.',
		command: 'roll'
	}
];

function line(
	content: string,
	variant: TerminalLine['variant'] = 'default',
	href?: string
): TerminalLine {
	return href ? { content, variant, href } : { content, variant };
}

function resumeLines(): TerminalLine[] {
	const lines: TerminalLine[] = [
		line(`${resumeData.identity.title} / RESUME`, 'success'),
		line(resumeData.identity.subtitle, 'lambda'),
		line(`${identity.location} · ${identity.email}`, 'dimmed'),
		line(''),
		line(`Current PDF: ${identity.links.resumePdf}`, 'success', identity.links.resumePdf),
		line(`Resume page: ${identity.links.resume}`, 'dimmed', identity.links.resume),
		line(''),
		line(resumeData.summary.title, 'lambda'),
		line(resumeData.summary.practice),
		...resumeData.summary.body.map((item) => line(item, 'dimmed')),
		line(''),
		line(resumeData.skills.title, 'lambda')
	];

	for (const group of resumeData.skills.groups) {
		lines.push(line(`${group.label}: ${group.items.join(', ')}`));
	}

	lines.push(line(''));
	lines.push(line(resumeData.experience.title, 'lambda'));
	for (const role of resumeData.experience.roles) {
		lines.push(line(`${role.role}, ${role.org}`, 'success'));
		lines.push(line(role.when, 'dimmed'));
		for (const bullet of role.bullets) lines.push(line(`  · ${bullet}`));
		lines.push(line(''));
	}

	lines.push(line(resumeData.education.title, 'lambda'));
	for (const item of resumeData.education.items) lines.push(line(`  · ${item}`));
	return lines;
}

function cdLines(args: string[]): CommandResult {
	const dest = args[0]?.toLowerCase();
	if (!dest) {
		return {
			lines: [
				line('Usage: cd <place>', 'warning'),
				...destinationNames().map((name) => {
					const place = resolveDestination(name);
					return line(`  ${name}: ${place?.href ?? ''}`, 'dimmed');
				})
			]
		};
	}
	const target = resolveDestination(dest);
	if (!target) {
		return {
			lines: [
				line(`Unknown destination: ${dest}`, 'error'),
				line(`Places: ${destinationNames().join(', ')}`, 'dimmed')
			]
		};
	}
	return {
		lines: [
			line(
				target.external
					? `Opening ${target.name}: ${target.href}`
					: `Navigating to ${target.name}...`,
				'success',
				target.href
			)
		],
		effect: { type: 'navigate', href: target.href, external: target.external }
	};
}

function rollLines(args: string[], context: DispatchContext): CommandResult {
	const raw = args.join(' ').trim();
	if (!raw) {
		return {
			lines: [
				line('Usage: roll <notation>. Examples: 3d6+2, 1d20, advantage, disadvantage.', 'warning')
			]
		};
	}
	const source = context.rollDie ?? ((sides: number) => rollDie(sides));
	const timestamp = context.now?.() ?? new Date().toISOString();
	const lower = raw.toLowerCase();
	try {
		const result =
			lower === 'advantage' || lower === 'adv'
				? evaluateKeep('advantage', source, timestamp)
				: lower === 'disadvantage' || lower === 'dis'
					? evaluateKeep('disadvantage', source, timestamp)
					: evaluateNotation(raw, source, timestamp);
		return {
			lines: formatRollResult(result)
				.split('\n')
				.map((content, index) => line(content, index === 0 ? 'success' : 'lambda'))
		};
	} catch (error) {
		return {
			lines: [line(error instanceof Error ? error.message : 'Roll failed', 'error')]
		};
	}
}

const COMMANDS: readonly CommandSpec[] = [
	{
		name: 'help',
		usage: 'help',
		summary: 'Show commands',
		run: () => ({ lines: helpLines() })
	},
	{
		name: 'clear',
		usage: 'clear',
		summary: 'Clear screen',
		run: () => ({ lines: [], clear: true })
	},
	{
		name: 'resume',
		usage: 'resume',
		summary: 'View experience',
		run: () => ({ lines: resumeLines() })
	},
	{
		name: 'cd',
		usage: 'cd <place>',
		summary: 'Open a listed page',
		run: (args) => cdLines(args)
	},
	{
		name: 'codex',
		usage: 'codex',
		summary: 'Browse published writing',
		run: (_args, context) => ({
			enter: 'codex',
			lines: codexOpening(context.library ?? { status: 'unconfigured', posts: [] })
		})
	},
	{
		name: 'roll',
		usage: 'roll <notation>',
		summary: 'Roll dice',
		run: (args, context) => rollLines(args, context)
	},
	{
		name: 'cancel',
		usage: 'cancel',
		summary: 'Leave the current mode',
		run: () => ({
			lines: [line('At the main shell, nothing to cancel.', 'dimmed')]
		})
	}
];

export function commandNames(): string[] {
	return COMMANDS.map((command) => command.name);
}

export function commandGuide(): CommandGuideEntry[] {
	return COMMANDS.map((command) => ({ command: command.usage, summary: command.summary }));
}

export function commandModules(): CommandModule[] {
	const names = new Set(commandNames());
	return MODULES.filter((module) => names.has(module.command));
}

export function helpLines(): TerminalLine[] {
	return [
		line('Available commands:', 'success'),
		line(''),
		...commandGuide().map((entry) => line(`  ${entry.command}: ${entry.summary}`)),
		line(''),
		line('Type a command and press Enter.', 'dimmed')
	];
}

export function bannerLines(): TerminalLine[] {
	return [
		line('stepweaver.dev terminal', 'success'),
		line('Type "help" for available commands.', 'dimmed'),
		line('')
	];
}

export function parseCommand(input: string): { name: string; args: string[] } | null {
	const parts = input.trim().split(/\s+/).filter(Boolean);
	const name = parts[0]?.toLowerCase();
	if (!name) return null;
	return { name, args: parts.slice(1) };
}

export function dispatchCommand(input: string, context: DispatchContext = {}): CommandResult {
	const parsed = parseCommand(input);
	if (!parsed) return { lines: [] };
	const command = COMMANDS.find((entry) => entry.name === parsed.name);
	if (!command) {
		return {
			lines: [
				line(`Command not found: ${parsed.name}`, 'error'),
				line("Type 'help' for available commands.", 'dimmed')
			]
		};
	}
	return command.run(parsed.args, context);
}
