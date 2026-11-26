import { describe, expect, it } from 'vitest';
import { freshTable, openBlackjack, playBlackjack } from './blackjack';
import {
	ADVENTURE_SAVE_KEY,
	adventureWorldIssues,
	createAdventure,
	loadAdventure,
	openingAdventure,
	runAdventure,
	type AdventureState,
	type AdventureStorage
} from './adventure';
import { cancelMode, createSession, replaceInput, submitLine } from '$lib/terminal/session';

function memoryStorage(): AdventureStorage & { raw: string | null } {
	const store: { raw: string | null } = { raw: null };
	return {
		get raw() {
			return store.raw;
		},
		set raw(value: string | null) {
			store.raw = value;
		},
		getItem(key: string) {
			return key === ADVENTURE_SAVE_KEY ? store.raw : null;
		},
		setItem(key: string, value: string) {
			if (key === ADVENTURE_SAVE_KEY) store.raw = value;
		}
	};
}

function play(inputs: string[], state = createAdventure()) {
	let current = state;
	const text: string[] = [];
	for (const input of inputs) {
		const result = runAdventure(current, input);
		current = result.state;
		text.push(...result.lines.map((line) => line.text));
		if (current.gameOver) break;
	}
	return { state: current, text: text.join('\n') };
}

const WIN = [
	'n',
	'e',
	'open window',
	'in',
	'take lantern',
	'move rug',
	'open trap door',
	'turn on lantern',
	'down',
	'north',
	'north',
	'sw',
	'west',
	'move debris',
	'take prism',
	'east',
	'ne',
	'south',
	'south',
	'up',
	'west'
];

describe('blackjack', () => {
	it('keeps the score and accepts the short commands', () => {
		const random = () => 0;
		const opened = openBlackjack(freshTable(), random);
		expect(opened.lines.map((line) => line.content).join('\n')).toContain(
			'Blackjack: dealer stands on 17.'
		);
		const stood = opened.state.over ? opened : playBlackjack(opened.state, 's', random);
		expect(
			[...opened.lines, ...stood.lines].some((line) => line.content.startsWith('Score: W:'))
		).toBe(true);
		const again = openBlackjack(stood.state, random);
		expect(again.state.wins + again.state.losses + again.state.ties).toBe(1);
		const help = playBlackjack(again.state, '?', random);
		expect(help.lines.map((line) => line.content)).toContain('hit: draw a card');
		const left = playBlackjack(help.state, 'h', random);
		const exited = playBlackjack(left.state.over ? left.state : left.state, 'quit', random);
		expect(exited.exit).toBe(true);
		expect(exited.lines[0]?.content).toBe('Left blackjack.');
	});

	it('keeps the score when blackjack is left and reopened', () => {
		let session = submitLine(replaceInput(createSession(), 'bj'), { random: () => 0 });
		session = submitLine(replaceInput(session, 'stand'), { random: () => 0 });
		expect(session.lines.some((line) => /^Score: W:\d+ L:\d+ T:\d+$/.test(line.content))).toBe(
			true
		);
		session = submitLine(replaceInput(session, 'exit'));
		expect(session.mode).toBe('shell');
		session = submitLine(replaceInput(session, 'blackjack'), { random: () => 0 });
		session = submitLine(replaceInput(session, 's'), { random: () => 0 });
		const scores = session.lines
			.map((line) => line.content)
			.filter((content) => content.startsWith('Score:'))
			.map((content) => content.match(/\d+/g)?.reduce((sum, value) => sum + Number(value), 0) ?? 0);
		expect(scores.at(-1)).toBe(2);
	});
});

