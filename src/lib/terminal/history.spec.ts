import { describe, expect, it } from 'vitest';
import { createHistory, recallNewer, recallOlder, submitToHistory } from './history';

describe('terminal history', () => {
	it('walks older commands and restores the unsent draft', () => {
		let history = createHistory();
		history = submitToHistory(history, 'help');
		history = submitToHistory(history, 'resume');

		let step = recallOlder(history, 'drafting');
		expect(step.value).toBe('resume');
		step = recallOlder(step.history, 'resume-edited');
		expect(step.value).toBe('help');
		expect(step.history.draft).toBe('drafting');
		step = recallOlder(step.history, 'help-edited');
		expect(step.value).toBe('help-edited');
		expect(step.history.draft).toBe('drafting');

		step = recallNewer(step.history, 'help-edited');
		expect(step.value).toBe('resume');
		step = recallNewer(step.history, 'resume-edited');
		expect(step.value).toBe('drafting');
		step = recallNewer(step.history, 'drafting');
		expect(step.value).toBe('drafting');
	});

	it('ignores blank submissions and stores the typed text', () => {
		let history = createHistory();
		history = submitToHistory(history, '   ');
		expect(history.entries).toEqual([]);
		history = submitToHistory(history, '  help  ');
		expect(history.entries).toEqual(['  help  ']);
		expect(history.index).toBe(-1);
	});
});
