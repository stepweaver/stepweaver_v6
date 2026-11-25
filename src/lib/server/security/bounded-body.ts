const DEFAULT_BODY_TIMEOUT_MS = 8_000;

export class BodyTimeoutError extends Error {
	constructor() {
		super('Request body timed out');
		this.name = 'BodyTimeoutError';
	}
}

export async function readBoundedBody(
	request: Request,
	maxBytes: number,
	timeoutMs = DEFAULT_BODY_TIMEOUT_MS
) {
	const reader = request.body?.getReader();
	if (!reader) throw new SyntaxError('Missing request body');
	let timer: ReturnType<typeof setTimeout> | undefined;
	try {
		return await new Promise<Uint8Array<ArrayBuffer>>((resolve, reject) => {
			timer = setTimeout(() => reject(new BodyTimeoutError()), timeoutMs);
			readChunks(reader, maxBytes).then(resolve, reject);
		});
	} finally {
		if (timer) clearTimeout(timer);
		void reader.cancel().catch(() => {});
	}
}

async function readChunks(
	reader: ReadableStreamDefaultReader<Uint8Array>,
	maxBytes: number
): Promise<Uint8Array<ArrayBuffer>> {
	const bytes = new Uint8Array(maxBytes);
	let length = 0;
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		if (length + value.byteLength > maxBytes) throw new RangeError('Request body is too large');
		bytes.set(value, length);
		length += value.byteLength;
	}
	const copy = new ArrayBuffer(length);
	new Uint8Array(copy).set(bytes.subarray(0, length));
	return new Uint8Array(copy);
}

export async function readBoundedJson(
	request: Request,
	maxBytes: number,
	timeoutMs = DEFAULT_BODY_TIMEOUT_MS
): Promise<unknown> {
	const bytes = await readBoundedBody(request, maxBytes, timeoutMs);
	return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}
