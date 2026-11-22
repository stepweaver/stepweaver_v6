<script lang="ts">
	import { onMount } from 'svelte';
	import DieIcon from '$lib/components/dice/DieIcon.svelte';
	import {
		DICE_SIDES,
		MAX_DICE_COUNT,
		MAX_MODIFIER,
		MIN_MODIFIER,
		evaluateKeep,
		evaluateNotation,
		formatRollResult,
		parseDiceNotation,
		rerollWithHeldDice,
		notationError,
		notationFromPool,
		type PoolDie,
		type RollResult
	} from '$lib/dice/engine';
	import {
		DICE_HISTORY_KEY,
		DICE_HISTORY_LIMIT,
		MAX_HISTORY_COMMENT,
		parseRollHistory,
		rememberRoll,
		serializeRollHistory
	} from '$lib/dice/history';

	let pool = $state<PoolDie[]>([]);
	let modifier = $state(0);
	let notation = $state('');
	let note = $state('');
	let current = $state<RollResult | null>(null);
	let history = $state<RollResult[]>([]);
	let held = $state<string[]>([]);
	let rolling = $state(false);
	let tumble = $state<{ sides: number; delay: number }[]>([]);
	let notice = $state('');
	let loaded = $state(false);
	let historyOpen = $state(true);

	const typed = $derived(notation.trim());
	const typedError = $derived(typed ? notationError(typed) : null);
	const poolNotation = $derived(notationFromPool(pool, modifier));
	const usingTyped = $derived(Boolean(typed));
	const canRoll = $derived(!rolling && (usingTyped ? !typedError : Boolean(poolNotation)));
	const canHold = $derived(current?.kind === 'notation' || current?.kind === undefined);

	$effect(() => {
		if (!loaded) return;
		try {
			localStorage.setItem(DICE_HISTORY_KEY, serializeRollHistory(history));
		} catch {
			notice = 'This browser did not keep the roll history.';
		}
	});

	onMount(() => {
		history = parseRollHistory(localStorage.getItem(DICE_HISTORY_KEY));
		loaded = true;
		document.querySelector('.roller')?.setAttribute('data-ready', 'true');
	});

	function addDie(sides: number) {
		const existing = pool.find((die) => die.sides === sides);
		if (!existing) {
			pool = [...pool, { sides, count: 1 }];
			return;
		}
		if (existing.count >= MAX_DICE_COUNT) return;
		pool = pool.map((die) => (die.sides === sides ? { ...die, count: die.count + 1 } : die));
	}

	function setCount(sides: number, count: number) {
		const next = Math.min(MAX_DICE_COUNT, Math.max(0, count));
		pool =
			next === 0
				? pool.filter((die) => die.sides !== sides)
				: pool.map((die) => (die.sides === sides ? { ...die, count: next } : die));
	}

	function adjustModifier(delta: number) {
		modifier = Math.min(MAX_MODIFIER, Math.max(MIN_MODIFIER, modifier + delta));
	}

	function sessionClock(iso?: string) {
		if (!iso) return '';
		const date = new Date(iso);
		if (Number.isNaN(date.getTime())) return '';
		return date.toLocaleTimeString(undefined, {
			hour12: false,
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	const ROLL_MOTION_MS = 1200;

	function motionReduced() {
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	function tumbleIcons(groups: { count: number; sides: number }[]) {
		const icons: { sides: number; delay: number }[] = [];
		groups.forEach((group, groupIndex) => {
			const shown = Math.min(group.count, 6);
			for (let index = 0; index < shown; index += 1) {
				icons.push({ sides: group.sides, delay: (groupIndex * group.count + index) * 80 });
			}
		});
		return icons;
	}

	async function pause(icons: { sides: number; delay: number }[]) {
		if (motionReduced()) return;
		tumble = icons;
		rolling = true;
		await new Promise((resolve) => setTimeout(resolve, ROLL_MOTION_MS));
		rolling = false;
		tumble = [];
	}

	function store(result: RollResult) {
		const comment = note.trim().slice(0, MAX_HISTORY_COMMENT);
		const saved = comment ? { ...result, comment } : result;
		current = saved;
		history = rememberRoll(history, saved);
		held = [];
		note = '';
		notice = '';
	}

	async function rollPool() {
		if (!canRoll) return;
		const expression = usingTyped ? typed : poolNotation;
		let icons: { sides: number; delay: number }[];
		try {
			icons = tumbleIcons(parseDiceNotation(expression).groups);
		} catch {
			icons = [];
		}
		await pause(icons);
		try {
			store(evaluateNotation(expression));
		} catch (error) {
			notice = error instanceof Error ? error.message : 'That roll could not be made.';
		}
	}

	async function rollKeep(kind: 'advantage' | 'disadvantage') {
		if (rolling) return;
		await pause([
			{ sides: 20, delay: 0 },
			{ sides: 20, delay: 80 }
		]);
		store(evaluateKeep(kind));
	}

	async function reroll() {
		if (!current || !canHold || rolling) return;
		const kept = new Set(held);
		if (
			current.breakdown.every((group, groupIndex) =>
				group.results.every((_, index) => kept.has(`${groupIndex}-${index}`))
			)
		) {
			notice = 'Every die is held. Release one to reroll it.';
			return;
		}
		await pause(
			tumbleIcons(current.rolls.map((group) => ({ count: group.count, sides: group.sides })))
		);
		const next = rerollWithHeldDice(current, kept);
		next.comment = current.comment;
		current = next;
		history = rememberRoll(history, next);
		notice = '';
	}

	function toggleHeld(key: string) {
		held = held.includes(key) ? held.filter((item) => item !== key) : [...held, key];
	}

	async function copyResult() {
		if (!current) return;
		const text = formatRollResult(current);
		try {
			await navigator.clipboard.writeText(text);
			notice = 'Copied the roll.';
		} catch {
			notice = 'The roll is selected in the breakdown if copying is blocked.';
		}
	}

	function resetPool() {
		pool = [];
		modifier = 0;
		notation = '';
		note = '';
		current = null;
		held = [];
		notice = '';
	}

	function purgeResult() {
		current = null;
		held = [];
		notice = '';
	}

	function onShortcut(event: KeyboardEvent) {
		const target = event.target;
		if (target instanceof HTMLElement) {
			const tag = target.tagName;
			if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return;
		}
		if (event.metaKey || event.ctrlKey || event.altKey || event.isComposing) return;
		if (event.key === 'Escape' && document.querySelector('.palette')) return;
		const key = event.key.toLowerCase();
		if (key === 'enter') {
			event.preventDefault();
			void rollPool();
		} else if (key === 'c') {
			event.preventDefault();
			void copyResult();
		} else if (key === 'r') {
			event.preventDefault();
			resetPool();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			purgeResult();
		}
	}

	function clearHistory() {
		if (!history.length) return;
		if (!window.confirm('Clear all roll history?')) return;
		history = [];
		localStorage.removeItem(DICE_HISTORY_KEY);
	}

	function editComment(index: number, comment: string) {
		history = history.map((item, itemIndex) =>
			itemIndex === index ? { ...item, comment: comment.slice(0, MAX_HISTORY_COMMENT) } : item
		);
	}

	function onNotationKey(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			void rollPool();
		}
	}
</script>

<svelte:window onkeydown={onShortcut} />

<div class="roller">
	<header class="intro">
		<p class="kicker">// DICE</p>
		<h1>Dice roller</h1>
		<p class="lede">
			Add dice or type notation such as 3d6+2, 1d20, advantage, or disadvantage. Saved rolls stay in
			this browser. The <a href="/terminal">terminal</a> <span class="cmd">roll</span> command uses this
			same engine.
		</p>
	</header>

	<div class="layout">
		<section class="panel" aria-label="Dice pool">
			<p class="label">Add dice</p>
			<div class="dice-row">
				{#each DICE_SIDES as sides (sides)}
					<button type="button" class="die-add die-d{sides}" onclick={() => addDie(sides)}>
						<span class="die-mark">
							<DieIcon {sides} />
							{#if sides === 100}
								<span class="percent" aria-hidden="true">%</span>
							{/if}
						</span>
						<span class="die-label">d{sides}</span>
					</button>
				{/each}
			</div>

			<p class="label">Pool</p>
			{#if pool.length === 0}
				<p class="empty">No dice yet. Add one, or type notation below.</p>
			{:else}
				<ul class="pool">
					{#each pool as die (die.sides)}
						<li class="die-d{die.sides}">
							<span class="pool-die">
								<DieIcon sides={die.sides} size={28} />
								<span class="die-name">d{die.sides}</span>
							</span>
							<button
								type="button"
								class="step"
								aria-label="Fewer d{die.sides}"
								onclick={() => setCount(die.sides, die.count - 1)}>-</button
							>
							<span class="count">{die.count}</span>
							<button
								type="button"
								class="step"
								aria-label="More d{die.sides}"
								onclick={() => setCount(die.sides, die.count + 1)}>+</button
							>
							<button type="button" class="text-btn" onclick={() => setCount(die.sides, 0)}
								>Remove</button
							>
						</li>
					{/each}
				</ul>
			{/if}

			<div class="fields">
				<label>
					Modifier
					<span class="stepper">
						<button type="button" aria-label="Decrease modifier" onclick={() => adjustModifier(-1)}
							>-</button
						>
						<input
							type="number"
							inputmode="numeric"
							aria-label="Modifier"
							min={MIN_MODIFIER}
							max={MAX_MODIFIER}
							value={modifier}
							oninput={(event) => {
								const target = event.currentTarget;
								if (!(target instanceof HTMLInputElement)) return;
								const value = Number(target.value);
								modifier = Number.isFinite(value)
									? Math.min(MAX_MODIFIER, Math.max(MIN_MODIFIER, Math.trunc(value)))
									: 0;
							}}
						/>
						<button type="button" aria-label="Increase modifier" onclick={() => adjustModifier(1)}
							>+</button
						>
					</span>
				</label>
				<label>
					Notation
					<input
						bind:value={notation}
						onkeydown={onNotationKey}
						autocapitalize="none"
						autocorrect="off"
						spellcheck="false"
						placeholder={poolNotation || '2d6+1'}
						aria-invalid={typedError ? 'true' : undefined}
						aria-describedby="notation-status"
					/>
				</label>
				<label>
					Note
					<input bind:value={note} maxlength="150" placeholder="Optional note for the next roll" />
				</label>
			</div>
			<p id="notation-status" class:error={Boolean(typedError)} aria-live="polite">
				{#if typedError}
					{typedError}
				{:else if usingTyped}
					Roll will use {typed}.
				{:else if poolNotation}
					Roll will use {poolNotation}.
				{:else}
					Add dice or type notation.
				{/if}
			</p>

			<div class="actions">
				<button type="button" class="primary" disabled={!canRoll} onclick={() => rollPool()}>
					{rolling ? 'Rolling' : 'Roll'}
				</button>
				<button type="button" disabled={rolling} onclick={() => rollKeep('advantage')}
					>Advantage</button
				>
				<button type="button" disabled={rolling} onclick={() => rollKeep('disadvantage')}
					>Disadvantage</button
				>
				<button type="button" class="text-btn" onclick={resetPool}>Reset</button>
			</div>
		</section>

		<section class="panel" aria-label="Roll result">
			<p class="label">Roll session</p>
			{#if rolling}
				<div class="tumble" aria-live="polite">
					<div class="tumble-row">
						{#each tumble as die, index (`${die.sides}-${index}`)}
							<span class="tumble-die die-d{die.sides}" style:animation-delay="{die.delay}ms">
								<DieIcon sides={die.sides} size={34} />
							</span>
						{/each}
					</div>
					<p class="tumble-status">Roll in progress</p>
				</div>
			{:else if current}
				<p class="session-line">
					<span>Roll</span>
					{current.notation}
				</p>
				<p class="session-line">
					<span>Note</span>
					{current.comment || '—'}
				</p>
				{#if sessionClock(current.timestamp)}
					<p class="session-line">
						<span>Time</span>
						{sessionClock(current.timestamp)}
					</p>
				{/if}
				<div class="readout">
					{#each formatRollResult(current).split('\n') as line, index (index)}
						<p
							class:readout-total={line.startsWith('Total:')}
							class:readout-die={line.trimStart().startsWith('die ') || line.includes('d20 ')}
						>
							{line}
						</p>
					{/each}
				</div>
				{#if canHold}
					<p class="empty">Hold a die to keep it, then re-roll the rest.</p>
					<div class="faces" aria-label="Individual dice">
						{#each current.breakdown as group, groupIndex (group.notation + groupIndex)}
							<div class="face-group">
								<p>
									{group.notation}
									<span class="sum">= {group.results.reduce((sum, value) => sum + value, 0)}</span>
								</p>
								<div class="face-row">
									{#each group.results as value, resultIndex (`${groupIndex}-${resultIndex}`)}
										{@const key = `${groupIndex}-${resultIndex}`}
										<button
											type="button"
											class="face"
											class:held={held.includes(key)}
											aria-pressed={held.includes(key)}
											aria-label={held.includes(key) ? `Release die ${value}` : `Hold die ${value}`}
											onclick={() => toggleHeld(key)}
										>
											{value}
											<span>{held.includes(key) ? 'held' : 'hold'}</span>
										</button>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				{/if}
				<div class="actions">
					{#if canHold && held.length > 0}
						<button type="button" disabled={rolling} onclick={() => reroll()}>Re-roll unheld</button
						>
					{/if}
					<button type="button" onclick={() => copyResult()}>Copy output</button>
					<button type="button" onclick={purgeResult}>Purge</button>
				</div>
			{:else}
				<p class="empty">
					{poolNotation
						? `Ready to roll ${poolNotation}.`
						: 'Add dice or type notation. The breakdown for each die shows up here.'}
				</p>
			{/if}
			{#if notice}
				<p class="notice" aria-live="polite">{notice}</p>
			{/if}
		</section>
	</div>

	<section class="panel history">
		<div class="history-bar">
			<button type="button" class="text-btn" onclick={() => (historyOpen = !historyOpen)}>
				{historyOpen ? 'Hide history' : 'Show history'} ({history.length}/{DICE_HISTORY_LIMIT})
			</button>
			<button type="button" class="text-btn" onclick={clearHistory} disabled={!history.length}
				>Clear history</button
			>
		</div>
		{#if historyOpen}
			{#if history.length === 0}
				<p class="empty">No saved rolls in this browser.</p>
			{:else}
				<ol>
					{#each history as item, index (`${item.timestamp ?? 'roll'}-${index}`)}
						<li>
							<button
								type="button"
								class="history-roll"
								onclick={() => {
									current = item;
									held = [];
								}}
							>
								<span>{item.notation}</span>
								<strong>{item.total}</strong>
							</button>
							<label>
								Comment
								<input
									value={item.comment ?? ''}
									maxlength={MAX_HISTORY_COMMENT}
									oninput={(event) => {
										const target = event.currentTarget;
										if (target instanceof HTMLInputElement) editComment(index, target.value);
									}}
								/>
							</label>
						</li>
					{/each}
				</ol>
			{/if}
		{/if}
	</section>
</div>

<style>
	.roller {
		max-inline-size: 72rem;
		margin-inline: auto;
		padding: var(--space-xl) var(--space-md) var(--space-2xl);
	}

	.intro {
		margin-block-end: var(--space-lg);
	}

	.kicker,
	.label,
	.face span,
	.history-roll span {
		font-family: var(--font-family-ocr);
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.kicker,
	.label,
	.cmd,
	.die-name,
	.history-roll strong {
		color: var(--neon);
	}

	h1,
	.lede,
	.empty,
	.pool,
	label,
	pre,
	.notice {
		font-family: var(--font-family-ibm);
	}

	h1 {
		font-size: var(--font-size-xl);
		font-weight: 400;
	}

	.lede,
	.empty,
	.notice {
		color: var(--text-muted);
	}

	.lede a,
	.cmd {
		color: var(--neon);
	}

	.layout {
		display: grid;
		gap: var(--space-md);
	}

	.panel {
		min-inline-size: 0;
		padding: 0.8rem;
		border: 1px solid var(--border-muted);
		background: color-mix(in oklab, var(--panel) 55%, transparent);
	}

	.label {
		margin-block-end: 0.45rem;
		color: var(--text-muted);
		font-size: var(--font-size-xs);
	}

	.actions,
	.face-row,
	.history-bar,
	.tumble-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
	}

	.dice-row {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.35rem;
	}

	.die-add {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.15rem;
		min-inline-size: 0;
		padding: 0.35rem 0.2rem;
	}

	.die-mark {
		position: relative;
		display: block;
	}

	.percent {
		position: absolute;
		inset-inline-end: -0.35rem;
		inset-block-end: -0.2rem;
		border: 1px solid var(--neon);
		background: var(--panel);
		color: var(--neon);
		font-family: var(--font-family-ibm);
		font-size: 0.75rem;
		line-height: 1;
		padding: 0.05rem 0.2rem;
	}

	.die-label,
	.die-name {
		font-family: var(--font-family-ocr);
		font-size: var(--font-size-xs);
		letter-spacing: 0.08em;
	}

	.pool-die {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}

	.die-d4 {
		color: var(--accent);
	}

	.die-d6 {
		color: var(--neon);
	}

	.die-d8 {
		color: var(--warning);
	}

	.die-d10 {
		color: color-mix(in oklab, var(--accent) 50%, var(--text) 50%);
	}

	.die-d12 {
		color: color-mix(in oklab, var(--danger) 55%, var(--accent) 45%);
	}

	.die-d20 {
		color: color-mix(in oklab, var(--danger) 72%, var(--warning) 28%);
	}

	.die-d100 {
		color: color-mix(in oklab, var(--accent) 32%, var(--danger) 68%);
	}

	.tumble {
		min-block-size: 6.5rem;
	}

	.tumble-die {
		display: inline-flex;
		animation: dice-roll 0.8s ease-in-out infinite;
	}

	.tumble-status {
		margin-block-start: 0.45rem;
		color: var(--neon);
		font-family: var(--font-family-ocr);
		font-size: var(--font-size-xs);
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}

	.readout p {
		margin: 0;
		font-family: var(--font-family-ibm);
		line-height: 1.45;
		white-space: pre-wrap;
	}

	.readout-die {
		color: var(--text-secondary);
	}

	.readout-total {
		margin-block-start: 0.35rem;
		color: var(--text);
		font-size: var(--font-size-xl);
	}

	@keyframes dice-roll {
		0% {
			transform: rotate(0deg) scale(1);
		}
		25% {
			transform: rotate(90deg) scale(1.1);
		}
		50% {
			transform: rotate(180deg) scale(0.9);
		}
		75% {
			transform: rotate(270deg) scale(1.1);
		}
		100% {
			transform: rotate(360deg) scale(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.tumble-die {
			animation: none;
		}
	}

	@media (width >= 40rem) {
		.dice-row {
			grid-template-columns: repeat(7, minmax(0, 1fr));
		}
	}

	button,
	input {
		border: 1px solid var(--border-muted);
		border-radius: 0;
		background: transparent;
		color: var(--text);
		font-family: var(--font-family-ibm);
		font-size: 1rem;
	}

	button {
		min-block-size: 2.75rem;
		min-inline-size: 2.75rem;
		padding: 0.4rem 0.7rem;
		touch-action: manipulation;
	}

	button:disabled {
		opacity: 0.45;
	}

	.primary,
	.face.held {
		border-color: var(--neon);
		color: var(--neon);
	}

	.text-btn {
		min-inline-size: auto;
	}

	.pool {
		display: grid;
		gap: 0.45rem;
		margin: 0 0 0.8rem;
		padding: 0;
		list-style: none;
	}

	.pool li,
	.history li,
	.fields {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.45rem;
	}

	.fields {
		align-items: end;
		margin-block-start: 0.8rem;
	}

	.stepper {
		display: flex;
		align-items: center;
		gap: 0.45rem;
	}

	.stepper input {
		inline-size: 5rem;
		min-inline-size: 4.5rem;
		text-align: center;
	}

	.session-line,
	.sum {
		font-family: var(--font-family-ibm);
	}

	.session-line {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
		margin-block-end: 0.25rem;
	}

	.session-line span,
	.sum {
		color: var(--text-muted);
	}

	label {
		display: grid;
		gap: 0.25rem;
		min-inline-size: min(100%, 12rem);
		flex: 1 1 12rem;
	}

	input {
		inline-size: 100%;
		min-block-size: 2.75rem;
		padding: 0.4rem 0.55rem;
	}

	#notation-status,
	.notice {
		min-block-size: 1.4em;
		margin-block: 0.55rem;
	}

	#notation-status.error,
	.notice {
		color: var(--warning);
	}

	pre {
		margin: 0;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}

	.faces {
		display: grid;
		gap: 0.7rem;
		margin-block-start: 0.8rem;
	}

	.face {
		display: grid;
		justify-items: center;
		min-inline-size: 4.25rem;
	}

	.face span,
	.history-roll span {
		color: var(--text-muted);
		font-size: var(--font-size-xs);
	}

	.history {
		margin-block-start: var(--space-md);
	}

	.history ol {
		display: grid;
		gap: 0.7rem;
		margin: 0.8rem 0 0;
		padding: 0;
		list-style: none;
	}

	.history-roll {
		display: flex;
		justify-content: space-between;
		gap: 0.6rem;
		flex: 1 1 10rem;
	}

	@media (width >= 64rem) {
		.layout {
			grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
			align-items: start;
		}
	}
</style>
