import type { ContactFields } from './schema';

export type OutboundMail = {
	from: string;
	to: string;
	replyTo: string;
	subject: string;
	html: string;
	text: string;
};

export type Mailer = {
	send(mail: OutboundMail): Promise<void>;
};

const INTENT_LABEL: Record<ContactFields['intent'], string> = {
	consult: 'Consulting inquiry',
	hire: 'Hiring conversation',
	general: 'General note'
};

export function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}

export function renderContactMail(
	fields: ContactFields
): Pick<OutboundMail, 'subject' | 'html' | 'text'> {
	const label = INTENT_LABEL[fields.intent];
	const subject = `${label} from ${fields.name}`.slice(0, 180);
	const text = `${label}\nName: ${fields.name}\nEmail: ${fields.email}\n\n${fields.message}`;
	const html = `<p><strong>${escapeHtml(label)}</strong></p><p>Name: ${escapeHtml(fields.name)}<br>Email: ${escapeHtml(fields.email)}</p><pre>${escapeHtml(fields.message)}</pre>`;
	return { subject, html, text };
}

export function createMockMailer(): Mailer & { sent: OutboundMail[] } {
	const sent: OutboundMail[] = [];
	return {
		sent,
		async send(mail) {
			if (mail.text.includes('[[force-fail]]')) {
				throw new Error('mock delivery failure');
			}
			sent.push(mail);
		}
	};
}

export async function sendWithResend(
	apiKey: string,
	mail: OutboundMail,
	fetchImpl: typeof fetch = fetch
): Promise<void> {
	const response = await fetchImpl('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			from: mail.from,
			to: [mail.to],
			reply_to: mail.replyTo,
			subject: mail.subject,
			html: mail.html,
			text: mail.text
		})
	});
	if (!response.ok) throw new Error('Email provider rejected the message');
}
