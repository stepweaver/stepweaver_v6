import { describe, expect, it } from 'vitest';
import { createSession, moveNewer, moveOlder, replaceInput, submitLine } from './session';

function text(session: ReturnType<typeof createSession>): string {
	return session.lines.map((line) => line.content).join('\n');
}

describe('terminal session', () => {
	it('echoes help and then removes that transcript on clear', () => {
		let session = createSession();
		expect(text(session)).toContain('Type "help" for available commands.');

		session = submitLine(replaceInput(session, 'help'));
		expect(session.input).toBe('');
		expect(text(session)).toContain('user@stepweaver.dev:~$ help');
		expect(text(session)).toContain('  clear: Clear screen');

		session = submitLine(replaceInput(session, 'nope'));
		expect(text(session)).toContain('Command not found: nope');

		session = submitLine(replaceInput(session, 'clear'));
		expect(text(session)).not.toContain('Available commands:');
		expect(text(session)).not.toContain('Command not found:');
		expect(text(session)).not.toContain('user@stepweaver.dev:~$');
		expect(text(session)).toContain('Type "help" for available commands.');
		expect(session.history.entries).toEqual(['help', 'nope', 'clear']);
	});

	it('recalls submitted commands after clear and restores the draft', () => {
		let session = createSession();
		session = submitLine(replaceInput(session, 'help'));
		session = submitLine(replaceInput(session, 'resume'));
		expect(text(session)).toContain('Current PDF: /weaver_resume.pdf');
		session = submitLine(replaceInput(session, 'clear'));
		session = replaceInput(session, 'drafting');

		session = moveOlder(session);
		expect(session.input).toBe('clear');
		session = moveOlder(session);
		expect(session.input).toBe('resume');
		session = moveOlder(session);
		expect(session.input).toBe('help');
		session = moveNewer(session);
		expect(session.input).toBe('resume');
		session = moveNewer(session);
		expect(session.input).toBe('clear');
		session = moveNewer(session);
		expect(session.input).toBe('drafting');
	});

	it('keeps the draft and history while browsing the codex', () => {
		let session = createSession();
		session = submitLine(replaceInput(session, 'codex'), {
			library: {
				status: 'ok',
				posts: [
					{
						title: 'Workflow handoffs',
						slug: 'workflow-handoffs',
						date: '2026-09-01',
						updated: '2026-09-02',
						excerpt: 'Where a handoff drops the work.',
						tags: ['systems']
					}
				]
			}
		});
		expect(session.mode).toBe('codex');
		expect(text(session)).toContain('1 published post.');
		session = replaceInput(session, 'still drafting');
		session = moveOlder(session);
		expect(session.input).toBe('codex');
		session = moveNewer(session);
		expect(session.input).toBe('still drafting');
	});
});
