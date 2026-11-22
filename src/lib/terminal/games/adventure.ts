import type { TerminalLine } from '$lib/terminal/types';

export const ADVENTURE_SAVE_KEY = 'stepweaver-adventure-save-v1';
const SCHEMA_VERSION = 1;
const SCORE_MAX = 100;
const LAMP = 'lamp';

type Direction =
	| 'north'
	| 'south'
	| 'east'
	| 'west'
	| 'northeast'
	| 'northwest'
	| 'southeast'
	| 'southwest'
	| 'up'
	| 'down'
	| 'in'
	| 'out';

type OutputKind = 'text' | 'roomTitle' | 'error' | 'dim' | 'itemHere' | 'success' | 'cyan';

type OutputLine = { kind: OutputKind; text: string };

type ItemDef = {
	name: string;
	description: string;
	readText?: string;
	takeable?: boolean;
	openable?: boolean;
	container?: boolean;
	lightSource?: boolean;
	moveable?: boolean;
	initialContents?: string[];
	under?: string[];
};

type RoomDef = {
	name: string;
	description: string;
	dark?: boolean;
	exits: Partial<Record<Direction, string>>;
	initialItems: string[];
};

export type AdventureState = {
	currentRoom: string;
	inventory: string[];
	roomItems: Record<string, string[]>;
	itemStates: Record<string, { isOpen?: boolean; moved?: boolean }>;
	containerContents: Record<string, string[]>;
	exitOverrides: Record<string, Partial<Record<Direction, string>>>;
	roomVisited: Record<string, boolean>;
	flags: Record<string, boolean>;
	score: number;
	moves: number;
	lampOn: boolean;
	lampFuel: number;
	gameOver: boolean;
	pendingQuitConfirm: boolean;
};

type Step = { state: AdventureState; lines: OutputLine[] };

const ITEMS: Record<string, ItemDef> = {
	mailbox: {
		name: 'small mailbox',
		description: 'The mailbox is closed.',
		takeable: false,
		openable: true,
		initialContents: ['leaflet']
	},
	leaflet: {
		name: 'leaflet',
		description: 'A small leaflet.',
		readText:
			'WELCOME TO A CLASSIC CAVE CRAWL\n\nThis is a browser-native work of interactive fiction: exploration, light puzzles, and a little danger. Good luck, adventurer.',
		takeable: true
	},
	lamp: {
		name: 'brass lantern',
		description: 'A battery-powered brass lantern.',
		takeable: true,
		lightSource: true
	},
	rug: {
		name: 'large oriental rug',
		description: 'A large rug covers the center of the floor.',
		takeable: false,
		moveable: true,
		under: ['trap-door']
	},
	'trophy-case': {
		name: 'trophy case',
		description: 'A handsome trophy case. It is empty.',
		takeable: false
	},
	sack: {
		name: 'brown sack',
		description: 'A brown sack, smelling faintly of hot peppers.',
		takeable: true,
		container: true,
		openable: true,
		initialContents: ['lunch', 'garlic']
	},
	lunch: { name: 'lunch', description: 'A well-packed lunch.', takeable: true },
	garlic: { name: 'clove of garlic', description: 'A pungent clove of garlic.', takeable: true },
	water: { name: 'bottle of water', description: 'A bottle of clear water.', takeable: true },
	rope: { name: 'rope', description: 'A large coil of rope.', takeable: true },
	knife: { name: 'nasty knife', description: 'A nasty-looking knife.', takeable: true },
	leaves: {
		name: 'pile of leaves',
		description: 'There is a pile of leaves on the ground.',
		takeable: false,
		moveable: true,
		under: ['grating']
	},
	grating: {
		name: 'grating',
		description: 'A metal grating, flush with the ground.',
		takeable: false,
		openable: true
	},
	window: {
		name: 'kitchen window',
		description: 'The window is slightly ajar, but not enough to slip through.',
		takeable: false,
		openable: true
	},
	'trap-door': {
		name: 'trap door',
		description: 'A wooden door is set flush with the floor.',
		takeable: false,
		openable: true
	},
	debris: {
		name: 'heap of debris',
		description:
			'A slumped heap of damp boards, cracked stone, and rusted iron. Something about it feels deliberately piled.',
		takeable: false,
		moveable: true,
		under: ['signal-prism']
	},
	'signal-prism': {
		name: 'glass signal prism',
		description:
			'A dense glass prism, edges clean despite the grime around it. Fine etching marks one face like a calibration scale.',
		takeable: true
	}
};

