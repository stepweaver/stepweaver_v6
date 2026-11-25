/** Cache public writing data, never whole HTML responses or credentials. */
export interface WritingKV {
	get(key: string): Promise<string | null>;
	put(key: string, value: string, options: { expirationTtl: number }): Promise<unknown>;
}

export type CacheOptions = {
	cache?: WritingKV;
	waitUntil?: (promise: Promise<unknown>) => void;
	/** Homepage: a cold cache must not block the rest of the page. */
	nonBlocking?: boolean;
	now?: number;
};

type Entry<T> = { at: number; value: T };
export const FRESH_MS = 5 * 60_000;
export const MAX_AGE_MS = 30 * 60_000;
const KV_TIMEOUT_MS = 300;
const RETRY_MS = 30_000;
const MAX_MEMORY_ENTRIES = 128;
const memory = new Map<string, Entry<unknown>>();
const refreshing = new Map<string, Promise<Entry<unknown> | undefined>>();
const retryAfter = new Map<string, number>();

export function clearCache(): void {
	memory.clear();
	refreshing.clear();
	retryAfter.clear();
}

export async function within<T>(promise: Promise<T>, ms: number): Promise<T> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	try {
		return await Promise.race([
			promise,
			new Promise<never>((_, reject) => {
				timer = setTimeout(() => reject(new Error('Writing operation timed out')), ms);
			})
		]);
	} finally {
		clearTimeout(timer);
	}
}

function remember<T>(key: string, entry: Entry<T>): void {
	memory.delete(key);
	memory.set(key, entry);
	if (memory.size > MAX_MEMORY_ENTRIES) memory.delete(memory.keys().next().value!);
}

export async function cachedWriting<T>(
	key: string,
	options: CacheOptions,
	validate: (value: unknown) => value is T,
	load: () => Promise<T>
): Promise<{ value: T; stale: boolean } | undefined> {
	const now = () => options.now ?? Date.now();
	const usable = (entry: Entry<unknown> | undefined): entry is Entry<T> =>
		!!entry &&
		Number.isFinite(entry.at) &&
		entry.at <= now() &&
		now() - entry.at < MAX_AGE_MS &&
		validate(entry.value);
	let saved = memory.get(key);
	if (!usable(saved) || now() - saved.at >= FRESH_MS) {
		if (options.cache) {
			try {
				const raw = await within(options.cache.get(key), KV_TIMEOUT_MS);
				const parsed: unknown = raw ? JSON.parse(raw) : undefined;
				const candidate =
					parsed && typeof parsed === 'object' ? (parsed as Entry<unknown>) : undefined;
				if (usable(candidate) && (!usable(saved) || candidate.at > saved.at)) {
					saved = candidate;
					remember(key, candidate);
				}
			} catch {
				console.error('Writing cache read failed');
			}
		}
	}
	const cached = usable(saved) ? saved : undefined;
	if (cached && now() - cached.at < FRESH_MS) return { value: cached.value, stale: false };
	if ((retryAfter.get(key) ?? 0) > now()) {
		return cached ? { value: cached.value, stale: true } : undefined;
	}

	let refresh = refreshing.get(key) as Promise<Entry<T> | undefined> | undefined;
	if (!refresh) {
		refresh = (async () => {
			try {
				const value = await load();
				const entry = { at: now(), value };
				remember(key, entry);
				retryAfter.delete(key);
				if (options.cache) {
					try {
						await within(
							options.cache.put(key, JSON.stringify(entry), {
								expirationTtl: MAX_AGE_MS / 1000
							}),
							2_000
						);
					} catch {
						// A storage failure must not discard a successful Notion response.
						console.error('Writing cache write failed');
					}
				}
				return entry;
			} catch {
				retryAfter.set(key, now() + RETRY_MS);
				if (retryAfter.size > MAX_MEMORY_ENTRIES)
					retryAfter.delete(retryAfter.keys().next().value!);
				return undefined;
			} finally {
				refreshing.delete(key);
			}
		})();
		refreshing.set(key, refresh);
	}
	// waitUntil keeps the task alive after Cloudflare sends the HTTP response.
	if (options.waitUntil) options.waitUntil(refresh);
	if (options.nonBlocking || (cached && options.waitUntil)) {
		return cached ? { value: cached.value, stale: true } : undefined;
	}
	const updated = await refresh;
	if (updated) return { value: updated.value, stale: false };
	return cached && usable(cached) ? { value: cached.value, stale: true } : undefined;
}
