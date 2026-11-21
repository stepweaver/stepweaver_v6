/** Document scroll progress in [0, 1]. Short pages stay at 0. */
export function documentScrollProgress(
	scrollTop: number,
	scrollHeight: number,
	viewportSize: number
): number {
	const maxScroll = scrollHeight - viewportSize;
	if (maxScroll <= 0) return 0;
	const clamped = Math.min(Math.max(scrollTop, 0), maxScroll);
	return clamped / maxScroll;
}

export function clampProgress(progress: number): number {
	if (!Number.isFinite(progress)) return 0;
	if (progress <= 0) return 0;
	if (progress >= 1) return 1;
	return progress;
}

export function getDocumentScrollProgressY(): number {
	if (typeof window === 'undefined') return 0;
	return documentScrollProgress(
		window.scrollY || 0,
		document.documentElement.scrollHeight,
		window.innerHeight
	);
}
