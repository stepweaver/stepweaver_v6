/** index -1 is the unsent draft. 0 is the newest submitted command. */
export type CommandHistory = {
	entries: string[];
	index: number;
	draft: string;
};

export function createHistory(): CommandHistory {
	return { entries: [], index: -1, draft: '' };
}

export function submitToHistory(history: CommandHistory, input: string): CommandHistory {
	if (!input.trim()) return { entries: history.entries, index: -1, draft: '' };
	return { entries: [...history.entries, input], index: -1, draft: '' };
}

export function recallOlder(
	history: CommandHistory,
	current: string
): { history: CommandHistory; value: string } {
	if (history.entries.length === 0 || history.index >= history.entries.length - 1) {
		return { history, value: current };
	}
	const index = history.index + 1;
	return {
		history: {
			entries: history.entries,
			index,
			draft: history.index === -1 ? current : history.draft
		},
		value: history.entries[history.entries.length - 1 - index] ?? current
	};
}

export function recallNewer(
	history: CommandHistory,
	current: string
): { history: CommandHistory; value: string } {
	if (history.index < 0) return { history, value: current };
	if (history.index === 0) {
		return {
			history: { entries: history.entries, index: -1, draft: history.draft },
			value: history.draft
		};
	}
	const index = history.index - 1;
	return {
		history: { entries: history.entries, index, draft: history.draft },
		value: history.entries[history.entries.length - 1 - index] ?? current
	};
}