const ROOMS: Record<string, RoomDef> = {
	'west-of-house': {
		name: 'West of House',
		description: 'You stand in an open field west of a white house, with a boarded front door.',
		exits: { north: 'north-of-house', south: 'south-of-house', east: 'behind-house', west: 'forest' },
		initialItems: ['mailbox']
	},
	'north-of-house': {
		name: 'North of House',
		description:
			'You are north of a white house. There is no door here, and the windows are boarded. A narrow path leads north into the trees.',
		exits: { south: 'west-of-house', east: 'behind-house', west: 'forest', north: 'forest-path' },
		initialItems: []
	},
	'behind-house': {
		name: 'Behind House',
		description:
			'You are behind the white house. A path leads east into the forest. In one corner, a small window sits slightly ajar.',
		exits: { west: 'north-of-house', south: 'south-of-house', east: 'forest', north: 'north-of-house' },
		initialItems: ['window']
	},
	'south-of-house': {
		name: 'South of House',
		description: 'You face the south side of a white house. There is no door, and the windows are boarded.',
		exits: { north: 'west-of-house', east: 'behind-house', west: 'forest' },
		initialItems: []
	},
	forest: {
		name: 'Forest',
		description: 'Dense trees close in on every side. To the east, the forest seems a little brighter.',
		exits: { east: 'west-of-house', north: 'forest', south: 'forest', west: 'forest' },
		initialItems: []
	},
	'forest-path': {
		name: 'Forest Path',
		description:
			'A path winds through dim woods. It runs north and south here. A large tree with low branches stands beside the trail.',
		exits: { north: 'clearing', south: 'north-of-house' },
		initialItems: []
	},
	clearing: {
		name: 'Clearing',
		description: 'A quiet clearing. Forest presses in on all sides. A path leads south.',
		exits: { south: 'forest-path', east: 'canyon-view' },
		initialItems: ['leaves']
	},
	'canyon-view': {
		name: 'Canyon View',
		description:
			'You are on a ledge overlooking a steep canyon. The view is impressive, but the drop is uninviting. A path leads back west into the woods.',
		exits: { west: 'clearing' },
		initialItems: []
	},
	'living-room': {
		name: 'Living Room',
		description:
			'A cozy living room. A doorway opens east, a wooden door to the west bears odd lettering and looks nailed shut, and a trophy case stands against the wall. A large rug lies in the center of the floor.',
		exits: { east: 'kitchen', up: 'attic' },
		initialItems: ['rug', 'trophy-case', 'lamp']
	},
	kitchen: {
		name: 'Kitchen',
		description:
			'A kitchen, recently used. A passage leads west, and a dark staircase descends. A chimney climbs upward, and a small window to the north is open.',
		exits: { west: 'living-room', down: 'cellar' },
		initialItems: ['sack', 'water']
	},
	attic: {
		name: 'Attic',
		description: 'A cramped attic. The only exit is a stairway leading down.',
		exits: { down: 'living-room' },
		initialItems: ['rope', 'knife']
	},
	cellar: {
		name: 'Cellar',
		description:
			'You are in a damp cellar. A narrow passage leads north, a low crawlway south, and a steep metal ramp rises west, too smooth to climb.',
		dark: true,
		exits: { north: 'north-south-passage', south: 'crawlway', up: 'kitchen' },
		initialItems: []
	},
	'north-south-passage': {
		name: 'North-South Passage',
		description: 'A long passage running north and south. Rough stairs climb southward.',
		dark: true,
		exits: { north: 'chasm', south: 'cellar' },
		initialItems: []
	},
	chasm: {
		name: 'Chasm',
		description:
			'A deep chasm cuts southwest to northeast. The trail hugs the south rim; a crack in the wall opens into a passage.',
		dark: true,
		exits: { south: 'north-south-passage', northeast: 'reservoir-south', southwest: 'east-west-passage' },
		initialItems: []
	},
	'reservoir-south': {
		name: 'Mist Reservoir',
		description:
			'A cold mist hangs over a dark underground reservoir. Water laps softly against stone. A narrow ledge continues along the rim, and a smaller passage breaks away into the rock.',
		dark: true,
		exits: { southwest: 'chasm', east: 'east-west-passage' },
		initialItems: []
	},
	'east-west-passage': {
		name: 'Echo Gallery',
		description:
			'A worked stone corridor that carries every footstep forward and back again. The air tastes of metal and wet limestone.',
		dark: true,
		exits: { northeast: 'chasm', west: 'survey-niche', east: 'reservoir-south' },
		initialItems: []
	},
	crawlway: {
		name: 'Low Crawlway',
		description:
			'A tight crawlway of damp stone, just wide enough to squeeze through without scraping yourself raw. You can stand again to the north.',
		dark: true,
		exits: { north: 'cellar' },
		initialItems: []
	},
	'survey-niche': {
		name: 'Survey Niche',
		description:
			'A small niche has been hacked into the wall, as if someone once worked here by lamplight. Old chalk marks crisscross the stone. A heap of debris slumps in one corner.',
		dark: true,
		exits: { east: 'east-west-passage' },
		initialItems: ['debris']
	}
};

