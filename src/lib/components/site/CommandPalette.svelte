<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { onPaletteToggle } from '$lib/components/site/palette-bus';
	import { PALETTE_LINKS } from '$lib/data/navigation';

	let open = $state(false);
	let openedAt = '';
	const path = $derived(page.url.pathname);

	$effect(() => {
		if (open && path !== openedAt) open = false;
	});

	function toggle() {
		openedAt = path;
		open = !open;
	}

	function onKey(event: KeyboardEvent) {
		if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			toggle();
		} else if (event.key === 'Escape') {
			open = false;
		}
	}

	onMount(() => onPaletteToggle(toggle));
</script>

<svelte:window onkeydown={onKey} />

<button type="button" class="palette-trigger" aria-expanded={open} onclick={toggle}>
	Ctrl+K
</button>

{#if open}
	<div class="palette" role="dialog" aria-label="Navigation">
		<div class="palette-head">
			<p>Pages only. Terminal commands are not available in this build.</p>
			<button type="button" onclick={() => (open = false)}>Close</button>
		</div>
		<ul>
			{#each PALETTE_LINKS as link (link.href)}
				<li>
					<a href={link.href}>
						{link.label}
						{#if link.note}
							<span>{link.note}</span>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	</div>
{/if}

<style>
	.palette-trigger,
	.palette,
	.palette button,
	.palette a {
		font-family: var(--font-family-ocr);
		font-size: var(--font-size-xs);
	}

	.palette-trigger {
		position: fixed;
		inset-block-end: var(--space-md);
		inset-inline-end: var(--space-md);
		z-index: 30;
		border: 1px solid var(--border-muted);
		background: var(--surface);
		color: var(--text-muted);
		padding: 0.4rem 0.6rem;
	}

	@media (width < 64rem) {
		.palette-trigger {
			display: none;
		}
	}

	.palette {
		position: fixed;
		inset-block-end: 4rem;
		inset-inline-end: var(--space-md);
		z-index: 30;
		inline-size: min(24rem, calc(100vw - 2rem));
		background: var(--surface);
		color: var(--text);
		border: 1px solid var(--border-muted);
		padding: var(--space-md);
	}

	.palette-head {
		display: flex;
		justify-content: space-between;
		gap: var(--space-sm);
		margin-block-end: var(--space-sm);
		color: var(--text-muted);
	}

	ul {
		display: grid;
		gap: 0.35rem;
	}

	a {
		display: flex;
		justify-content: space-between;
		gap: var(--space-sm);
	}

	span {
		color: var(--text-meta);
	}
</style>
