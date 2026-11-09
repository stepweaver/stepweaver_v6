import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { resumeData } from '$lib/data/resume-data';
import { buildResumePdf, pdfSafe } from './pdf';

describe('resume draft pdf', () => {
	it('keeps the production file and builds a labeled draft from the page data', () => {
		const current = readFileSync('static/weaver_resume.pdf');
		expect(current.subarray(0, 5).toString()).toBe('%PDF-');

		const draft = buildResumePdf();
		expect(draft.startsWith('%PDF-1.4')).toBe(true);
		expect(draft).toContain('DRAFT - pending editorial review');
		expect(draft).toContain('Not a replacement for the production PDF');
		expect(draft).toContain(pdfSafe(resumeData.identity.subtitle));
		expect(draft).toContain('University of Notre Dame');
		expect(draft).toContain('Cryptologic Linguist');
		expect(draft).toContain('Grand Valley State University');
		expect(draft).toContain('Business analysis and software engineering are one practice');
		expect(draft).not.toContain('99%');
		const start = Number(draft.match(/startxref\n(\d+)/)?.[1]);
		expect(draft.slice(start, start + 4)).toBe('xref');
		const offsets = [...draft.matchAll(/\n(\d{10}) 00000 n /g)].map((match) => Number(match[1]));
		expect(offsets.length).toBeGreaterThan(4);
		for (const offset of offsets) {
			expect(draft.slice(offset, offset + 12)).toMatch(/^\d+ 0 obj/);
		}
	});
});
