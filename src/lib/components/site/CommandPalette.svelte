<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { tick } from 'svelte';
	import { onMount } from 'svelte';
	import { openSharedChatDraft, sharedChatReady, watchSharedChat } from '$lib/chat/shared-draft';
	import { onPaletteToggle } from '$lib/components/site/palette-bus';
	import LambdaText from '$lib/components/site/LambdaText.svelte';
	import {
		paletteFrame,
		paletteGroups,
		type PaletteEntry,
		type PaletteProject,
		type PaletteWriting
	} from '$lib/search/palette';
	import { DESTINATION_ALIASES, SHELL_DESTINATIONS } from '$lib/terminal/routes';
	import { applyTheme, currentTheme, toggleLightDark } from '$lib/theme/apply-theme';
	import { THEME_IDS } from '$lib/theme/themes';

	type PaletteData = {
		writing?: PaletteWriting[];
		projects?: PaletteProject[];
	};

	let open = $state(false);
	let query = $state('');
	let selected = $state(0);
	let chat = $state(false);
	let frame = $state({ top: 8, maxHeight: 480 });
	let inputEl = $state<HTMLInputElement | null>(null);
	let restoreFocus: HTMLElement | null = null;
	let openedAt = '';

	const path = $derived(page.url.pathname);
	const sources = $derived.by(() => {
		const data = page.data as { commandPalette?: PaletteData };
		return {
			writing: data.commandPalette?.writing ?? [],
			projects: data.commandPalette?.projects ?? []
		};
	});
	const groups = $derived(
		paletteGroups({
			destinations: SHELL_DESTINATIONS,
			aliases: DESTINATION_ALIASES,
			writing: sources.writing,
			projects: sources.projects,
			themes: THEME_IDS,
			chat,
			query
		})
	);
	const flat = $derived(groups.flatMap((group) => group.items));
	const localCount = $derived(flat.filter((item) => item.action.kind !== 'ask').length);
	const rows = $derived.by(() => {
		const out: Array<
			| { kind: 'header'; key: string; label: string }
			| { kind: 'item'; key: string; item: PaletteEntry; index: number }
		> = [];
		let index = 0;
		for (const group of groups) {
			out.push({ kind: 'header', key: `header-${group.label}`, label: group.label });
			for (const item of group.items) {
				out.push({ kind: 'item', key: item.id, item, index });
				index += 1;
			}
		}
		return out;
	});

	$effect(() => {
		if (open && path !== openedAt) closePalette();
	});

	$effect(() => {
		const last = Math.max(0, flat.length - 1);
		if (selected > last) selected = last;
	});

	$effect(() => {
		if (!open) return;
		const index = selected;
		document.getElementById(`palette-option-${index}`)?.scrollIntoView({ block: 'nearest' });
	});

	$effect(() => {
		if (!open || typeof window === 'undefined') return;
		const visual = window.visualViewport;
		const sync = () => {
			frame = paletteFrame({
				height: visual?.height ?? window.innerHeight,
				offsetTop: visual?.offsetTop ?? 0,
				layoutHeight: window.innerHeight
			});
		};
		sync();
		visual?.addEventListener('resize', sync);
		visual?.addEventListener('scroll', sync);
		window.addEventListener('resize', sync);
		const previous = document.documentElement.style.overflow;
		document.documentElement.style.overflow = 'hidden';
		return () => {
			visual?.removeEventListener('resize', sync);
			visual?.removeEventListener('scroll', sync);
			window.removeEventListener('resize', sync);
			document.documentElement.style.overflow = previous;
		};
	});

	function openPalette() {
		restoreFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		openedAt = path;
		query = '';
		selected = 0;
		open = true;
		void tick().then(() => inputEl?.focus());
	}

	function closePalette(keepFocus = false) {
		const target = keepFocus ? null : restoreFocus;
		restoreFocus = null;
		open = false;
		query = '';
		selected = 0;
		if (!target || target === document.body || target === document.documentElement) return;
		void tick().then(() => {
			if (target.isConnected) target.focus();
		});
	}

	function togglePalette() {
		if (open) closePalette();
		else openPalette();
	}

	function move(delta: number) {
		if (flat.length === 0) return;
		selected = Math.min(flat.length - 1, Math.max(0, selected + delta));
	}

	function isEnter(event: KeyboardEvent) {
		return event.key === 'Enter' || event.key === 'NumpadEnter' || event.code === 'Enter';
	}

	function run(entry: PaletteEntry | undefined) {
		if (!entry) return;
		if (entry.action.kind === 'ask') {
			const draft = entry.action.draft;
			closePalette(true);
			openSharedChatDraft(draft);
			return;
		}
		if (entry.action.kind === 'theme') {
			applyTheme(entry.action.theme);
			closePalette();
			return;
		}
		if (entry.action.kind === 'theme-toggle') {
			applyTheme(toggleLightDark(currentTheme()));
			closePalette();
			return;
		}
		const { href, external } = entry.action;
		closePalette();
		if (external) {
			window.open(href, '_blank', 'noopener,noreferrer');
			return;
		}
		void goto(href);
	}

	function onInputKey(event: KeyboardEvent) {
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			move(1);
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			move(-1);
		} else if (isEnter(event) && !event.isComposing) {
			event.preventDefault();
			run(flat[selected]);
		}
	}

	function onQueryInput() {
		selected = 0;
	}

	onMount(() => {
		chat = sharedChatReady();
		const stopWatch = watchSharedChat(() => {
			chat = sharedChatReady();
		});
		const stopToggle = onPaletteToggle(togglePalette);
		const onKey = (event: KeyboardEvent) => {
			if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
				event.preventDefault();
				event.stopPropagation();
				togglePalette();
				return;
			}
			if (event.key === 'Escape' && open) {
				event.preventDefault();
				event.stopPropagation();
				closePalette();
				return;
			}
			if (!open || event.target === inputEl) return;
			if (event.key === 'ArrowDown') {
				event.preventDefault();
				move(1);
			} else if (event.key === 'ArrowUp') {
				event.preventDefault();
				move(-1);
			} else if (isEnter(event)) {
				event.preventDefault();
				run(flat[selected]);
			}
		};
		window.addEventListener('keydown', onKey, true);
		return () => {
			stopWatch();
			stopToggle();
			window.removeEventListener('keydown', onKey, true);
		};
	});