const ALIASES: Record<string, string[]> = {
	mailbox: ['mailbox', 'box', 'small mailbox'],
	leaflet: ['leaflet', 'paper', 'note'],
	lamp: ['lamp', 'lantern', 'brass lantern', 'light'],
	rug: ['rug', 'oriental rug', 'large rug', 'carpet'],
	'trophy-case': ['trophy case', 'case', 'cabinet'],
	sack: ['sack', 'bag', 'brown sack'],
	lunch: ['lunch', 'food', 'sandwich'],
	garlic: ['garlic', 'clove', 'clove of garlic'],
	water: ['water', 'bottle', 'bottle of water'],
	rope: ['rope', 'coil'],
	knife: ['knife', 'blade'],
	leaves: ['leaves', 'pile', 'pile of leaves'],
	grating: ['grating', 'grate'],
	window: ['window', 'kitchen window'],
	'trap-door': ['trap door', 'door', 'trapdoor'],
	debris: ['debris', 'heap', 'pile', 'heap of debris', 'rubble', 'junk'],
	'signal-prism': ['prism', 'signal prism', 'glass prism', 'glass signal prism', 'artifact']
};

const DIRECTIONS: Record<string, Direction> = {
	n: 'north',
	s: 'south',
	e: 'east',
	w: 'west',
	u: 'up',
	d: 'down',
	ne: 'northeast',
	nw: 'northwest',
	se: 'southeast',
	sw: 'southwest',
	north: 'north',
	south: 'south',
	east: 'east',
	west: 'west',
	up: 'up',
	down: 'down',
	northeast: 'northeast',
	northwest: 'northwest',
	southeast: 'southeast',
	southwest: 'southwest',
	in: 'in',
	inside: 'in',
	enter: 'in',
	out: 'out',
	outside: 'out',
	exit: 'out'
};

const DARK = "It is pitch black. You can't see a thing.";

function output(kind: OutputKind, text: string): OutputLine {
	return { kind, text };
}

function normalize(raw: string): string {
	return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}

function phrase(value: string): string {
	return normalize(value).replace(/^(a|an|the)\s+/, '');
}

function aliasesFor(itemId: string): string[] {
	const def = ITEMS[itemId];
	if (!def) return [];
	return [
		...new Set(
			[phrase(def.name), phrase(itemId.replace(/-/g, ' ')), ...(ALIASES[itemId] ?? []).map(phrase)].filter(
				Boolean
			)
		)
	];
}

function aliasMatches(input: string, alias: string): boolean {
	if (!alias) return false;
	if (input === alias) return true;
	const left = input.split(/\s+/);
	const right = alias.split(/\s+/);
	if (right.every((word) => left.includes(word))) return true;
	if (left.every((word) => right.includes(word))) return true;
	if (input.includes(alias) && alias.length >= 4) return true;
	if (alias.includes(input) && input.length >= 4) return true;
	return false;
}

function resolvePhrase(raw: string, candidates: Set<string>): string | null {
	const input = phrase(raw);
	if (!input) return null;
	const matched = [...candidates].filter((itemId) =>
		aliasesFor(itemId).some((alias) => aliasMatches(input, alias))
	);
	if (matched.length === 0) return null;
	if (matched.length === 1) return matched[0] ?? null;
	const scoreOf = (itemId: string) =>
		aliasesFor(itemId).reduce((best, alias) => {
			if (input === alias) return Math.max(best, 100 + alias.length);
			if (aliasMatches(input, alias)) return Math.max(best, alias.length);
			return best;
		}, 0);
	const best = Math.max(...matched.map(scoreOf));
	const tops = matched.filter((itemId) => scoreOf(itemId) === best);
	return tops.length === 1 ? (tops[0] ?? null) : null;
}

function isOpen(state: AdventureState, itemId: string): boolean {
	return state.itemStates[itemId]?.isOpen === true;
}

function hasLight(state: AdventureState): boolean {
	return state.lampOn && state.inventory.includes(LAMP);
}

function pitchBlack(state: AdventureState): boolean {
	return Boolean(ROOMS[state.currentRoom]?.dark) && !hasLight(state);
}

function exitsOf(state: AdventureState, roomId: string): Partial<Record<Direction, string>> {
	return { ...(ROOMS[roomId]?.exits ?? {}), ...(state.exitOverrides[roomId] ?? {}) };
}

function visibleInRoom(state: AdventureState, roomId: string): string[] {
	const visible = [...(state.roomItems[roomId] ?? [])];
	for (const itemId of visible) {
		if (ITEMS[itemId]?.openable && isOpen(state, itemId)) {
			visible.push(...(state.containerContents[itemId] ?? []));
		}
	}
	return visible;
}

function examineSet(state: AdventureState): Set<string> {
	const visible = new Set([...visibleInRoom(state, state.currentRoom), ...state.inventory]);
	for (const carried of state.inventory) {
		if (ITEMS[carried]?.container && isOpen(state, carried)) {
			for (const inner of state.containerContents[carried] ?? []) visible.add(inner);
		}
	}
	return visible;
}

export function createAdventure(): AdventureState {
	const roomItems: Record<string, string[]> = {};
	const containerContents: Record<string, string[]> = {};
	for (const [roomId, room] of Object.entries(ROOMS)) roomItems[roomId] = [...room.initialItems];
	for (const [itemId, item] of Object.entries(ITEMS)) {
		if (item.initialContents?.length) containerContents[itemId] = [...item.initialContents];
	}
	return {
		currentRoom: 'west-of-house',
		inventory: [],
		roomItems,
		itemStates: {},
		containerContents,
		exitOverrides: {},
		roomVisited: { 'west-of-house': true },
		flags: {},
		score: 0,
		moves: 0,
		lampOn: false,
		lampFuel: 200,
		gameOver: false,
		pendingQuitConfirm: false
	};
}

