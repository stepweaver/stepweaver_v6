import { describe, expect, it } from 'vitest';
import { workPageCopy } from './work-copy';

describe('work page copy', () => {
	it('says every record is unpublished when none are approved', () => {
		const copy = workPageCopy(0);
		expect(copy.title).toBe('No case studies are public.');
		expect(copy.explanation).toContain('every one of them is unpublished');
		expect(copy.description).toContain('stay unpublished');
	});

	it('describes a single approved case study without claiming the catalog is public', () => {
		const copy = workPageCopy(1);
		expect(copy.title).toBe('Selected work');
		expect(copy.explanation).toContain('One case study has been reviewed');
		expect(copy.explanation).toContain('Every other project record stays unpublished');
		expect(copy.explanation).not.toContain('every one of them is unpublished');
	});

	it('counts multiple approved case studies and keeps unlisted records unpublished', () => {
		const copy = workPageCopy(3);
		expect(copy.explanation).toContain('3 case studies have been reviewed');
		expect(copy.explanation).toContain('are not listed stay unpublished');
		expect(copy.description).toContain('3 case studies are public');
		expect(copy.explanation).not.toContain('every one of them is unpublished');
	});
});
