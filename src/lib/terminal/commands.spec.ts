import { describe, expect, it } from 'vitest';
import { identity } from '$lib/data/identity';
import {
	evaluateKeep,
	evaluateNotation,
	formatRollResult,
	notationFromPool
} from '$lib/dice/engine';
import { resumeData } from '$lib/data/resume-data';
import {
	commandGuide,
	commandModules,
	commandNames,
	dispatchCommand,
	helpLines,
	parseCommand
} from './commands';

const ABSENT = ['carrier', 'fieldlog'];

function sequence(values: number[]) {
	const pending = [...values];
	return () => pending.shift() ?? 1;
}

describe('terminal commands', () => {
	it('parses a command name separately from its arguments', () => {
		expect(parseCommand('   ')).toBeNull();
		expect(parseCommand('  ReSuMe  now ')).toEqual({ name: 'resume', args: ['now'] });
	});

	it('builds help from the implemented commands', () => {
		expect(commandNames()).toEqual([
			'help',
			'clear',
			'resume',
			'cd',
			'codex',
			'roll',
			'weather',
			'contact',
			'chat',
			'blackjack',
			'zork',
			'cancel'
		]);
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
		const unknown = dispatchCommand('modem --list');
		expect(unknown.clear).toBeUndefined();
		expect(unknown.lines.map((entry) => entry.content)).toEqual([
			'Command not found: modem',
			"Type 'help' for available commands."
		]);
	});

	it('opens only routes this app serves', () => {
		const listed = dispatchCommand('cd')
			.lines.map((entry) => entry.content)
			.join('\n');
		expect(listed).toContain('/writing');
		expect(listed).toContain('/dice-roller');
		expect(listed).toContain('https://github.com/stepweaver');
		expect(listed).not.toContain('field-journal');

		const writing = dispatchCommand('cd codex');
		expect(writing.effect).toEqual({ type: 'navigate', href: '/writing', external: false });
		const dice = dispatchCommand('cd dice');
		expect(dice.effect).toEqual({ type: 'navigate', href: '/dice-roller', external: false });
		const missing = dispatchCommand('cd field-journal');
		expect(missing.effect).toBeUndefined();
		expect(missing.lines[0]?.content).toBe('Unknown destination: field-journal');
	});

	it('rolls v5 notation and explains an invalid roll', () => {
		const sequence = [6, 1, 4, 2, 18, 3];
		const rollDie = () => sequence.shift() ?? 1;
		const normal = dispatchCommand('roll 2d6+1', {
			rollDie,
			now: () => '2026-01-01T00:00:00.000Z'
		});
		const text = normal.lines.map((entry) => entry.content).join('\n');
		expect(text).toContain('Rolling 2d6+1:');
		expect(text).toContain('die 1: 6');
		expect(text).toContain('die 2: 1');
		expect(text).toContain('Modifier: +1');
		expect(text).toContain('Total: 8');

		const advantage = dispatchCommand('roll advantage', { rollDie });
		expect(advantage.lines[0]?.content).toBe('Advantage (2d20 keep high): rolled 4 and 2 → 4');
		expect(advantage.lines.map((entry) => entry.content).join('\n')).toContain('kept');

		const disadvantage = dispatchCommand('roll dis', { rollDie });
		expect(disadvantage.lines[0]?.content).toBe(
			'Disadvantage (2d20 keep low): rolled 18 and 3 → 3'
		);

		const invalid = dispatchCommand('roll 2d6foo');
		expect(invalid.lines[0]?.variant).toBe('error');
		expect(invalid.lines[0]?.content).toContain('not dice notation');
	});

	it('applies the same roll to a dice-page pool and the terminal command', () => {
		const notation = notationFromPool(
			[
				{ sides: 6, count: 2 },
				{ sides: 20, count: 1 }
			],
			-1
		);
		expect(notation).toBe('2d6+1d20-1');
		const stamped = '2026-01-01T00:00:00.000Z';
		const fromPool = evaluateNotation(notation, sequence([3, 6, 14]), stamped);
		const fromTerminal = dispatchCommand(`roll ${notation}`, {
			rollDie: sequence([3, 6, 14]),
			now: () => stamped
		});
		expect(fromPool.total).toBe(3 + 6 + 14 - 1);
		expect(fromTerminal.lines.map((entry) => entry.content).join('\n')).toBe(
			formatRollResult(fromPool)
		);

		const spaced = dispatchCommand('roll 2d6 + 1', {
			rollDie: sequence([4, 2]),
			now: () => stamped
		});
		const tight = evaluateNotation('2d6+1', sequence([4, 2]), stamped);
		expect(spaced.lines.map((entry) => entry.content).join('\n')).toBe(formatRollResult(tight));
		expect(tight.total).toBe(7);

		const advantage = evaluateKeep('advantage', sequence([8, 19]), stamped);
		const alias = dispatchCommand('roll adv', {
			rollDie: sequence([8, 19]),
			now: () => stamped
		});
		expect(advantage.total).toBe(19);
		expect(alias.lines.map((entry) => entry.content).join('\n')).toBe(formatRollResult(advantage));
	});

	it('offers a module only for a command that exists', () => {
		expect(commandModules().map((module) => module.command)).toEqual([
			'resume',
			'codex',
			'roll',
			'weather',
			'contact',
			'chat',
			'blackjack'
		]);
	});
});
