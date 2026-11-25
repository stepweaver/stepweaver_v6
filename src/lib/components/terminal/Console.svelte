<script lang="ts">
	import { goto } from '$app/navigation';
	import { env } from '$env/dynamic/public';
	import { onMount, tick } from 'svelte';
	import { mountTurnstile, type TurnstileHandle } from '$lib/contact/turnstile-widget';
	import { PROMPT } from '$lib/terminal/commands';
	import type { CodexLibrary } from '$lib/terminal/codex';
	import { performEffect } from '$lib/terminal/effects';
	import {
		cancelMode,
		createSession,
		moveNewer,
		moveOlder,
		pushLines,
		replaceInput,
		submitLine
	} from '$lib/terminal/session';
	import type { ShellEffect } from '$lib/terminal/types';

	let { library }: { library: CodexLibrary } = $props();

	let session = $state(createSession());
	let inputEl = $state<HTMLInputElement>();
	let screenEl = $state<HTMLDivElement>();
	let turnstileEl = $state<HTMLDivElement>();
	let turnstileToken = $state('');
	let challenge: TurnstileHandle | undefined;
	const siteKey = env.PUBLIC_TURNSTILE_SITE_KEY ?? '';

	async function settleScroll(follow: boolean, anchor: number) {
		await tick();
		const apply = () => {
			const screen = screenEl;
			if (!screen) return;
			if (!follow) {
				screen.scrollTop = anchor;
				return;
			}
			if (screen.scrollTop + 2 < anchor) return;
			screen.scrollTop = screen.scrollHeight;
		};
		apply();
		requestAnimationFrame(() => {
			apply();
			requestAnimationFrame(apply);
		});
	}

	function onInput(event: Event) {
		const target = event.target;
		if (!(target instanceof HTMLInputElement)) return;
		session = replaceInput(session, target.value);
	}

	function placeCaret() {
		void tick().then(() => {
			if (!inputEl) return;
			const end = inputEl.value.length;
			inputEl.setSelectionRange(end, end);
		});
	}

	function onKeydown(event: KeyboardEvent) {
		const typed = inputEl?.value ?? session.input;
		if (event.isComposing) return;
		if (event.key === 'Escape') {
			event.preventDefault();
			session = cancelMode(replaceInput(session, typed));
			return;
		}
		if (event.key === 'Enter') {
			event.preventDefault();
			const screen = screenEl;
			const anchor = screen?.scrollTop ?? 0;
			const follow = !screen || screen.scrollHeight - screen.clientHeight - anchor <= 2;
			session = submitLine(replaceInput(session, typed), { library });
			const effect = session.effect;
			if (effect) session = { ...session, effect: null };
			void settleScroll(follow, anchor);
			if (effect?.type === 'navigate') {
				if (effect.external) window.open(effect.href, '_blank', 'noopener,noreferrer');
				else void goto(effect.href);
			} else if (effect) {
				void runEffect(effect);
			}
			return;
		}
		if (event.key === 'ArrowUp') {
			event.preventDefault();
			session = moveOlder(replaceInput(session, typed));
			placeCaret();
			return;
		}
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			session = moveNewer(replaceInput(session, typed));
			placeCaret();
		}
	}

	async function runEffect(effect: ShellEffect) {
		const screen = screenEl;
		const follow = !screen || screen.scrollHeight - screen.clientHeight - screen.scrollTop <= 2;
		const anchor = screen?.scrollTop ?? 0;
		const outcome = await performEffect(effect, fetch, undefined, turnstileToken);
		if (effect.type === 'contact-send') {
			turnstileToken = '';
			challenge?.reset();
		}
		const patch: {
			mode?: typeof session.mode;
			weather?: typeof session.weather;
			contact?: typeof session.contact;
		} = {};
		if (outcome.mode) patch.mode = outcome.mode;
		if (outcome.weather !== undefined) patch.weather = outcome.weather;
		if (outcome.contact !== undefined) patch.contact = outcome.contact;
		session = pushLines(session, outcome.lines, patch);
		void settleScroll(follow, anchor);
	}

	$effect(() => {
		if (session.mode !== 'contact' || !turnstileEl || !siteKey) return;
		const host = turnstileEl;
		const handle = mountTurnstile(host, siteKey, (token) => {
			turnstileToken = token;
			host.dataset.turnstile = token ? 'ready' : '';
		});
		challenge = handle;
		return () => {
			handle.destroy();
			if (challenge === handle) challenge = undefined;
			turnstileToken = '';
			delete host.dataset.turnstile;
		};
	});

	onMount(() => {
		inputEl?.setAttribute('data-ready', 'true');
		if (window.matchMedia('(pointer: fine)').matches) inputEl?.focus({ preventScroll: true });
	});
