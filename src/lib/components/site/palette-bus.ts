type Listener = () => void;

let listener: Listener | null = null;

export function onPaletteToggle(next: Listener) {
	listener = next;
	return () => {
		if (listener === next) listener = null;
	};
}

export function requestPaletteToggle() {
	listener?.();
}
