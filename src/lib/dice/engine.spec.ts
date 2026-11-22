import { describe, expect, it } from 'vitest';
import { evaluateKeep, evaluateNotation, parseDiceNotation, rerollWithHeldDice } from './engine';
import { parseRollHistory, serializeRollHistory } from './history';

describe('dice notation', () => {
	it('parses the v5 forms', () => {
		expect(parseDiceNotation('3d6')).toEqual({
			groups: [{ sides: 6, count: 3 }],
			modifier: 0,
			notation: '3d6'
		});
		expect(parseDiceNotation('3d6+1d20+2').groups).toEqual([
			{ count: 3, sides: 6 },
			{ count: 1, sides: 20 }
		]);
		expect(parseDiceNotation('3d6+1d20+2').modifier).toBe(2);
		expect(parseDiceNotation('1d20-3').modifier).toBe(-3);
		expect(parseDiceNotation('  2d6 + 1 ').notation).toBe('2d6+1');
		expect(parseDiceNotation('d8').groups).toEqual([{ count: 1, sides: 8 }]);
	});

	it('names what is wrong with invalid notation', () => {
		expect(() => parseDiceNotation('2d6foo')).toThrow(/not dice notation/);
		expect(() => parseDiceNotation('1d1')).toThrow(/at least 2 sides/);
		expect(() => parseDiceNotation('0d6')).toThrow(/at least 1/);
		expect(() => parseDiceNotation('+2')).toThrow(/No dice/);
		expect(() => parseDiceNotation('')).toThrow(/3d6\+2/);
	});

	it('keeps the high or low d20 and breaks down every die', () => {
		const rolls = [4, 18, 6, 1];
		const source = () => rolls.shift() ?? 1;
		const advantage = evaluateKeep('advantage', source, '2026-01-01T00:00:00.000Z');
		expect(advantage.total).toBe(18);
		expect(advantage.rolls[0]?.results).toEqual([4, 18]);
		const normal = evaluateNotation('2d6+1', source, '2026-01-01T00:00:00.000Z');
		expect(normal.total).toBe(8);
		expect(normal.breakdown[0]?.results).toEqual([6, 1]);
		const rerolled = rerollWithHeldDice(
			normal,
			new Set(['0-0']),
			() => 5,
			'2026-01-02T00:00:00.000Z'
		);
		expect(rerolled.breakdown[0]?.results).toEqual([6, 5]);
		expect(rerolled.total).toBe(12);
	});

	it('loads a v5 history record and drops a corrupt one', () => {
		const saved = serializeRollHistory([
			{
				notation: '2d6+1',
				rolls: [{ sides: 6, count: 2, results: [3, 4], subtotal: 7 }],
				modifier: 1,
				subtotal: 7,
				total: 8,
				breakdown: [{ notation: '2d6', results: [3, 4], subtotal: 7 }],
				timestamp: '2026-01-01T00:00:00.000Z',
				comment: 'door'
			}
		]);
		const mixed = JSON.parse(saved) as unknown[];
		mixed.push({ notation: 'broken' });
		const loaded = parseRollHistory(JSON.stringify(mixed));
		expect(loaded).toHaveLength(1);
		expect(loaded[0]?.comment).toBe('door');
		expect(loaded[0]?.kind).toBeUndefined();
		expect(loaded[0]?.total).toBe(8);
		expect(parseRollHistory('not json')).toEqual([]);

		const note = 'x'.repeat(150);
		const legacy = parseRollHistory(
			JSON.stringify([
				{
					notation: '1d20-3',
					rolls: [{ sides: 20, count: 1, results: [12], subtotal: 12 }],
					modifier: -3,
					subtotal: 12,
					total: 9,
					breakdown: [{ notation: '1d20', results: [12], subtotal: 12 }],
					timestamp: '2024-05-06T07:08:09.000Z',
					comment: note
				}
			])
		);
		expect(legacy[0]?.comment).toBe(note);
		expect(legacy[0]?.modifier).toBe(-3);
		expect(legacy[0]?.total).toBe(9);
	});
});