describe('terminal adventure', () => {
	it('keeps the world graph connected', () => {
		expect(adventureWorldIssues()).toEqual([]);
	});

	it('opens west of the house and walks the early path', () => {
		const opened = openingAdventure();
		expect(opened.lines.map((line) => line.content).join('\n')).toContain('West of House');
		const early = play([
			'look',
			'open mailbox',
			'take leaflet',
			'read leaflet',
			'n',
			'e',
			'open window',
			'in',
			'e'
		]);
		expect(early.text.toLowerCase()).toContain('mailbox');
		expect(early.text.toLowerCase()).toContain('taken');
		expect(early.text.toLowerCase()).toContain('cave crawl');
		expect(early.state.currentRoom).toBe('kitchen');
		expect(early.state.inventory).toContain('leaflet');
	});

	it('wins by dropping or putting the prism in the trophy case, once', () => {
		const dropped = play([...WIN, 'drop prism']);
		expect(dropped.state.gameOver).toBe(true);
		expect(dropped.state.flags.victory).toBe(true);
		expect(dropped.state.flags.artifactPlaced).toBe(true);
		expect(dropped.state.score).toBe(100);
		expect(dropped.text.toLowerCase()).toContain('completed the adventure');

		const placed = play([...WIN, 'put prism in case']);
		expect(placed.state.score).toBe(100);
		expect(placed.state.gameOver).toBe(true);

		const underground = play([...WIN.slice(0, 15), 'put prism in case']);
		expect(underground.state.gameOver).toBe(false);
		expect(underground.state.flags.victory).not.toBe(true);

		const seeded: AdventureState = {
			...createAdventure(),
			currentRoom: 'living-room',
			inventory: ['signal-prism'],
			score: 60,
			flags: { victory: true },
			roomVisited: { 'living-room': true }
		};
		const repeat = runAdventure(seeded, 'put prism in case');
		expect(repeat.state.gameOver).toBe(false);
		expect(repeat.state.score).toBe(60);
	});

	it('opens a carried sack and saves under the v5 key', () => {
		let state = createAdventure();
		for (const input of [
			'n',
			'e',
			'open window',
			'in',
			'e',
			'take sack',
			'open sack',
			'take garlic'
		]) {
			state = runAdventure(state, input).state;
		}
		expect(state.inventory).toContain('sack');
		expect(state.itemStates.sack?.isOpen).toBe(true);
		expect(state.inventory).toContain('garlic');

		const storage = memoryStorage();
		let session = submitLine(replaceInput(createSession(), 'zork'), { adventureStorage: storage });
		expect(session.mode).toBe('adventure');
		expect(session.lines.map((line) => line.content).join('\n')).toContain(
			'Launching terminal adventure.'
		);
		session = submitLine(replaceInput(session, 'n'), { adventureStorage: storage });
		session = submitLine(replaceInput(session, 'save'), { adventureStorage: storage });
		expect(session.lines.at(-1)?.content).toBe('Game saved.');
		expect(storage.raw).toContain('"v":1');
		const saved = loadAdventure(storage);
		expect(saved?.currentRoom).toBe('north-of-house');

		session = submitLine(replaceInput(session, 'restart'), { adventureStorage: storage });
		expect(session.lines.map((line) => line.content)).toContain('Game restarted.');
		expect(session.adventure?.currentRoom).toBe('west-of-house');
		session = submitLine(replaceInput(session, 'restore'), { adventureStorage: storage });
		expect(session.lines.map((line) => line.content)).toContain('Restored.');
		expect(session.adventure?.currentRoom).toBe('north-of-house');
		session = submitLine(replaceInput(session, 'load'), { adventureStorage: null });
		expect(session.lines.at(-1)?.content).toBe('No saved game found.');
		session = submitLine(replaceInput(session, 'exit'), { adventureStorage: storage });
		expect(session.mode).toBe('shell');
		expect(session.adventure).toBeNull();
		expect(session.lines.at(-1)?.content).toBe('Left the adventure.');

		session = submitLine(replaceInput(session, 'zork'), { adventureStorage: storage });
		session = cancelMode(session);
		expect(session.mode).toBe('shell');
		expect(session.adventure).toBeNull();
		expect(session.lines.at(-1)?.content).toBe('Returned to normal shell.');
	});
});
