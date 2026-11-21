<script lang="ts">
	import { onMount } from 'svelte';
	import {
		GLITCH_DURATION_MS,
		GLITCH_INITIAL_MS,
		GLITCH_INTERVAL_MS,
		createMatrixLink,
		glitchDelay,
		staticUnplugged,
		type MatrixSnapshot
	} from '$lib/effects/matrix-link';
	import { LAMBDA } from '$lib/text/lambda';

	let frame = $state<MatrixSnapshot>(staticUnplugged());
	let glitching = $state(false);
	const attemptLabel = $derived(String(frame.attempt).padStart(2, '0'));

	onMount(() => {
		const media = window.matchMedia('(prefers-reduced-motion: reduce)');
		const link = createMatrixLink({
			onChange: (next) => {
				frame = next;
			}
		});
		let timers: number[] = [];
		let glitchCancelled = false;

		function clearGlitch() {
			glitchCancelled = true;
			for (const id of timers) window.clearTimeout(id);
			timers = [];
			glitching = false;
		}

		function startGlitch() {
			clearGlitch();
			glitchCancelled = false;
			const random = Math.random;
			const trigger = () => {
				if (glitchCancelled) return;
				glitching = true;
				timers.push(
					window.setTimeout(() => {
						if (!glitchCancelled) glitching = false;
					}, GLITCH_DURATION_MS)
				);
			};
			const schedule = (wait: number) => {
				timers.push(
					window.setTimeout(() => {
						if (glitchCancelled) return;
						trigger();
						schedule(glitchDelay(GLITCH_INTERVAL_MS, random));
					}, wait)
				);
			};
			schedule(glitchDelay(GLITCH_INITIAL_MS, random));
		}

		function apply() {
			if (media.matches) {
				link.stop();
				clearGlitch();
				frame = staticUnplugged();
				return;
			}
			clearGlitch();
			link.start();
			startGlitch();
		}

		apply();
		media.addEventListener('change', apply);
		return () => {
			media.removeEventListener('change', apply);
			link.stop();
			clearGlitch();
		};
	});
</script>

