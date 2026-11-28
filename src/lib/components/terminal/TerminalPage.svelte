<script lang="ts">
	import { onMount } from 'svelte';
	import Console from '$lib/components/terminal/Console.svelte';
	import LambdaText from '$lib/components/site/LambdaText.svelte';
	import { requestPaletteToggle } from '$lib/components/site/palette-bus';
	import { identity } from '$lib/data/identity';
	import { SHELL_HOST, commandGuide, commandModules } from '$lib/terminal/commands';
	import { consoleViewportFrame } from '$lib/terminal/viewport';

	const guide = commandGuide();
	const modules = commandModules();

	onMount(() => {
		const shell = document.querySelector('.site-shell');
		if (!(shell instanceof HTMLElement)) return;
		const root = document.documentElement;
		const previousOverflow = root.style.overflow;
		root.style.overflow = 'hidden';

		const apply = () => {
			const visual = window.visualViewport;
			if (!visual) return;
			const frame = consoleViewportFrame({ height: visual.height, offsetTop: visual.offsetTop });
			if (!frame) return;
			shell.style.setProperty('--console-viewport-height', frame.height);
			if (frame.shifted) shell.style.transform = `translateY(${frame.offset})`;
			else shell.style.removeProperty('transform');
		};

		apply();
		window.visualViewport?.addEventListener('resize', apply);
		window.visualViewport?.addEventListener('scroll', apply);
		window.addEventListener('resize', apply);

		return () => {
			root.style.overflow = previousOverflow;
			shell.style.removeProperty('--console-viewport-height');
			shell.style.removeProperty('transform');
			window.visualViewport?.removeEventListener('resize', apply);
			window.visualViewport?.removeEventListener('scroll', apply);
			window.removeEventListener('resize', apply);
		};
	});
</script>

