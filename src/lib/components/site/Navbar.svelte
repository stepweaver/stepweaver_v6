<script lang="ts">
	let menuOpen = $state(false);

	const navLinks = [
		{ label: 'Work', href: '/work' },
		{ label: 'About', href: '/about' },
		{ label: 'Writing', href: '/writing' },
		{ label: 'Field Journal', href: '/field-journal' },
		{ label: 'Resume', href: '/resume' },
		{ label: 'Contact', href: '/contact' },
		{ label: 'Services', href: '/services' },
		{ label: 'Play', href: '/play' }
	];
</script>

<header class="border-border/20 bg-canvas border-b">
	<div class="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
		<a href="/" class="font-ocr text-neon text-sm tracking-wider"> λstepweaver </a>

		<!-- Desktop navigation -->
		<nav class="hidden items-center gap-6 lg:flex" aria-label="Primary navigation">
			{#each navLinks as link}
				<a
					href={link.href}
					class="text-muted hover:text-accent text-xs tracking-wider uppercase transition-colors"
				>
					{link.label}
				</a>
			{/each}
		</nav>

		<!-- Mobile menu button -->
		<button
			type="button"
			class="border-border/30 text-neon flex h-10 w-10 items-center justify-center border lg:hidden"
			aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
			aria-expanded={menuOpen}
			onclick={() => (menuOpen = !menuOpen)}
		>
			{#if menuOpen}
				<span class="font-ocr text-xl">×</span>
			{:else}
				<span class="flex flex-col gap-1.5">
					<span class="bg-neon block h-px w-5"></span>
					<span class="bg-neon block h-px w-5"></span>
					<span class="bg-neon block h-px w-5"></span>
				</span>
			{/if}
		</button>
	</div>

	<!-- Mobile navigation -->
	{#if menuOpen}
		<nav
			class="border-border/20 bg-surface border-t px-6 py-4 lg:hidden"
			aria-label="Mobile navigation"
		>
			<div class="mx-auto flex max-w-7xl flex-col">
				{#each navLinks as link}
					<a
						href={link.href}
						class="border-border/10 text-muted hover:text-accent border-b py-3 text-sm tracking-wider uppercase transition-colors last:border-b-0"
						onclick={() => (menuOpen = false)}
					>
						{link.label}
					</a>
				{/each}
			</div>
		</nav>
	{/if}
</header>
