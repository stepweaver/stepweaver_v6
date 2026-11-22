export const DICE_SIDES = [4, 6, 8, 10, 12, 20, 100] as const;
export const MAX_DICE_COUNT = 100;
export const MAX_DIE_SIDES = 10_000;
export const MIN_MODIFIER = -999;
export const MAX_MODIFIER = 999;

export type DiceGroup = { count: number; sides: number };

export type ParsedNotation = {
	groups: DiceGroup[];
	modifier: number;
	notation: string;
};

export type RollBreakdown = {
	notation: string;
	results: number[];
	subtotal: number;
};

export type RollGroup = {
	sides: number;
	count: number;
	results: number[];
	subtotal: number;
};

export type RollKind = 'notation' | 'advantage' | 'disadvantage';

/** Shape stored under `diceRollerHistory`. Extra fields are optional so older saves still load. */
export type RollResult = {
	notation: string;
	kind?: RollKind;
	rolls: RollGroup[];
	modifier: number;
	subtotal: number;
	total: number;
	breakdown: RollBreakdown[];
	timestamp?: string;
	comment?: string;
};

export type DieSource = (_sides: number) => number;

export function randomIntInclusive(min: number, max: number): number {
	const low = Math.ceil(min);
	const high = Math.floor(max);
	if (!Number.isInteger(low) || !Number.isInteger(high) || high < low) {
		throw new Error(`Invalid random range: [${min}, ${max}]`);
	}
	const range = high - low + 1;
	const cryptoApi = globalThis.crypto;
	if (cryptoApi?.getRandomValues) {
		const maxUint32 = 0xffffffff;
		const bucketSize = Math.floor((maxUint32 + 1) / range);
		const limit = bucketSize * range;
		const buffer = new Uint32Array(1);
		let value: number;
		do {
			cryptoApi.getRandomValues(buffer);
			value = buffer[0] ?? 0;
		} while (value >= limit);
		return low + (value % range);
	}
	return Math.floor(Math.random() * range) + low;
}

export function rollDie(
	sides: number,
	source: DieSource = (value) => randomIntInclusive(1, value)
): number {
	if (!Number.isInteger(sides) || sides < 2) {
		throw new Error(`Invalid die sides: ${sides}`);
	}
	return source(sides);
}

export function notationError(input: string): string | null {
	try {
		parseDiceNotation(input);
		return null;
	} catch (error) {
		return error instanceof Error ? error.message : 'That is not dice notation.';
	}
}

export function parseDiceNotation(input: string): ParsedNotation {
	const compact = input.trim().toLowerCase().replace(/\s+/g, '');
	if (!compact) {
		throw new Error('Enter dice notation such as 3d6+2, 1d20, advantage, or disadvantage.');
	}
	if (!/^(\d*d\d+|[+-]?\d+)([+-](\d*d\d+|\d+))*$/.test(compact)) {
		throw new Error(
			`${input.trim()} is not dice notation. A roll looks like 2d6+1, 1d20-2, or d8.`
		);
	}

	const groups: DiceGroup[] = [];
	let modifier = 0;
	const tokens = compact.match(/[+-]?(?:\d*d\d+|\d+)/g) ?? [];
	tokens.forEach((token, index) => {
		const negative = token.startsWith('-');
		const body = token.replace(/^[+-]/, '');
		if (body.includes('d')) {
			if (negative) {
				throw new Error('Subtract a modifier, as in 1d20-2. A die group cannot be negative.');
			}
			if (index > 0 && !token.startsWith('+') && !token.startsWith('-')) {
				throw new Error(`${input.trim()} is not dice notation. Separate groups with +.`);
			}
			const [countText, sidesText] = body.split('d');
			const count = countText ? Number(countText) : 1;
			const sides = Number(sidesText);
			if (!Number.isInteger(count) || count < 1) {
				throw new Error('Dice count must be at least 1.');
			}
			if (count > MAX_DICE_COUNT) {
				throw new Error(`This roller keeps a single group to ${MAX_DICE_COUNT} dice.`);
			}
			if (!Number.isInteger(sides) || sides < 2) {
				throw new Error('A die needs at least 2 sides.');
			}
			if (sides > MAX_DIE_SIDES) {
				throw new Error(`A die can have at most ${MAX_DIE_SIDES} sides.`);
			}
			groups.push({ count, sides });
			return;
		}
		const value = Number(body);
		if (!Number.isInteger(value)) {
			throw new Error(`${input.trim()} is not dice notation. A roll looks like 2d6+1.`);
		}
		modifier += negative ? -value : value;
	});

	if (groups.length === 0) {
		throw new Error('No dice in that notation. Try 3d6+2, 1d20, advantage, or disadvantage.');
	}
	if (modifier < MIN_MODIFIER || modifier > MAX_MODIFIER) {
		throw new Error(`The modifier must stay between ${MIN_MODIFIER} and ${MAX_MODIFIER}.`);
	}
	return { groups, modifier, notation: canonicalNotation(groups, modifier) };
}