</script>

<div class="console-screen" bind:this={screenEl}>
	<div class="log" role="log" aria-label="Terminal transcript">
		{#each session.lines as line (line.id)}
			<p class="line {line.variant}">
				{#if line.href}
					<a href={line.href}>{line.content}</a>
				{:else}
					{line.content}
				{/if}
			</p>
		{/each}
	</div>

	<div class="prompt-row">
		<span class="prompt">{session.mode === 'shell' ? PROMPT : `[${session.mode}]`}</span>
		{#if session.mode === 'contact'}
			<div class="bot-check" bind:this={turnstileEl}></div>
		{/if}
		<input
			bind:this={inputEl}
			value={session.input}
			oninput={onInput}
			onkeydown={onKeydown}
			type="text"
			aria-label="Command"
			autocomplete="off"
			autocapitalize="none"
			autocorrect="off"
			spellcheck="false"
			enterkeyhint="send"
			name="terminal-command"
		/>
	</div>
</div>

<style>
	.console-screen {
		display: flex;
		flex: 1 1 auto;
		flex-direction: column;
		min-block-size: 0;
		min-inline-size: 0;
		overflow: auto;
		overscroll-behavior: contain;
	}

	.log {
		flex: none;
		padding: 0.75rem 0.75rem 0.35rem;
	}

	.line {
		margin: 0;
		min-block-size: 1.25em;
		font-family: var(--font-family-ibm);
		font-size: var(--font-size-sm);
		line-height: 1.45;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}

	.line.default {
		color: var(--text);
	}

	.line.prompt,
	.line.lambda,
	.line.success,
	.prompt {
		color: var(--neon);
	}

	.line.error {
		color: var(--danger);
	}

	.line.warning {
		color: var(--warning);
	}

	.line.dimmed {
		color: var(--text-muted);
	}

	.line a {
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}

	.bot-check {
		flex: 1 0 100%;
		min-block-size: 4.5rem;
	}

	.prompt-row {
		display: flex;
		flex-shrink: 0;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem;
		padding: 0.55rem 0.75rem 0.75rem;
		border-block-start: 1px solid var(--border-muted);
		background: color-mix(in oklab, var(--panel) 62%, transparent);
	}

	@media (width < 64rem), (pointer: coarse) {
		.prompt-row {
			position: sticky;
			inset-block-end: 0;
			margin-block-start: auto;
		}
	}

	@media (width >= 64rem) and (pointer: fine) {
		.prompt-row {
			padding-block-start: 0;
			border-block-start: 0;
			background: transparent;
		}
	}

	.prompt {
		font-family: var(--font-family-ibm);
		font-size: 1rem;
		line-height: 1.4;
	}

	input {
		flex: 1 1 8rem;
		min-inline-size: 0;
		border: 0;
		padding: 0;
		background: transparent;
		font-family: var(--font-family-ibm);
		font-size: 1rem;
		line-height: 1.4;
		color: var(--text);
		caret-color: var(--neon);
	}

	input:focus {
		outline: none;
	}

	input:focus-visible {
		outline: 2px solid var(--neon);
		outline-offset: 2px;
	}
</style>
