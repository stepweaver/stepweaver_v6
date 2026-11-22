import { validateContactFields } from '$lib/contact/fields';
import type { ContactDraft, ShellEffect, TerminalLine } from './types';

export type { ContactDraft };

export function startContact(now: number): { draft: ContactDraft; lines: TerminalLine[] } {
	return {
		draft: { step: 'name', name: '', email: '', intent: '', message: '', openedAt: now },
		lines: [
			line('Contact', 'success'),
			line('This uses the same checks as the contact page.', 'dimmed'),
			line('Step 1/5: What is your name?', 'default'),
			line('Type cancel to stop.', 'dimmed')
		]
	};
}

export function advanceContact(
	draft: ContactDraft,
	input: string
): { draft: ContactDraft | null; lines: TerminalLine[]; effect?: ShellEffect; exit?: boolean } {
	const trimmed = input.trim();
	if (trimmed.toLowerCase() === 'cancel' || trimmed.toLowerCase() === 'escape') {
		return { draft: null, lines: [line('Contact form cancelled.', 'dimmed')], exit: true };
	}
	if (draft.step === 'name') return takeName(draft, trimmed);
	if (draft.step === 'email') return takeEmail(draft, trimmed);
	if (draft.step === 'intent') return takeIntent(draft, trimmed.toLowerCase());
	if (draft.step === 'message') return takeMessage(draft, trimmed);
	return confirm(draft, trimmed.toLowerCase());
}

function takeName(draft: ContactDraft, name: string) {
	const error = validateContactFields({
		name,
		email: 'person@example.com',
		message: 'hello',
		intent: 'consult'
	}).fieldErrors.name;
	if (error) return { draft, lines: [line(error, 'error')] };
	return {
		draft: { ...draft, name, step: 'email' as const },
		lines: [line('Step 2/5: What is your email?')]
	};
}

function takeEmail(draft: ContactDraft, email: string) {
	const error = validateContactFields({
		name: draft.name,
		email,
		message: 'hello',
		intent: 'consult'
	}).fieldErrors.email;
	if (error) return { draft, lines: [line(error, 'error'), line('Step 2/5: What is your email?', 'dimmed')] };
	return {
		draft: { ...draft, email, step: 'intent' as const },
		lines: [
			line('Step 3/5: Consulting, hiring, or general?'),
			line('  1. consult', 'dimmed'),
			line('  2. hire', 'dimmed'),
			line('  3. general', 'dimmed')
		]
	};
}

function chosenIntent(value: string): ContactDraft['intent'] | null {
	if (value === '1' || value === 'consult') return 'consult';
	if (value === '2' || value === 'hire' || value === 'brief') return 'hire';
	if (value === '3' || value === 'general') return 'general';
	return null;
}

function takeIntent(draft: ContactDraft, value: string) {
	const intent = chosenIntent(value);
	if (!intent) {
		return {
			draft,
			lines: [line('Choose consult, hire, or general. Numbers 1, 2, and 3 work too.', 'warning')]
		};
	}
	return {
		draft: { ...draft, intent, step: 'message' as const },
		lines: [line('Step 4/5: Your message:')]
	};
}

function takeMessage(draft: ContactDraft, message: string) {
	const error = validateContactFields({
		name: draft.name,
		email: draft.email,
		message,
		intent: draft.intent || 'consult'
	}).fieldErrors.message;
	if (error) return { draft, lines: [line(error, 'error')] };
	return {
		draft: { ...draft, message, step: 'confirm' as const },
		lines: [line('Step 5/5: Type send to submit, edit to review, or cancel to stop.')]
	};
}

function confirm(draft: ContactDraft, value: string) {
	if (value === 'edit') {
		return {
			draft,
			lines: [
				line(`Name: ${draft.name}`, 'dimmed'),
				line(`Email: ${draft.email}`, 'dimmed'),
				line(`Intent: ${draft.intent}`, 'dimmed'),
				line(`Message: ${draft.message}`, 'dimmed'),
				line('Type send or cancel.', 'dimmed')
			]
		};
	}
	if (value !== 'send') {
		return { draft, lines: [line('Type send, edit, or cancel.', 'warning')] };
	}
	return {
		draft,
		lines: [line('Sending...', 'dimmed')],
		effect: { type: 'contact-send' as const, draft }
	};
}

function line(content: string, variant: TerminalLine['variant'] = 'default'): TerminalLine {
	return { content, variant };
}