<div class="console">
	<h1 class="page-title">Terminal</h1>

	<header class="bar">
		<div class="bar-group">
			<span class="term-id">TERM-00</span>
			<span class="header-rule" aria-hidden="true">│</span>
			<span class="product-name"><LambdaText text={identity.brand} /> terminal</span>
		</div>
		<div class="bar-group">
			<button type="button" class="palette-jump" onclick={requestPaletteToggle}>Ctrl+K</button>
			<span class="status">
				<span class="status-dot" aria-hidden="true"></span>
				<span class="status-label">Active</span>
			</span>
		</div>
	</header>

	<details class="mobile-guide">
		<summary>
			<span>System modules</span>
			<span class="chevron" aria-hidden="true">›</span>
		</summary>
		<div class="guide-grid">
			{#each guide as entry (entry.command)}
				<p>
					<span class="guide-command">{entry.command}</span>
					<span class="guide-summary">: {entry.summary}</span>
				</p>
			{/each}
		</div>
	</details>

	<div class="workspace">
		<aside class="sidebar">
			<section class="panel">
				<p class="panel-label">SYS.BRIEF</p>
				<p class="brief-title">Interactive terminal.</p>
				<p class="brief-copy">
					Résumé, published writing, navigation, dice, weather, contact, λlambda, blackjack, and the
					adventure. The same pages the rest of the site uses.
				</p>
				<p class="brief-hint">Type <span>help</span> to get started.</p>
			</section>

			<section class="panel">
				<p class="panel-label">Modules</p>
				{#each modules as module (module.tag)}
					<article class="module">
						<p class="module-title">
							{module.title}
							<span>{module.tag}</span>
						</p>
						<p class="module-body">{module.body}</p>
						<p class="module-cmd">&gt; {module.command}</p>
					</article>
				{/each}
			</section>

			<section class="panel">
				<p class="panel-label">CMD.REF</p>
				{#each guide as entry (entry.command)}
					<p class="guide-row">
						<code>{entry.command}</code>
						<span>{entry.summary}</span>
					</p>
				{/each}
			</section>

			<ul class="notes">
				<li>Browser-first interface</li>
				<li>Commands in the guide are the ones this shell runs</li>
			</ul>
		</aside>

		<section class="screen" aria-label="Terminal window">
			<div class="window-bar">
				<div class="window-dots" aria-hidden="true">
					<span></span>
					<span></span>
					<span></span>
				</div>
				<span class="window-path">~/terminal</span>
				<span class="host-name">{SHELL_HOST}</span>
			</div>
			<Console />
		</section>
	</div>

	<footer class="bar footer">
		<span class="footer-prompt">&gt; help</span>
		<span class="header-rule" aria-hidden="true">│</span>
		<span class="footer-meta">Session active</span>
		<span class="header-rule wide" aria-hidden="true">│</span>
		<span class="footer-meta wide">Local commands</span>
	</footer>
</div>

<style>
	.console {
		display: flex;
		flex: 1 1 auto;
		flex-direction: column;
		min-block-size: 0;
		min-inline-size: 0;
		color: var(--text);
	}

	.page-title {
		position: absolute;
		inline-size: 1px;
		block-size: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
	}

	.bar,
	.window-bar,
	.mobile-guide summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		border-color: var(--border-muted);
		background: color-mix(in oklab, var(--chrome) 72%, transparent);
	}

	.bar {
		flex-shrink: 0;
		padding: 0.45rem 0.75rem;
		border-block-end: 1px solid var(--border-muted);
	}

	.footer {
		border-block-end: 0;
		border-block-start: 1px solid var(--border-muted);
	}

	.bar-group,
	.status {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		min-inline-size: 0;
	}

	.term-id,
	.status-label,
	.panel-label,
	.footer-meta,
	.guide-summary,
	.window-path,
	.palette-jump,
	.mobile-guide summary {
		font-family: var(--font-family-ocr);
		font-size: var(--font-size-xs);
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	.term-id,
	.status-label,
	.panel-label,
	.guide-command,
	.brief-hint span,
	.module-cmd {
		color: var(--neon);
	}

	.product-name,
	.host-name,
	.footer-prompt,
	.brief-copy,
	.module-body,
	.guide-summary,
	.guide-row span,
	.notes {
		color: var(--text-muted);
	}

	.product-name {
		font-family: var(--font-family-ibm);
		font-size: var(--font-size-xs);
		letter-spacing: 0;
		text-transform: none;
	}

	.header-rule,
	.product-name,
	.host-name {
		display: none;
	}

	.palette-jump {
		display: none;
		border: 1px solid var(--border-muted);
		padding: 0.3rem 0.45rem;
		color: var(--text-muted);
		background: transparent;
	}

	.status-dot {
		inline-size: 0.45rem;
		block-size: 0.45rem;
		background: var(--neon);
	}

	.mobile-guide {
		flex-shrink: 0;
		border-block-end: 1px solid var(--border-muted);
	}

	.mobile-guide summary {
		padding: 0.45rem 0.75rem;
		cursor: pointer;
		list-style: none;
	}

	.mobile-guide summary::-webkit-details-marker {
		display: none;
	}

	.chevron {
		color: var(--text-muted);
	}

	.mobile-guide[open] .chevron {
		transform: rotate(90deg);
	}

	.guide-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.35rem 0.75rem;
		padding: 0 0.75rem 0.7rem;
		background: color-mix(in oklab, var(--panel) 45%, transparent);
	}

	.guide-grid p,
	.guide-row {
		min-inline-size: 0;
		font-family: var(--font-family-ocr);
		font-size: var(--font-size-xs);
	}

	.workspace {
		display: flex;
		flex: 1 1 auto;
		min-block-size: 0;
		min-inline-size: 0;
		background: color-mix(in oklab, var(--panel) 22%, transparent);
	}

	.sidebar {
		display: none;
	}

	.screen {
		display: flex;
		flex: 1 1 auto;
		flex-direction: column;
		min-block-size: 0;
		min-inline-size: 0;
	}

	.window-bar {
		flex-shrink: 0;
		padding: 0.4rem 0.75rem;
		border-block-end: 1px solid var(--border-muted);
	}

	.window-dots {
		display: flex;
		gap: 0.35rem;
	}

	.window-dots span {
		inline-size: 0.55rem;
		block-size: 0.55rem;
		border: 1px solid color-mix(in oklab, var(--text) 25%, transparent);
	}

	.window-dots span:nth-child(1) {
		background: color-mix(in oklab, var(--danger) 70%, transparent);
	}

	.window-dots span:nth-child(2) {
		background: color-mix(in oklab, var(--warning) 70%, transparent);
	}

	.window-dots span:nth-child(3) {
		background: color-mix(in oklab, var(--neon) 70%, transparent);
	}

	.window-path,
	.host-name {
		font-family: var(--font-family-ocr);
		font-size: var(--font-size-xs);
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.footer-prompt {
		font-family: var(--font-family-ocr);
		font-size: var(--font-size-xs);
		white-space: nowrap;
	}

	.footer-meta,
	.footer-prompt,
	.header-rule {
		white-space: nowrap;
	}

	.wide {
		display: none;
	}

	@media (prefers-reduced-motion: no-preference) {
		.status-dot {
			animation: pulse 1.6s ease-out infinite;
		}

		@keyframes pulse {
			50% {
				opacity: 0.45;
			}
		}
	}

	@media (width >= 24rem) {
		.guide-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	@media (width >= 40rem) {
		.header-rule,
		.product-name,
		.host-name {
			display: inline;
		}

		.wide {
			display: inline;
		}
	}

	@media (width >= 64rem) {
		.mobile-guide {
			display: none;
		}

		.palette-jump {
			display: inline-flex;
		}

		.sidebar {
			display: flex;
			flex-direction: column;
			gap: var(--space-sm);
			inline-size: 18rem;
			flex-shrink: 0;
			overflow: auto;
			padding: var(--space-sm);
			border-inline-end: 1px solid var(--border-muted);
		}

		.panel {
			padding: 0.7rem 0.75rem;
			border: 1px solid var(--border-muted);
			background: color-mix(in oklab, var(--panel) 40%, transparent);
		}

		.panel-label {
			margin-block-end: 0.45rem;
		}

		.brief-title {
			font-family: var(--font-family-ibm);
			font-size: var(--font-size-lg);
			line-height: var(--line-height-snug);
		}

		.brief-copy,
		.module-body,
		.notes {
			font-family: var(--font-family-ocr);
			font-size: var(--font-size-xs);
			line-height: var(--line-height-body);
		}

		.brief-copy,
		.brief-hint {
			margin-block-start: 0.45rem;
		}

		.brief-hint,
		.module-cmd,
		.guide-row code {
			font-family: var(--font-family-ibm);
			font-size: var(--font-size-sm);
		}

		.module {
			padding: 0.55rem 0.65rem;
			border: 1px solid var(--border-muted);
			background: color-mix(in oklab, var(--panel) 35%, transparent);
		}

		.module + .module {
			margin-block-start: 0.4rem;
		}

		.module-title {
			display: flex;
			align-items: baseline;
			gap: 0.45rem;
			color: var(--neon);
			font-family: var(--font-family-ibm);
		}

		.module-title span,
		.notes {
			color: var(--text-meta);
			font-family: var(--font-family-ocr);
			font-size: var(--font-size-xs);
		}

		.module-body,
		.module-cmd {
			margin-block-start: 0.25rem;
		}

		.guide-row {
			display: flex;
			align-items: baseline;
			gap: 0.45rem;
		}

		.guide-row code {
			flex-shrink: 0;
			color: var(--neon);
		}

		.guide-row span {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.notes {
			display: grid;
			gap: 0.3rem;
			padding-inline: 0.2rem;
		}
	}

	@media (width >= 96rem) {
		.sidebar {
			inline-size: 20rem;
		}
	}
</style>
