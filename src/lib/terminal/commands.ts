import { identity } from '$lib/data/identity';
import { resumeData } from '$lib/data/resume-data';

export const SHELL_HOST = 'user@stepweaver.dev';
export const PROMPT = `${SHELL_HOST}:~$`;

export type LineVariant =
	'default' | 'prompt' | 'lambda' | 'success' | 'error' | 'warning' | 'dimmed';

export type TerminalLine = {
	content: string;
	variant: LineVariant;
	href?: string;
};

export type CommandResult = {
	lines: TerminalLine[];
	clear?: boolean;
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

type CommandSpec = {
	name: string;
	usage: string;
	summary: string;
	run: (_args: string[]) => CommandResult;
};

const MODULES: readonly CommandModule[] = [
	{
		title: 'Resume',
		tag: 'MOD-01',
		body: 'Experience, education, and skills from the résumé on this site, with the current PDF.',
		command: 'resume'
	}
];

function line(content: string, variant: LineVariant = 'default', href?: string): TerminalLine {
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

const COMMANDS: readonly CommandSpec[] = [
	{
		name: 'help',
		usage: 'help',
		summary: 'Show commands',
		run: () => ({ lines: helpLines() })
	},
	{
		name: 'resume',
		usage: 'resume',
		summary: 'View experience',
		run: () => ({ lines: resumeLines() })
	},
	{
		name: 'clear',
		usage: 'clear',
		summary: 'Clear screen',
		run: () => ({ lines: [], clear: true })
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

export function dispatchCommand(input: string): CommandResult {
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
	return command.run(parsed.args);
}
