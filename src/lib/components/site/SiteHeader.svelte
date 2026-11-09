<script lang="ts">
	import { page } from '$app/state';
	import { PRIMARY_NAV } from '#lib/data/navigation.ts';
	import ThemeControls from './ThemeControls.svelte';

	let open = $state(false);
	let scrolled = $state(false);
	let openedAt = '';

	const path = $derived(page.url.pathname);

	$effect(() => {
		if (open && path !== openedAt) open = false;
	});

	function toggleMenu() {
		openedAt = path;
		open = !open;
	}

	function active(href: string) {
		return path === href || path.startsWith(`${href}/`);
	}

	$effect(() => {
		const onScroll = () => {
			scrolled = window.scrollY > 10;
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});
</script>

<header class="site-header" class:is-scrolled={scrolled}>
	<div class="site-header-inner">
		<a class="wordmark" href="/">// λstepweaver</a>
		<nav class="primary-nav" aria-label="Primary">
			{#each PRIMARY_NAV as link (link.href)}
				<a href={link.href} aria-current={active(link.href) ? 'page' : undefined}>{link.label}</a>
			{/each}
		</nav>
		<div class="header-tools">
			<ThemeControls />
			<button
				type="button"
				class="menu-button"
				aria-expanded={open}
				aria-controls="mobile-navigation"
				onclick={toggleMenu}
			>
				{open ? 'Close' : 'Menu'}
			</button>
		</div>
	</div>
</header>

{#if open}
	<div
		class="nav-overlay"
		id="mobile-navigation"
		role="dialog"
		aria-modal="true"
		aria-label="Site navigation"
	>
		<div class="overlay-top">
			<a class="wordmark" href="/">// λstepweaver</a>
			<button type="button" class="glitch-button quiet" onclick={() => (open = false)}>Close</button
			>
		</div>
		<ThemeControls />
		<nav>
			{#each PRIMARY_NAV as link (link.href)}
				<a href={link.href} aria-current={active(link.href) ? 'page' : undefined}>
					{link.label}
				</a>
			{/each}
		</nav>
	</div>
{/if}