function describe(state: AdventureState, roomId: string): OutputLine[] {
	const room = ROOMS[roomId];
	if (!room) return [output('error', 'You seem to be nowhere.')];
	const local = { ...state, currentRoom: roomId };
	if (pitchBlack(local)) return [output('error', DARK)];
	const lines = [output('roomTitle', room.name), output('text', room.description)];
	for (const itemId of visibleInRoom(local, roomId)) {
		const name = ITEMS[itemId]?.name ?? itemId;
		const kind =
			name.includes('mailbox') || name.includes('trophy') || name.includes('rug') ? 'cyan' : 'itemHere';
		lines.push(output(kind, `There is a ${name} here.`));
	}
	return lines;
}

function moved(state: AdventureState): AdventureState {
	return { ...state, moves: state.moves + 1 };
}

function drain(state: AdventureState): Step {
	if (!state.lampOn || !state.inventory.includes(LAMP)) return { state, lines: [] };
	if (state.lampFuel - 1 > 0) return { state: { ...state, lampFuel: state.lampFuel - 1 }, lines: [] };
	return {
		state: { ...state, lampFuel: 0, lampOn: false },
		lines: [output('text', 'The lantern flickers and dies. You are left in darkness.')]
	};
}

function move(state: AdventureState, direction: Direction): Step {
	if (pitchBlack(state)) return { state, lines: [output('error', DARK)] };
	const target = exitsOf(state, state.currentRoom)[direction];
	if (!target) return { state, lines: [output('error', "You can't go that way.")] };
	let next: AdventureState = moved({
		...state,
		currentRoom: target,
		roomVisited: { ...state.roomVisited, [target]: true }
	});
	const fuel = drain(next);
	next = fuel.state;
	if (target === 'living-room' && !next.flags.enteredHouse) {
		next = { ...next, score: next.score + 10, flags: { ...next.flags, enteredHouse: true } };
	}
	if (target === 'cellar' && !next.flags.firstCellarVisit) {
		next = { ...next, score: next.score + 10, flags: { ...next.flags, firstCellarVisit: true } };
	}
	return { state: next, lines: [output('text', ''), ...describe(next, target), ...fuel.lines] };
}

function holder(state: AdventureState, itemId: string): string | null {
	for (const [containerId, contents] of Object.entries(state.containerContents)) {
		if (contents.includes(itemId)) return containerId;
	}
	return null;
}

function take(state: AdventureState, objectPhrase: string): Step {
	if (!objectPhrase.trim()) return { state, lines: [output('error', 'Take what?')] };
	if (pitchBlack(state)) return { state, lines: [output('error', DARK)] };
	const candidates = new Set(visibleInRoom(state, state.currentRoom));
	for (const carried of state.inventory) {
		if (ITEMS[carried]?.container && isOpen(state, carried)) {
			for (const inner of state.containerContents[carried] ?? []) candidates.add(inner);
		}
	}
	const itemId = resolvePhrase(objectPhrase, candidates);
	const def = itemId ? ITEMS[itemId] : undefined;
	if (!itemId || !def) return { state, lines: [output('error', "I don't see that here.")] };
	if (!def.takeable) return { state, lines: [output('error', `You can't take the ${def.name}.`)] };
	const parent = holder(state, itemId);
	if (parent) {
		const reachable =
			isOpen(state, parent) &&
			((state.roomItems[state.currentRoom] ?? []).includes(parent) || state.inventory.includes(parent));
		if (!reachable) return { state, lines: [output('error', "I don't see that here.")] };
	} else if (!(state.roomItems[state.currentRoom] ?? []).includes(itemId)) {
		return { state, lines: [output('error', "I don't see that here.")] };
	}
	let next: AdventureState = moved({
		...state,
		inventory: [...state.inventory, itemId],
		roomItems: {
			...state.roomItems,
			[state.currentRoom]: (state.roomItems[state.currentRoom] ?? []).filter((id) => id !== itemId)
		}
	});
	if (parent) {
		next = {
			...next,
			containerContents: {
				...next.containerContents,
				[parent]: (next.containerContents[parent] ?? []).filter((id) => id !== itemId)
			}
		};
	}
	if (itemId === LAMP && !next.flags.tookLantern) {
		next = { ...next, score: next.score + 5, flags: { ...next.flags, tookLantern: true } };
	}
	if (itemId === 'signal-prism' && !next.flags.artifactTaken) {
		next = { ...next, score: next.score + 25, flags: { ...next.flags, artifactTaken: true } };
	}
	return { state: next, lines: [output('success', 'Taken.')] };
}

function victoryLines(): OutputLine[] {
	return [
		output('success', 'Placed.'),
		output('text', ''),
		output('success', 'The prism settles into the trophy case as if it was made for it.'),
		output('cyan', 'A quiet chime pulses through the house, and the air feels… finished.'),
		output('success', 'You have completed the adventure.')
	];
}

