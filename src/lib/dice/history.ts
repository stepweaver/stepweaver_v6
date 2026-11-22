import type { RollBreakdown, RollGroup, RollKind, RollResult } from './engine';

export const DICE_HISTORY_KEY = 'diceRollerHistory';
export const DICE_HISTORY_LIMIT = 10;
/** v5 saved the roll note at up to 150 characters. History edits used 100. Keep 150 so a stored note survives a reload. */
export const MAX_HISTORY_COMMENT = 150;

export function rememberRoll(history: RollResult[], result: RollResult): RollResult[] {
	return [result, ...history].slice(0, DICE_HISTORY_LIMIT);
}

export function serializeRollHistory(history: RollResult[]): string {
	return JSON.stringify(history.slice(0, DICE_HISTORY_LIMIT));
}

export function parseRollHistory(raw: string | null): RollResult[] {
	if (!raw) return [];
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return [];
	}
	if (!Array.isArray(parsed)) return [];
	const rolls: RollResult[] = [];
	for (const item of parsed) {
		const roll = asRollResult(item);
		if (roll) rolls.push(roll);
		if (rolls.length >= DICE_HISTORY_LIMIT) break;
	}
	return rolls;
}

function asRollResult(value: unknown): RollResult | null {
	if (!value || typeof value !== 'object') return null;
	const record = value as Record<string, unknown>;
	if (typeof record.notation !== 'string' || !record.notation.trim()) return null;
	if (typeof record.total !== 'number' || !Number.isFinite(record.total)) return null;
	if (typeof record.subtotal !== 'number' || !Number.isFinite(record.subtotal)) return null;
	if (typeof record.modifier !== 'number' || !Number.isFinite(record.modifier)) return null;
	const breakdown = asBreakdown(record.breakdown);
	const rolls = asGroups(record.rolls);
	if (!breakdown || !rolls) return null;
	const kind = asKind(record.kind);
	const comment =
		typeof record.comment === 'string' ? record.comment.slice(0, MAX_HISTORY_COMMENT) : undefined;
	const timestamp = typeof record.timestamp === 'string' ? record.timestamp : undefined;
	return {
		notation: record.notation,
		kind,
		rolls,
		modifier: record.modifier,
		subtotal: record.subtotal,
		total: record.total,
		breakdown,
		timestamp,
		comment
	};
}

function asKind(value: unknown): RollKind | undefined {
	if (value === 'notation' || value === 'advantage' || value === 'disadvantage') return value;
	return undefined;
}

function asBreakdown(value: unknown): RollBreakdown[] | null {
	if (!Array.isArray(value)) return null;
	const groups: RollBreakdown[] = [];
	for (const item of value) {
		if (!item || typeof item !== 'object') return null;
		const record = item as Record<string, unknown>;
		if (typeof record.notation !== 'string') return null;
		if (typeof record.subtotal !== 'number') return null;
		if (!Array.isArray(record.results) || record.results.some((die) => typeof die !== 'number'))
			return null;
		groups.push({
			notation: record.notation,
			results: record.results as number[],
			subtotal: record.subtotal
		});
	}
	return groups;
}

function asGroups(value: unknown): RollGroup[] | null {
	if (!Array.isArray(value)) return null;
	const groups: RollGroup[] = [];
	for (const item of value) {
		if (!item || typeof item !== 'object') return null;
		const record = item as Record<string, unknown>;
		if (typeof record.sides !== 'number' || typeof record.count !== 'number') return null;
		if (typeof record.subtotal !== 'number') return null;
		if (!Array.isArray(record.results) || record.results.some((die) => typeof die !== 'number'))
			return null;
		groups.push({
			sides: record.sides,
			count: record.count,
			results: record.results as number[],
			subtotal: record.subtotal
		});
	}
	return groups;
}