<div class="matrix-link" data-phase={frame.phase} aria-hidden="true">
	<span class="corner tl"></span>
	<span class="corner tr"></span>
	<span class="corner bl"></span>
	<span class="corner br"></span>

	<p class="matrix-header" data-matrix-header>
		<span>MATRIX LINK</span>
		<span class="sep">//</span>
		<span>STATUS</span>
		<span class="sep">//</span>
		<span class="unplugged pulse">UNPLUGGED</span>
	</p>

	<div class="status-line">
		<span class="glyph lambda-glyph" class:glitching data-matrix-glyph>{LAMBDA}</span>
		<span class="status-text" data-matrix-status>{frame.status}</span>
		{#if frame.showPrompt}
			<span class="cursor pulse">_</span>
		{/if}
	</div>

	<div class="cells">
		{#each frame.cells as cell, index (index)}
			<div class="cell" data-matrix-cell>{cell}</div>
		{/each}
	</div>

	<p class="attempt">
		<span>LINK ATTEMPT</span>
		<span class="sep">//</span>
		<span data-matrix-attempt>{attemptLabel}</span>
	</p>
</div>

<style>
	.matrix-link {
		position: relative;
		overflow: hidden;
		border: 1px solid color-mix(in oklch, var(--neon) 25%, transparent);
		background: color-mix(in oklch, var(--panel) 50%, transparent);
		padding: 0.5rem 0.75rem 0.45rem;
		color: var(--neon);
	}

	.matrix-link[data-phase='fail'],
	.matrix-link[data-phase='lost'],
	.matrix-link[data-phase='unplugged'] {
		border-color: color-mix(in oklch, var(--danger) 25%, transparent);
	}

	.matrix-link::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(to bottom, rgb(255 255 255 / 3.5%) 1px, transparent 1px);
		background-size: 100% 10px;
		opacity: 0.1;
		pointer-events: none;
	}

	.corner {
		position: absolute;
		z-index: 2;
		inline-size: 0.7rem;
		block-size: 0.7rem;
		border-color: var(--neon);
		border-style: solid;
		pointer-events: none;
	}

	.tl {
		inset-block-start: 0;
		inset-inline-start: 0;
		border-width: 1px 0 0 1px;
	}

	.tr {
		inset-block-start: 0;
		inset-inline-end: 0;
		border-width: 1px 1px 0 0;
		border-color: color-mix(in oklch, var(--neon) 50%, transparent);
	}

	.bl {
		inset-block-end: 0;
		inset-inline-start: 0;
		border-width: 0 0 1px 1px;
		border-color: color-mix(in oklch, var(--neon) 50%, transparent);
	}

	.br {
		inset-block-end: 0;
		inset-inline-end: 0;
		border-width: 0 1px 1px 0;
	}

	.matrix-header,
	.status-line,
	.cells,
	.attempt {
		position: relative;
		z-index: 1;
	}

	.matrix-header,
	.attempt {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		font-family: var(--font-family-ocr);
		font-size: var(--font-size-xs);
		letter-spacing: var(--letter-spacing-label);
		line-height: 1.2;
		text-transform: uppercase;
	}

	.matrix-header {
		color: color-mix(in oklch, var(--neon) 70%, transparent);
	}

	.sep {
		padding-inline: 0.45rem;
		color: color-mix(in oklch, var(--neon) 35%, transparent);
	}

	.unplugged {
		color: var(--danger);
	}

	.status-line {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		block-size: 1.5rem;
		margin-block-start: 0.35rem;
		overflow: hidden;
		color: var(--neon);
		font-family: var(--font-family-ocr);
		font-size: var(--font-size-xs);
	}

	.matrix-link[data-phase='trace'] .status-line,
	.matrix-link[data-phase='lock'] .status-line {
		color: var(--accent);
	}

	.matrix-link[data-phase='fail'] .status-line {
		color: var(--warning);
	}

	.matrix-link[data-phase='lost'] .status-line,
	.matrix-link[data-phase='unplugged'] .status-line {
		color: var(--danger);
	}

	.glyph {
		position: relative;
		flex-shrink: 0;
		font-family: var(--font-family-ocr);
		font-weight: 700;
		line-height: 1;
		text-transform: none;
		filter: drop-shadow(0 0 3px color-mix(in oklch, currentColor 40%, transparent));
	}

	.glyph::before,
	.glyph::after {
		content: '\03BB';
		position: absolute;
		inset: 0;
		text-transform: none;
		pointer-events: none;
		opacity: 0;
	}

	.glyph.glitching {
		color: var(--accent);
		animation: matrix-glitch 0.3s ease-in-out infinite;
		filter: drop-shadow(0 0 6px color-mix(in oklch, var(--accent) 55%, transparent));
	}

	.glyph.glitching::before,
	.glyph.glitching::after {
		opacity: 0.75;
	}

	.glyph.glitching::before {
		color: var(--accent);
		transform: translate(-2px, 1px);
	}

	.glyph.glitching::after {
		color: var(--danger);
		transform: translate(2px, -1px);
	}

	.status-text {
		min-inline-size: 0;
		overflow: hidden;
		font-family: var(--font-family-ocr);
		letter-spacing: 0.08em;
		text-overflow: ellipsis;
		text-transform: uppercase;
		white-space: nowrap;
	}

	.cursor {
		flex-shrink: 0;
	}

	.cells {
		display: grid;
		grid-template-columns: repeat(6, minmax(0, 1fr));
		gap: 2px;
		margin-block-start: 0.45rem;
	}

	.cell {
		display: flex;
		align-items: center;
		justify-content: center;
		block-size: 1.5rem;
		overflow: hidden;
		border: 1px solid color-mix(in oklch, var(--neon) 25%, transparent);
		background: color-mix(in oklch, var(--panel) 35%, transparent);
		color: color-mix(in oklch, var(--neon) 85%, transparent);
		font-family: var(--font-family-ibm);
		font-size: var(--font-size-xs);
		font-weight: 700;
		line-height: 1;
		white-space: nowrap;
		transition:
			color 200ms var(--ease),
			border-color 200ms var(--ease);
	}

	.matrix-link[data-phase='trace'] .cell {
		border-color: color-mix(in oklch, var(--accent) 20%, transparent);
		color: color-mix(in oklch, var(--accent) 90%, transparent);
	}

	.matrix-link[data-phase='lock'] .cell {
		border-color: color-mix(in oklch, var(--accent) 30%, transparent);
		color: var(--accent);
	}

	.matrix-link[data-phase='fail'] .cell {
		border-color: color-mix(in oklch, var(--warning) 20%, transparent);
		color: var(--warning);
	}

	.matrix-link[data-phase='lost'] .cell {
		border-color: color-mix(in oklch, var(--danger) 15%, transparent);
		color: color-mix(in oklch, var(--danger) 50%, transparent);
	}

	.matrix-link[data-phase='unplugged'] .cell {
		border-color: color-mix(in oklch, var(--text-muted) 15%, transparent);
		color: color-mix(in oklch, var(--text-muted) 35%, transparent);
	}

	.matrix-link[data-phase='idle'] .cell {
		border-color: color-mix(in oklch, var(--neon) 10%, transparent);
		color: color-mix(in oklch, var(--neon) 35%, transparent);
	}

	.attempt {
		justify-content: flex-end;
		margin-block-start: 0.4rem;
		color: color-mix(in oklch, var(--neon) 40%, transparent);
	}

	.pulse {
		animation: matrix-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	.matrix-link[data-phase='unplugged'] .status-text {
		animation: matrix-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	@keyframes matrix-pulse {
		50% {
			opacity: 0.5;
		}
	}

	@keyframes matrix-glitch {
		0% {
			transform: translate(0);
		}
		20% {
			transform: translate(-2px, 2px);
		}
		40% {
			transform: translate(-2px, -2px);
		}
		60% {
			transform: translate(2px, 2px);
		}
		80% {
			transform: translate(2px, -2px);
		}
		100% {
			transform: translate(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.pulse,
		.glyph,
		.cell,
		.status-text {
			animation: none;
			transition: none;
		}
	}
</style>