function drop(state: AdventureState, objectPhrase: string): Step {
	if (!objectPhrase.trim()) return { state, lines: [output('error', 'Drop what?')] };
	const itemId = resolvePhrase(objectPhrase, new Set(state.inventory));
	if (!itemId) return { state, lines: [output('error', "You don't have that.")] };
	let next: AdventureState = {
		...state,
		inventory: state.inventory.filter((id) => id !== itemId),
		roomItems: {
			...state.roomItems,
			[state.currentRoom]: [...(state.roomItems[state.currentRoom] ?? []), itemId]
		}
	};
	if (
		itemId === 'signal-prism' &&
		state.currentRoom === 'living-room' &&
		(state.roomItems['living-room'] ?? []).includes('trophy-case') &&
		!state.flags.victory
	) {
		next = moved({
			...next,
			score: next.score + 40,
			flags: { ...next.flags, artifactPlaced: true, victory: true },
			gameOver: true
		});
		return { state: next, lines: victoryLines() };
	}
	if (itemId === LAMP && next.lampOn) next = { ...next, lampOn: false };
	return { state: moved(next), lines: [output('success', 'Dropped.')] };
}

function put(state: AdventureState, objectPhrase: string): Step {
	const match = objectPhrase.trim().match(/^(.*?)\s+(?:in|into|inside)\s+(.*?)$/i);
	if (!match) {
		return {
			state,
			lines: [output('error', objectPhrase.trim() ? 'Put it where?' : 'Put what?')]
		};
	}
	const itemId = resolvePhrase(match[1] ?? '', new Set(state.inventory));
	if (!itemId) return { state, lines: [output('error', "You don't have that.")] };
	const targetId = resolvePhrase(match[2] ?? '', new Set(visibleInRoom(state, state.currentRoom)));
	if (!targetId) return { state, lines: [output('error', "I don't see that here.")] };
	if (targetId !== 'trophy-case') {
		return {
			state,
			lines: [output('error', "That doesn't seem like something you can put things into.")]
		};
	}
	if (state.currentRoom !== 'living-room') {
		return { state, lines: [output('error', "That doesn't seem useful here.")] };
	}
	if (
		itemId === 'signal-prism' &&
		(state.roomItems['living-room'] ?? []).includes('trophy-case') &&
		!state.flags.victory
	) {
		const next = moved({
			...state,
			inventory: state.inventory.filter((id) => id !== itemId),
			score: state.score + 40,
			flags: { ...state.flags, artifactPlaced: true, victory: true },
			gameOver: true
		});
		return { state: next, lines: victoryLines() };
	}
	if (itemId === 'signal-prism') {
		return { state: moved(state), lines: [output('error', 'It won’t sit properly there.')] };
	}
	return { state: moved(state), lines: [output('error', "That doesn't seem to fit.")] };
}

function inventory(state: AdventureState): Step {
	if (state.inventory.length === 0) return { state, lines: [output('itemHere', 'You are empty-handed.')] };
	return {
		state,
		lines: [
			output('cyan', 'You are carrying:'),
			...state.inventory.map((itemId) => output('text', `• A ${ITEMS[itemId]?.name ?? itemId}`))
		]
	};
}

function mailboxText(state: AdventureState): string {
	const open = isOpen(state, 'mailbox');
	const leaflet = (state.containerContents.mailbox ?? []).includes('leaflet');
	if (open && leaflet) return 'The small mailbox is open.';
	if (open) return 'The small mailbox is empty.';
	return 'The small mailbox is closed.';
}

function examine(state: AdventureState, objectPhrase: string): Step {
	if (!objectPhrase.trim()) return { state, lines: describe(state, state.currentRoom) };
	if (pitchBlack(state)) return { state, lines: [output('error', DARK)] };
	const itemId = resolvePhrase(objectPhrase, examineSet(state));
	if (!itemId) return { state, lines: [output('error', "I don't see that here.")] };
	if (itemId === 'mailbox') return { state, lines: [output('text', mailboxText(state))] };
	if (itemId === 'trophy-case') {
		const text = state.flags.artifactPlaced
			? 'The trophy case holds a single glass prism, catching and breaking the light into quiet angles.'
			: 'A handsome trophy case. It is empty.';
		return { state, lines: [output('text', text)] };
	}
	return { state, lines: [output('text', ITEMS[itemId]?.description ?? 'Nothing special.')] };
}

function read(state: AdventureState, objectPhrase: string): Step {
	if (!objectPhrase.trim()) return { state, lines: [output('error', 'Read what?')] };
	if (pitchBlack(state)) return { state, lines: [output('error', DARK)] };
	const itemId = resolvePhrase(objectPhrase, examineSet(state));
	if (!itemId) return { state, lines: [output('error', "I don't see that here.")] };
	const text = ITEMS[itemId]?.readText ?? ITEMS[itemId]?.description;
	if (!text) return { state, lines: [output('text', 'Nothing is written on it.')] };
	return { state, lines: text.split('\n').map((entry) => output('text', entry)) };
}

