export async function readBoundedBody(request: Request, maxBytes: number) {
	const reader = request.body?.getReader();
	if (!reader) throw new SyntaxError('Missing request body');
	const bytes = new Uint8Array(maxBytes);
	let length = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			if (length + value.byteLength > maxBytes) throw new RangeError('Request body is too large');
			bytes.set(value, length);
			length += value.byteLength;
		}
		return bytes.subarray(0, length);
	} finally {
		void reader.cancel().catch(() => {});
	}
}

export async function readBoundedJson(request: Request, maxBytes: number): Promise<unknown> {
	const bytes = await readBoundedBody(request, maxBytes);
	return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}
