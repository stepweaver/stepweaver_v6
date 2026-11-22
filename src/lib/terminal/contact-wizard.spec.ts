import { describe, expect, it } from 'vitest';
import { advanceContact, startContact } from '$lib/terminal/contact-wizard';
import { submitLine, replaceInput, createSession } from '$lib/terminal/session';

describe('contact wizard', () => {
	it('rejects a bad email and can be cancelled without leaving the shell', () => {
		const started = startContact(1_000);
		const named = advanceContact(started.draft, 'Ada');
		expect(named.draft?.step).toBe('email');
		const invalid = advanceContact(named.draft!, 'not-an-email');
		expect(invalid.draft?.step).toBe('email');
		expect(invalid.lines[0]?.content).toContain('valid email');
		const cancelled = advanceContact(invalid.draft!, 'cancel');
		expect(cancelled.exit).toBe(true);
		expect(cancelled.draft).toBeNull();
	});

	it('reaches send with consult, hire, or general', () => {
		let draft = startContact(1_000).draft;
		draft = advanceContact(draft, 'Ada').draft!;
		draft = advanceContact(draft, 'ada@example.com').draft!;
		draft = advanceContact(draft, '2').draft!;
		expect(draft.intent).toBe('hire');
		const ready = advanceContact(draft, 'Hello from the terminal');
		expect(ready.draft?.step).toBe('confirm');
		const sending = advanceContact(ready.draft!, 'send');
		expect(sending.effect?.type).toBe('contact-send');
	});

	it('stays in the terminal session after cancel', () => {
		let session = submitLine(replaceInput(createSession(), 'contact'), { clock: () => 5_000 });
		expect(session.mode).toBe('contact');
		session = submitLine(replaceInput(session, 'cancel'));
		expect(session.mode).toBe('shell');
		session = submitLine(replaceInput(session, 'help'));
		expect(session.lines.map((line) => line.content).join('\n')).toContain('Available commands:');
	});
});
