const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const PRODUCTION_HOSTS = ['stepweaver.dev', 'www.stepweaver.dev'];

export type TurnstileExpectation = {
	hostnames: string[];
	action: string;
};

type SiteverifyResponse = {
	success?: boolean;
	hostname?: string;
	action?: string;
	'error-codes'?: string[];
};

/** Hosts that may have rendered the contact challenge for this request. */
export function turnstileHostnames(hostname: string, dev: boolean): string[] {
	const host = hostname.trim().toLowerCase();
	const names = new Set<string>();
	if (host) names.add(host);
	if (PRODUCTION_HOSTS.includes(host)) {
		for (const name of PRODUCTION_HOSTS) names.add(name);
	}
	if (dev && (host === 'localhost' || host === '127.0.0.1')) {
		names.add('localhost');
		names.add('127.0.0.1');
	}
	return [...names];
}

export async function verifyTurnstileToken(
	token: string,
	ip: string,
	secret: string,
	expected: TurnstileExpectation,
	fetchImpl: typeof fetch = fetch
): Promise<boolean> {
	if (!token || token.length > 2048) return false;
	const allowed = new Set(expected.hostnames.map((host) => host.toLowerCase()));
	if (!expected.action || allowed.size === 0) return false;
	try {
		const response = await fetchImpl(SITEVERIFY, {
			method: 'POST',
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				secret,
				response: token,
				remoteip: ip
			}),
			redirect: 'manual',
			signal: AbortSignal.timeout(8000)
		});
		if (!response.ok) return false;
		const data = (await response.json()) as SiteverifyResponse;
		if (data.success !== true) return false;
		const hostname = data.hostname?.trim().toLowerCase() ?? '';
		if (!hostname || !allowed.has(hostname)) return false;
		if (data.action !== expected.action) return false;
		return true;
	} catch {
		return false;
	}
}