</script>

<button type="button" class="palette-trigger" aria-expanded={open} onclick={togglePalette}>
	Ctrl+K
</button>

{#if open}
	<button
		type="button"
		class="backdrop"
		aria-label="Close command palette"
		onclick={() => closePalette()}
	></button>
	<div
		class="palette"
		role="dialog"
		aria-modal="true"
		aria-label="Command palette"
		style:top="{frame.top}px"
		style:max-height="{frame.maxHeight}px"
	>
		<div class="field">
			<input
				bind:this={inputEl}
				bind:value={query}
				role="combobox"
				aria-expanded="true"
				aria-controls="palette-results"
				aria-autocomplete="list"
				aria-label="Search"
				aria-activedescendant={flat.length > 0 ? `palette-option-${selected}` : undefined}
				placeholder="Pages, writing, and themes"
				autocomplete="off"
				autocorrect="off"
				spellcheck="false"
				enterkeyhint="go"
				inputmode="search"
				oninput={onQueryInput}
				onkeydown={onInputKey}
			/>
			<span class="hint">Esc</span>
		</div>
		<div class="results">
			{#if localCount === 0}
				<p class="empty">No results</p>
			{/if}
			<div id="palette-results" role="listbox" aria-label="Commands">
				{#each rows as row (row.key)}
					{#if row.kind === 'header'}
						<div class="group-label" role="presentation">{row.label}</div>
					{:else}
						<button
							type="button"
							id="palette-option-{row.index}"
							class="option"
							role="option"
							aria-selected={row.index === selected}
							data-palette-index={row.index}
							tabindex={-1}
							onpointerdown={(event) => {
								if (event.pointerType === 'mouse') event.preventDefault();
							}}
							onmouseenter={() => (selected = row.index)}
							onclick={() => run(row.item)}
						>
							<span class="option-label"><LambdaText text={row.item.label} /></span>
							{#if row.item.meta}
								<span class="option-meta">{row.item.meta}</span>
							{/if}
						</button>
					{/if}
				{/each}
			</div>
		</div>
		<div class="footer">
			<span>arrows select</span>
			<span>enter open</span>
			<span>esc close</span>
		</div>
	</div>
{/if}

<style>
	.palette-trigger {
		position: fixed;
		inset-block-end: var(--space-md);
		inset-inline-end: var(--space-md);
		z-index: 30;
		border: 1px solid var(--border-muted);
		background: var(--surface);
		color: var(--text-muted);
		padding: 0.4rem 0.6rem;
		font-family: var(--font-family-ocr);
		font-size: var(--font-size-xs);
	}

	@media (width < 64rem) {
		.palette-trigger {
			display: none;
		}
	}

	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 10000;
		background: rgb(0 0 0 / 0.62);
		cursor: default;
	}

	.palette {
		position: fixed;
		inset-inline-start: 50%;
		z-index: 10001;
		display: flex;
		flex-direction: column;
		inline-size: min(40rem, calc(100vw - 1rem));
		overflow: hidden;
		transform: translateX(-50%);
		border: 1px solid color-mix(in oklch, var(--neon) 45%, transparent);
		background: var(--canvas);
		color: var(--text);
	}

	.field {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		flex-shrink: 0;
		padding: var(--space-sm) var(--space-md);
		border-block-end: 1px solid var(--border-muted);
	}

	.field:focus-within {
		box-shadow: inset 0 -2px 0 var(--neon);
	}

	input {
		flex: 1;
		min-inline-size: 0;
		border: 0;
		outline: none;
		background: transparent;
		font-family: var(--font-family-ibm);
		font-size: var(--font-size-sm);
	}

	.hint,
	.group-label,
	.option-meta,
	.footer,
	.empty {
		font-family: var(--font-family-ocr);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
	}

	.hint,
	.footer,
	.empty {
		color: var(--text-muted);
		font-size: var(--font-size-xs);
	}

	.results {
		flex: 1 1 auto;
		min-block-size: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
	}

	.empty {
		padding: var(--space-md);
	}

	.group-label {
		position: sticky;
		inset-block-start: 0;
		z-index: 1;
		padding: 0.35rem var(--space-md);
		border-block-end: 1px solid color-mix(in oklch, var(--border) 25%, transparent);
		background: var(--canvas);
		color: color-mix(in oklch, var(--neon) 70%, transparent);
		font-size: 0.65rem;
		letter-spacing: var(--letter-spacing-label);
	}

	.option {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-sm);
		inline-size: 100%;
		padding: 0.55rem var(--space-md);
		border-inline-start: 4px solid transparent;
		text-align: start;
		font-family: var(--font-family-ibm);
		font-size: var(--font-size-sm);
	}

	.option[aria-selected='true'] {
		border-inline-start-color: var(--neon);
		background: color-mix(in oklch, var(--neon) 22%, transparent);
		color: var(--neon);
	}

	.option-label {
		min-inline-size: 0;
	}

	.option-meta {
		flex-shrink: 0;
		max-inline-size: 40%;
		overflow: hidden;
		color: var(--text-meta);
		font-size: 0.65rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.option[aria-selected='true'] .option-meta {
		color: var(--neon);
	}

	.footer {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm) var(--space-md);
		flex-shrink: 0;
		padding: 0.4rem var(--space-md);
		border-block-start: 1px solid var(--border-muted);
	}
</style>
