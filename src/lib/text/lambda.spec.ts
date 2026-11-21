import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { LAMBDA, splitLambda, upperLabel } from './lambda';

const sourceRoot = fileURLToPath(new URL('../../..', import.meta.url));

function sourceFiles(dir: string): string[] {
	const found: string[] = [];
	for (const entry of readdirSync(dir)) {
		const path = join(dir, entry);
		if (statSync(path).isDirectory()) {
			found.push(...sourceFiles(path));
			continue;
		}
		if (/\.(svelte|ts|css|html)$/.test(path)) found.push(path);
	}
	return found;
}

describe('lowercase lambda', () => {
	it('uses U+03BB', () => {
		expect(LAMBDA).toBe('λ');
		expect(LAMBDA.codePointAt(0)).toBe(0x03bb);
	});

	it('uppercases surrounding letters and leaves the glyph lowercase', () => {
		expect(upperLabel('λstepweaver // systems')).toBe('λSTEPWEAVER // SYSTEMS');
		expect(upperLabel('Professional Experience')).toBe('PROFESSIONAL EXPERIENCE');
		expect(upperLabel('λstepweaver')).not.toContain(String.fromCodePoint(0x039b));
		expect(splitLambda(`before ${String.fromCodePoint(0x039b)} after`)).toEqual([
			'before ',
			' after'
		]);
	});

	it('keeps U+039B out of the app source', () => {
		const hits = sourceFiles(join(sourceRoot, 'src')).filter((path) =>
			readFileSync(path, 'utf8').includes(String.fromCodePoint(0x039b))
		);
		expect(hits).toEqual([]);
	});
});