function reachable(state: AdventureState): Set<string> {
	return new Set([...visibleInRoom(state, state.currentRoom), ...state.inventory]);
}

function openItem(state: AdventureState, objectPhrase: string): Step {
	if (!objectPhrase.trim()) return { state, lines: [output('error', 'Open what?')] };
	if (pitchBlack(state)) return { state, lines: [output('error', DARK)] };
	const itemId = resolvePhrase(objectPhrase, reachable(state));
	const def = itemId ? ITEMS[itemId] : undefined;
	if (!itemId || !def) return { state, lines: [output('error', "I don't see that here.")] };
	if (!def.openable) return { state, lines: [output('error', `You can't open the ${def.name}.`)] };
	if (isOpen(state, itemId)) return { state, lines: [output('text', `The ${def.name} is already open.`)] };
	let next: AdventureState = moved({
		...state,
		itemStates: { ...state.itemStates, [itemId]: { ...state.itemStates[itemId], isOpen: true } }
	});
	const lines = [output('success', 'Opened.')];
	const contents = next.containerContents[itemId] ?? [];
	if (contents.length) {
		lines.push(output('cyan', `Opening the ${def.name} reveals:`));
		for (const inner of contents) lines.push(output('itemHere', `• A ${ITEMS[inner]?.name ?? inner}`));
	}
	if (itemId === 'window' && state.currentRoom === 'behind-house') {
		lines.push(output('cyan', 'With effort, you force the window wide enough to climb through.'));
		next = {
			...next,
			flags: { ...next.flags, windowOpened: true },
			exitOverrides: {
				...next.exitOverrides,
				'behind-house': { ...next.exitOverrides['behind-house'], in: 'living-room' }
			}
		};
	}
	if (itemId === 'trap-door' && state.currentRoom === 'living-room') {
		lines.push(output('cyan', 'The trap door creaks open, revealing stairs descending into darkness.'));
		next = {
			...next,
			flags: { ...next.flags, trapDoorOpened: true },
			exitOverrides: {
				...next.exitOverrides,
				'living-room': { ...next.exitOverrides['living-room'], down: 'cellar' }
			}
		};
	}
	return { state: next, lines };
}

function closeItem(state: AdventureState, objectPhrase: string): Step {
	if (!objectPhrase.trim()) return { state, lines: [output('error', 'Close what?')] };
	if (pitchBlack(state)) return { state, lines: [output('error', DARK)] };
	const itemId = resolvePhrase(objectPhrase, reachable(state));
	const def = itemId ? ITEMS[itemId] : undefined;
	if (!itemId || !def) return { state, lines: [output('error', "I don't see that here.")] };
	if (!def.openable) return { state, lines: [output('error', `You can't close the ${def.name}.`)] };
	if (!isOpen(state, itemId)) return { state, lines: [output('text', `The ${def.name} is already closed.`)] };
	let next: AdventureState = moved({
		...state,
		itemStates: { ...state.itemStates, [itemId]: { ...state.itemStates[itemId], isOpen: false } }
	});
	if (itemId === 'window' && state.currentRoom === 'behind-house') {
		const flags = { ...next.flags };
		delete flags.windowOpened;
		const exits = { ...next.exitOverrides['behind-house'] };
		delete exits.in;
		next = { ...next, flags, exitOverrides: { ...next.exitOverrides, 'behind-house': exits } };
	}
	if (itemId === 'trap-door' && state.currentRoom === 'living-room') {
		const flags = { ...next.flags };
		delete flags.trapDoorOpened;
		const exits = { ...next.exitOverrides['living-room'] };
		delete exits.down;
		next = { ...next, flags, exitOverrides: { ...next.exitOverrides, 'living-room': exits } };
	}
	return { state: next, lines: [output('success', 'Closed.')] };
}

function moveObject(state: AdventureState, objectPhrase: string): Step {
	if (!objectPhrase.trim()) return { state, lines: [output('error', 'Move what?')] };
	if (pitchBlack(state)) return { state, lines: [output('error', DARK)] };
	const itemId = resolvePhrase(objectPhrase, new Set(visibleInRoom(state, state.currentRoom)));
	const def = itemId ? ITEMS[itemId] : undefined;
	if (!itemId || !def) return { state, lines: [output('error', "I don't see that here.")] };
	if (!def.moveable) return { state, lines: [output('error', `You can't move the ${def.name}.`)] };
	if (state.itemStates[itemId]?.moved) {
		return { state, lines: [output('text', `The ${def.name} has already been moved.`)] };
	}
	let next: AdventureState = moved({
		...state,
		itemStates: { ...state.itemStates, [itemId]: { ...state.itemStates[itemId], moved: true } }
	});
	const under = def.under ?? [];
	if (!under.length) {
		return { state: next, lines: [output('text', `You move the ${def.name}, but find nothing underneath.`)] };
	}
	const room = [...(next.roomItems[next.currentRoom] ?? [])];
	const lines = [output('cyan', `Moving the ${def.name} reveals:`)];
	for (const revealed of under) {
		if (!room.includes(revealed)) room.push(revealed);
		lines.push(output('itemHere', `• A ${ITEMS[revealed]?.name ?? revealed}`));
	}
	next = { ...next, roomItems: { ...next.roomItems, [next.currentRoom]: room } };
	if (itemId === 'rug' && !next.flags.rugMoved) next = { ...next, score: next.score + 10 };
	if (itemId === 'rug') next = { ...next, flags: { ...next.flags, rugMoved: true } };
	return { state: next, lines };
}

