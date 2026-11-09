<script lang="ts">
	import { page } from '$app/state';
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
</script>

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

		<ThemeControls />

		<button
			type="button"
			class="menu-toggle"
			aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
			aria-expanded={menuOpen}
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

	{#if menuOpen}
		<nav class="mobile-nav" aria-label="Mobile">
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

	.site-logo {
		font-family: var(--font-family-ocr);
		font-size: var(--font-size-sm);
		color: var(--neon);
		letter-spacing: var(--letter-spacing-wide);
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

		&:last-child {
			border-block-end: none;
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
