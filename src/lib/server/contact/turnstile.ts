export async function verifyTurnstileToken(
	token: string,
	ip: string,
	secret: string,
	fetchImpl: typeof fetch = fetch
): Promise<boolean> {
	try {
		const response = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
			method: 'POST',
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				secret,
				response: token,
				remoteip: ip
			}),
			signal: AbortSignal.timeout(8000)
		});
		if (!response.ok) return false;
		const data = (await response.json()) as { success?: boolean };
		return data.success === true;
	} catch {
		return false;
	}
}
