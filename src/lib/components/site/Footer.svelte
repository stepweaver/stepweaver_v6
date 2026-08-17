<script lang="ts">
	type FooterLink = {
		label: string;
		href: string;
		external?: boolean;
	};

	const year = new Date().getFullYear();

	const links: FooterLink[] = [
		{
			label: 'GitHub',
			href: 'https://github.com/stepweaver',
			external: true
		},
		{
			label: 'Work',
			href: '/work'
		},
		{
			label: 'Play',
			href: '/play'
		},
		{
			label: 'Privacy',
			href: '/privacy'
		},
		{
			label: 'Contact',
			href: '/contact'
		}
	];
</script>

<footer class="relative z-10 border-t border-neon/20 bg-canvas px-4 py-6">
	<div
		class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row"
	>
		<div class="font-ocr text-xs text-muted">
			<a href="/terminal" class="transition-colors hover:text-neon">λstepweaver</a>
			© {year}
		</div>

		<nav aria-label="Footer navigation">
			<ul class="flex items-center gap-4 text-xs text-muted">
				{#each links as link}
					<li>
						<a
							href={link.href}
							target={link.external ? '_blank' : undefined}
							rel={link.external ? 'noopener noreferrer' : undefined}
							class="transition-colors hover:text-neon"
						>
							{link.label}
						</a>
					</li>
				{/each}
			</ul>
		</nav>
	</div>
</footer>