function light(state: AdventureState, objectPhrase: string, on: boolean): Step {
	const held = resolvePhrase(objectPhrase, new Set(state.inventory));
	const itemId = objectPhrase.trim() ? held : state.inventory.includes(LAMP) ? LAMP : null;
	if (!itemId) {
		return { state, lines: [output('error', objectPhrase.trim() ? "You don't have that." : `Turn ${on ? 'on' : 'off'} what?`)] };
	}
	const def = ITEMS[itemId];
	if (!def?.lightSource) {
		return { state, lines: [output('error', `You can't turn ${on ? 'on' : 'off'} the ${def?.name ?? itemId}.`)] };
	}
	if (on && state.lampOn) return { state, lines: [output('text', 'The lantern is already on.')] };
	if (!on && !state.lampOn) return { state, lines: [output('text', 'The lantern is already off.')] };
	return {
		state: moved({ ...state, lampOn: on }),
		lines: [output('success', `The brass lantern is now ${on ? 'on' : 'off'}.`)]
	};
}

function help(state: AdventureState): Step {
	return {
		state,
		lines: [
			output('success', 'Brief help:'),
			output('text', ''),
			output('cyan', 'DIRECTIONS:'),
			output(
				'text',
				'north, south, east, west, northeast, northwest, southeast, southwest, up, down, in, out (or n/s/e/w/u/d).'
			),
			output('cyan', 'INVENTORY:'),
			output('text', 'take / get, drop, put / place / insert (in/into), inventory (i)'),
			output('cyan', 'ACTIONS:'),
			output('text', 'open / close, read, move, go, turn on / turn off, attack'),
			output('cyan', 'META:'),
			output('text', 'look / examine, score, save, restore, restart, quit (then y/n)')
		]
	};
}

export function runAdventure(state: AdventureState, raw: string): Step {
	const normalized = normalize(raw);
	if (!normalized) return { state, lines: [] };
	const words = normalized.split(' ');
	const first = words[0] ?? '';
	if (state.pendingQuitConfirm) {
		if (first === 'y' || first === 'yes') {
			return {
				state: { ...state, pendingQuitConfirm: false, gameOver: true },
				lines: [output('success', 'Thanks for playing!')]
			};
		}
		if (first === 'n' || first === 'no') {
			return { state: { ...state, pendingQuitConfirm: false }, lines: [output('text', 'OK.')] };
		}
		return { state, lines: [output('error', 'Please answer yes or no.')] };
	}
	if (words.length === 1 && DIRECTIONS[first]) return move(state, DIRECTIONS[first]);
	if ((first === 'go' || first === 'move') && words[1] && DIRECTIONS[words[1]]) {
		return move(state, DIRECTIONS[words[1]]);
	}
	if (first === 'enter' && words.length === 1) return move(state, 'in');
	let verb = first;
	let objectPhrase = words.slice(1).join(' ');
	if (first === 'turn' && words[1] === 'on') {
		verb = 'turnon';
		objectPhrase = words.slice(2).join(' ');
	} else if (first === 'turn' && words[1] === 'off') {
		verb = 'turnoff';
		objectPhrase = words.slice(2).join(' ');
	} else if (first === 'turn' && words.at(-1) === 'on' && words.length >= 3) {
		verb = 'turnon';
		objectPhrase = words.slice(1, -1).join(' ');
	} else if (first === 'turn' && words.at(-1) === 'off' && words.length >= 3) {
		verb = 'turnoff';
		objectPhrase = words.slice(1, -1).join(' ');
	}
	if (verb === 'take' || verb === 'get') return take(state, objectPhrase);
	if (verb === 'drop') return drop(state, objectPhrase);
	if (verb === 'put' || verb === 'place' || verb === 'insert') return put(state, objectPhrase);
	if (verb === 'i' || verb === 'inventory') return inventory(state);
	if ((verb === 'l' || verb === 'look') && !objectPhrase.trim()) return examine(state, '');
	if (verb === 'l' || verb === 'look' || verb === 'examine' || verb === 'x') return examine(state, objectPhrase);
	if (verb === 'open') return openItem(state, objectPhrase);
	if (verb === 'close') return closeItem(state, objectPhrase);
	if (verb === 'read') return read(state, objectPhrase);
	if (verb === 'move') return moveObject(state, objectPhrase);
	if (verb === 'score') {
		return {
			state,
			lines: [
				output('cyan', `Your score is ${state.score} (out of ${SCORE_MAX} points), in ${state.moves} moves.`),
				output('text', 'This gives you the rank of Beginner.')
			]
		};
	}
	if (verb === 'help') return help(state);
	if (verb === 'turnon') return light(state, objectPhrase, true);
	if (verb === 'turnoff') return light(state, objectPhrase, false);
	if (verb === 'attack' || verb === 'kill' || verb === 'fight') {
		return { state, lines: [output('text', 'There is nothing here to fight.')] };
	}
	if (verb === 'quit' || verb === 'q') {
		return {
			state: { ...state, pendingQuitConfirm: true },
			lines: [output('text', 'Do you really want to quit? (y/n)')]
		};
	}
	return { state, lines: [output('error', "I don't understand that.")] };
}