export function canonicalNotation(groups: DiceGroup[], modifier: number): string {
	const body = groups.map((group) => `${group.count}d${group.sides}`).join('+');
	if (modifier === 0) return body;
	return modifier > 0 ? `${body}+${modifier}` : `${body}${modifier}`;
}

export function evaluateNotation(
	input: string,
	source: DieSource = (sides) => randomIntInclusive(1, sides),
	timestamp = new Date().toISOString()
): RollResult {
	const parsed = parseDiceNotation(input);
	const rolls: RollGroup[] = [];
	const breakdown: RollBreakdown[] = [];
	let subtotal = 0;
	for (const group of parsed.groups) {
		const results: number[] = [];
		for (let index = 0; index < group.count; index += 1) {
			results.push(rollDie(group.sides, source));
		}
		const groupTotal = results.reduce((sum, value) => sum + value, 0);
		rolls.push({ sides: group.sides, count: group.count, results, subtotal: groupTotal });
		breakdown.push({
			notation: `${group.count}d${group.sides}`,
			results,
			subtotal: groupTotal
		});
		subtotal += groupTotal;
	}
	return {
		notation: parsed.notation,
		kind: 'notation',
		rolls,
		modifier: parsed.modifier,
		subtotal,
		total: subtotal + parsed.modifier,
		breakdown,
		timestamp
	};
}

export function evaluateKeep(
	kind: 'advantage' | 'disadvantage',
	source: DieSource = (sides) => randomIntInclusive(1, sides),
	timestamp = new Date().toISOString()
): RollResult {
	const first = rollDie(20, source);
	const second = rollDie(20, source);
	const kept = kind === 'advantage' ? Math.max(first, second) : Math.min(first, second);
	const dropped = first === second ? first : first === kept ? second : first;
	return {
		notation: kind,
		kind,
		rolls: [{ sides: 20, count: 2, results: [first, second], subtotal: kept }],
		modifier: 0,
		subtotal: kept,
		total: kept,
		breakdown: [
			{ notation: 'd20 kept', results: [kept], subtotal: kept },
			{ notation: 'd20', results: [dropped], subtotal: dropped }
		],
		timestamp
	};
}

export function formatRollResult(result: RollResult): string {
	if (result.kind === 'advantage' || result.kind === 'disadvantage') {
		const rolls = result.rolls[0]?.results ?? [];
		const label =
			result.kind === 'advantage' ? 'Advantage (2d20 keep high)' : 'Disadvantage (2d20 keep low)';
		const [first, second] = rolls;
		const lines = [`${label}: rolled ${first} and ${second} → ${result.total}`];
		rolls.forEach((value, index) => {
			const kept = value === result.total && (index === 0 || rolls[0] !== result.total);
			lines.push(`  d20 ${index + 1}: ${value}${kept ? ' kept' : ''}`);
		});
		lines.push(`Total: ${result.total}`);
		return lines.join('\n');
	}

	const lines = [`Rolling ${result.notation}:`];
	for (const group of result.breakdown) {
		lines.push(`  ${group.notation}: [${group.results.join(', ')}] = ${group.subtotal}`);
		group.results.forEach((value, index) => {
			lines.push(`    die ${index + 1}: ${value}`);
		});
	}
	if (result.modifier !== 0) {
		const sign = result.modifier > 0 ? '+' : '';
		lines.push(`  Modifier: ${sign}${result.modifier}`);
	}
	lines.push(`Total: ${result.total}`);
	return lines.join('\n');
}

export function rerollWithHeldDice(
	current: RollResult,
	held: ReadonlySet<string>,
	source: DieSource = (sides) => randomIntInclusive(1, sides),
	timestamp = new Date().toISOString()
): RollResult {
	if (current.kind === 'advantage' || current.kind === 'disadvantage') return current;
	if (!current.breakdown.length) return current;
	const breakdown: RollBreakdown[] = [];
	const rolls: RollGroup[] = [];
	let subtotal = 0;
	current.breakdown.forEach((group, groupIndex) => {
		const sidesMatch = group.notation.match(/(\d+)d(\d+)/);
		const sides = sidesMatch ? Number(sidesMatch[2]) : 0;
		const results = group.results.map((value, resultIndex) => {
			if (held.has(`${groupIndex}-${resultIndex}`) || sides < 2) return value;
			return rollDie(sides, source);
		});
		const groupTotal = results.reduce((sum, value) => sum + value, 0);
		breakdown.push({ notation: group.notation, results, subtotal: groupTotal });
		rolls.push({
			sides,
			count: results.length,
			results,
			subtotal: groupTotal
		});
		subtotal += groupTotal;
	});
	return {
		...current,
		rolls,
		breakdown,
		subtotal,
		total: subtotal + current.modifier,
		timestamp
	};
}

export type PoolDie = { sides: number; count: number };

export function notationFromPool(pool: PoolDie[], modifier: number): string {
	const groups = pool.filter((die) => die.count > 0).map((die) => `${die.count}d${die.sides}`);
	if (groups.length === 0) return '';
	const body = groups.join('+');
	if (modifier === 0) return body;
	return modifier > 0 ? `${body}+${modifier}` : `${body}${modifier}`;
}
