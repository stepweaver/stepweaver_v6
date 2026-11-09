<script lang="ts">
	import { page } from '$app/state';
	import { requestPaletteToggle } from '$lib/components/site/palette-bus';
	import ThemeControls from '$lib/components/site/ThemeControls.svelte';
	import { identity } from '$lib/data/identity';
	import { PRIMARY_NAV } from '$lib/data/navigation';

	let menuOpen = $state(false);
	let openedAt = '';
	const path = $derived(page.url.pathname);

	$effect(() => {
		if (menuOpen && path !== openedAt) menuOpen = false;
	});

	function toggleMenu() {
		openedAt = path;
		menuOpen = !menuOpen;
	}

	function onKey(event: KeyboardEvent) {
		if (event.key !== 'Escape' || !menuOpen) return;
		if (event.target instanceof Element && event.target.closest('select')) return;
		menuOpen = false;
	}
</script>

<svelte:window onkeydown={onKey} />

<header class="site-header">
	<div class="site-header-inner">
		<a href="/" class="site-logo">// {identity.brand}</a>

		<nav class="desktop-nav" aria-label="Primary">
			{#each PRIMARY_NAV as link (link.href)}
				<a href={link.href} class="nav-link" aria-current={path === link.href ? 'page' : undefined}>
					{link.label}
				</a>
			{/each}
		</nav>

		<div class="header-tools">
			<button
				type="button"
				class="palette-link"
				aria-label="Open command palette"
				onclick={requestPaletteToggle}
			>
				Ctrl+K
			</button>
			<ThemeControls />

			<button
				type="button"
				class="menu-toggle"
				aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
				aria-expanded={menuOpen}
				aria-controls="mobile-navigation"
				onclick={toggleMenu}
			>
				{#if menuOpen}
					<span class="menu-close" aria-hidden="true">×</span>
				{:else}
					<span class="menu-icon" aria-hidden="true">
						<span></span>
						<span></span>
						<span></span>
					</span>
				{/if}
			</button>
		</div>
	</div>

	{#if menuOpen}
		<nav id="mobile-navigation" class="mobile-nav" aria-label="Mobile">
			<div class="mobile-nav-inner">
				{#each PRIMARY_NAV as link (link.href)}
					<a
						href={link.href}
						class="mobile-link"
						aria-current={path === link.href ? 'page' : undefined}
					>
						{link.label}
					</a>
				{/each}
				<div class="mobile-appearance">
					<ThemeControls variant="menu" />
				</div>
			</div>
		</nav>
	{/if}
</header>

<style>
	.site-header {
		background: var(--canvas);
		border-block-end: 1px solid var(--border-muted);
	}

	.site-header-inner {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		max-inline-size: var(--content-width-wide);
		min-block-size: var(--nav-height);
		margin-inline: auto;
		padding-inline: var(--space-lg);
	}

	.header-tools {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		flex-shrink: 0;
	}

	.palette-link {
		display: none;
		align-items: center;
		justify-content: center;
		block-size: 2.5rem;
		padding-inline: 0.45rem;
		border: 1px solid color-mix(in oklch, var(--border) 30%, transparent);
		color: var(--text-muted);
		font-family: var(--font-family-ocr);
		font-size: var(--font-size-xs);
	}

	.site-logo {
		font-family: var(--font-family-ocr);
		font-size: var(--font-size-sm);
		color: var(--neon);
		letter-spacing: var(--letter-spacing-wide);
		white-space: nowrap;
	}

	.desktop-nav {
		display: none;
		align-items: center;
		gap: var(--space-lg);
	}

	.nav-link,
	.mobile-link {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
		transition: color var(--duration) var(--ease);

		&:hover {
			color: var(--accent);
		}
	}

	.menu-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		inline-size: 2.5rem;
		block-size: 2.5rem;
		color: var(--neon);
		border: 1px solid color-mix(in oklch, var(--border) 30%, transparent);
	}

	.menu-close {
		font-family: var(--font-family-ocr);
		font-size: var(--font-size-xl);
		line-height: 1;
	}

	.menu-icon {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);

		span {
			display: block;
			inline-size: 1.25rem;
			block-size: 1px;
			background: var(--neon);
		}
	}

	.mobile-nav {
		background: var(--surface);
		border-block-start: 1px solid var(--border-muted);
		padding-inline: var(--space-lg);
		padding-block: var(--space-md);
	}

	.mobile-nav-inner {
		display: flex;
		flex-direction: column;
		max-inline-size: var(--content-width-wide);
		margin-inline: auto;
	}

	.mobile-link {
		font-size: var(--font-size-sm);
		padding-block: var(--space-sm);
		border-block-end: 1px solid color-mix(in oklch, var(--border) 10%, transparent);
	}

	.mobile-appearance {
		margin-block-start: var(--space-md);
		padding-block-start: var(--space-md);
		border-block-start: 1px solid var(--border-muted);
	}

	@media (width < 64rem) {
		.site-header-inner {
			flex-wrap: nowrap;
			gap: var(--space-sm);
			padding-inline: var(--space-md);
		}

		.header-tools {
			gap: var(--space-sm);
		}

		.palette-link {
			display: inline-flex;
		}
	}

	@media (width >= 64rem) {
		.desktop-nav {
			display: flex;
		}

		.menu-toggle,
		.mobile-nav {
			display: none;
		}
	}
</style>
