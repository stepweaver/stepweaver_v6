export const CONTACT_INTENTS = ['consult', 'hire', 'general'] as const;
export type ContactIntent = (typeof CONTACT_INTENTS)[number];

export type ContactFields = {
	name: string;
	email: string;
	message: string;
	intent: ContactIntent;
};

export type FieldErrors = Partial<Record<'name' | 'email' | 'message' | 'intent', string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function stripHeader(value: string): string {
	return value.replace(/[\r\n\0]+/g, ' ').trim();
}

export function parseIntent(value: string | null | undefined): ContactIntent | null {
	const intent = (value ?? '').trim().toLowerCase();
	if (!intent || intent === 'consult') return 'consult';
	if (intent === 'hire' || intent === 'brief') return 'hire';
	if (intent === 'general') return 'general';
	return null;
}

export function validateContactFields(input: {
	name: string;
	email: string;
	message: string;
	intent: string | null;
}): { value?: ContactFields; fieldErrors: FieldErrors } {
	const fieldErrors: FieldErrors = {};
	const name = stripHeader(input.name);
	const email = stripHeader(input.email).toLowerCase();
	const message = input.message.replace(/\0/g, '').trim();
	const intent = parseIntent(input.intent);

	if (!name) fieldErrors.name = 'Enter your name.';
	else if (name.length > 200) fieldErrors.name = 'Name must be 200 characters or fewer.';
	if (!email || !EMAIL.test(email) || email.length > 200) {
		fieldErrors.email = 'Enter a valid email address.';
	}
	if (!message) fieldErrors.message = 'Enter a message.';
	else if (message.length > 5000)
		fieldErrors.message = 'Message must be 5,000 characters or fewer.';
	if (!intent) fieldErrors.intent = 'Choose consulting, hiring, or general.';

	if (Object.keys(fieldErrors).length || !intent) return { fieldErrors };
	return { fieldErrors, value: { name, email, message, intent } };
}