const VARIANTS: Record<OutputKind, TerminalLine['variant']> = {
	text: 'default',
	roomTitle: 'success',
	error: 'error',
	dim: 'dimmed',
	itemHere: 'warning',
	success: 'success',
	cyan: 'lambda'
};

export function adventureLines(lines: OutputLine[]): TerminalLine[] {
	return lines.map((entry) => ({ content: entry.text, variant: VARIANTS[entry.kind] }));
}

export function openingAdventure(): { state: AdventureState; lines: TerminalLine[] } {
	const state = createAdventure();
	const lines = adventureLines([
		output('success', 'λstepweaver Terminal Adventure'),
		output('dim', 'An original browser-native text adventure inspired by classic command-line games.'),
		output('text', ''),
		...describe(state, 'west-of-house'),
		output('text', ''),
		output('cyan', "Type 'help' for commands, 'quit' to exit the game.")
	]);
	return { state, lines };
}

export type AdventureStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function saveAdventure(state: AdventureState, storage: AdventureStorage | null): boolean {
	if (!storage) return false;
	try {
		storage.setItem(ADVENTURE_SAVE_KEY, JSON.stringify({ v: SCHEMA_VERSION, state }));
		return true;
	} catch {
		return false;
	}
}

export function loadAdventure(storage: AdventureStorage | null): AdventureState | null {
	if (!storage) return null;
	try {
		const raw = storage.getItem(ADVENTURE_SAVE_KEY);
		if (!raw) return null;
		const envelope = JSON.parse(raw) as { v?: number; state?: AdventureState };
		if (envelope.v !== SCHEMA_VERSION || !envelope.state || typeof envelope.state !== 'object') return null;
		return envelope.state;
	} catch {
		return null;
	}
}

export function playAdventure(
	state: AdventureState,
	raw: string,
	storage: AdventureStorage | null
): { state: AdventureState | null; lines: TerminalLine[]; exit?: boolean } {
	const trimmed = raw.trim().toLowerCase();
	if (trimmed === 'cancel' || trimmed === 'exit') {
		return { state: null, lines: [{ content: 'Left the adventure.', variant: 'dimmed' }], exit: true };
	}
	if (!raw.trim()) return { state, lines: [] };
	const echo: TerminalLine = { content: `>${raw}`, variant: 'dimmed' };
	const word = trimmed.split(/\s+/)[0] ?? '';
	if (word === 'save') {
		const ok = saveAdventure(state, storage);
		return {
			state,
			lines: [
				echo,
				{
					content: ok ? 'Game saved.' : 'Could not save (storage unavailable).',
					variant: ok ? 'success' : 'error'
				}
			]
		};
	}
	if (word === 'restore' || word === 'load') {
		const loaded = loadAdventure(storage);
		if (!loaded) return { state, lines: [echo, { content: 'No saved game found.', variant: 'error' }] };
		return {
			state: loaded,
			lines: [
				echo,
				{ content: 'Restored.', variant: 'success' },
				{ content: '', variant: 'default' },
				...adventureLines(describe(loaded, loaded.currentRoom))
			]
		};
	}
	if (word === 'restart') {
		const opened = openingAdventure();
		return {
			state: opened.state,
			lines: [echo, { content: 'Game restarted.', variant: 'lambda' }, { content: '', variant: 'default' }, ...opened.lines]
		};
	}
	const result = runAdventure(state, raw);
	const lines = [echo, ...adventureLines(result.lines)];
	if (result.state.gameOver) return { state: null, lines, exit: true };
	return { state: result.state, lines };
}

export function adventureWorldIssues(): string[] {
	const issues: string[] = [];
	const rooms = new Set(Object.keys(ROOMS));
	for (const [roomId, room] of Object.entries(ROOMS)) {
		for (const [direction, target] of Object.entries(room.exits)) {
			if (target && !rooms.has(target)) issues.push(`${roomId} ${direction} → ${target}`);
		}
		for (const itemId of room.initialItems) {
			if (!ITEMS[itemId]) issues.push(`${roomId} item ${itemId}`);
		}
	}
	for (const [itemId, item] of Object.entries(ITEMS)) {
		for (const inner of [...(item.initialContents ?? []), ...(item.under ?? [])]) {
			if (!ITEMS[inner]) issues.push(`${itemId} → ${inner}`);
		}
	}
	return issues;
}
