/** Lowercase Greek lambda. Visible UI must not use U+039B. */
export const LAMBDA = '\u03BB';

export function splitLambda(text: string): string[] {
	return text.replaceAll(String.fromCodePoint(0x039b), LAMBDA).split(LAMBDA);
}

/** Uppercase a label without turning a lowercase lambda into U+039B. */
export function upperLabel(value: string): string {
	return splitLambda(value)
		.map((part) => part.toUpperCase())
		.join(LAMBDA);
}
