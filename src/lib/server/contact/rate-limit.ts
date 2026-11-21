const buckets = new Map<string, number[]>();

export function clearMemoryRateLimit(): void {
	buckets.clear();
}

export function allowMemoryRateLimit(
	key: string,
	limit: number,
	windowMs: number,
	now: number
): boolean {
	const recent = (buckets.get(key) ?? []).filter((stamp) => now - stamp < windowMs);
	if (recent.length >= limit) {
		buckets.set(key, recent);
		return false;
	}
	recent.push(now);
	buckets.set(key, recent);
	return true;
}

export const CONTACT_RATE_LIMIT = 5;
export const CONTACT_RATE_WINDOW_MS = 60_000;
