export type SharedChatOpener = (draft: string) => void;

let opener: SharedChatOpener | null = null;
const watchers = new Set<() => void>();

function notify() {
	for (const watcher of watchers) watcher();
}

/**
 * The site widget and the terminal register this when they share one chat backend.
 * The opener receives an editable draft. It does not send the message.
 */
export function registerSharedChatDraft(next: SharedChatOpener): () => void {
	opener = next;
	notify();
	return () => {
		if (opener !== next) return;
		opener = null;
		notify();
	};
}

export function sharedChatReady(): boolean {
	return opener !== null;
}

export function watchSharedChat(listener: () => void): () => void {
	watchers.add(listener);
	return () => {
		watchers.delete(listener);
	};
}

export function openSharedChatDraft(draft: string): boolean {
	if (!opener) return false;
	opener(draft);
	return true;
}
