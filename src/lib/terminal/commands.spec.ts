import { describe, expect, it } from 'vitest';
import { identity } from '$lib/data/identity';
import { resumeData } from '$lib/data/resume-data';
import {
	commandGuide,
	commandModules,
	commandNames,
	dispatchCommand,
	helpLines,
	parseCommand
} from './commands';

const ABSENT = ['codex', 'weather', 'blackjack', 'zork', 'chat', 'contact', 'roll'];

describe('terminal commands', () => {
	it('parses a command name separately from its arguments', () => {
		expect(parseCommand('   ')).toBeNull();
		expect(parseCommand('  ReSuMe  now ')).toEqual({ name: 'resume', args: ['now'] });
	});

	it('builds help from the implemented commands', () => {
		expect(commandNames()).toEqual(['help', 'resume', 'clear']);
		const help = helpLines()
			.filter((entry) => entry.content.startsWith('  '))
			.map((entry) => entry.content);
		expect(help).toEqual(commandGuide().map((entry) => `  ${entry.command}: ${entry.summary}`));
		const text = helpLines()
			.map((entry) => entry.content)
			.join('\n')
			.toLowerCase();
		for (const name of ABSENT) expect(text).not.toContain(name);
	});

	it('prints the résumé on this site and links the current PDF', () => {
		const result = dispatchCommand('  ReSuMe  ');
		const text = result.lines.map((entry) => entry.content).join('\n');
		expect(text).toContain(resumeData.identity.title);
		expect(text).toContain(resumeData.identity.subtitle);
		expect(text).toContain(resumeData.summary.practice);
		expect(text).toContain(resumeData.experience.roles[1]?.org);
		expect(text).toContain(resumeData.education.items[0]);
		expect(text).toContain('\u03BB');
		expect(text).not.toContain(String.fromCodePoint(0x039b));
		const pdf = result.lines.find((entry) => entry.href === identity.links.resumePdf);
		const page = result.lines.find((entry) => entry.href === identity.links.resume);
		expect(pdf?.content).toContain(identity.links.resumePdf);
		expect(page?.href).toBe('/resume');
	});

	it('clears via a flag and explains an unknown command', () => {
		expect(dispatchCommand('clear')).toEqual({ lines: [], clear: true });
		expect(dispatchCommand('   ')).toEqual({ lines: [] });
		const unknown = dispatchCommand('codex --list');
		expect(unknown.clear).toBeUndefined();
		expect(unknown.lines.map((entry) => entry.content)).toEqual([
			'Command not found: codex',
			"Type 'help' for available commands."
		]);
	});

	it('offers the résumé module only while that command exists', () => {
		expect(commandModules().map((module) => module.command)).toEqual(['resume']);
	});
});
