<script lang="ts">
	import { identity } from '$lib/data/identity';

	type FooterLink = {
		label: string;
		href: string;
		external?: boolean;
	};

	const year = new Date().getFullYear();

	const links: FooterLink[] = [
		{
			label: 'GitHub',
			href: identity.links.github,
			external: true
		},
		{
			label: 'Work',
			href: identity.links.work
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
			href: identity.links.contact
		}
	];
</script>

<footer class="site-footer">
	<div class="site-footer-inner">
		<div class="site-footer-mark">
			<a href="/terminal">{identity.brand}</a>
			© {year}
		</div>

		<nav aria-label="Footer navigation">
			<ul class="site-footer-links">
				{#each links as link (link.href)}
					<li>
						<a
							href={link.href}
							target={link.external ? '_blank' : undefined}
							rel={link.external ? 'noopener noreferrer' : undefined}
						>
							{link.label}
						</a>
					</li>
				{/each}
			</ul>
		</nav>
	</div>
</footer>

<style>
	.site-footer {
		position: relative;
		z-index: 10;
		background: var(--canvas);
		padding-inline: var(--space-md);
		padding-block: var(--space-lg);
		border-block-start: 1px solid var(--border-muted);
	}

	.site-footer-inner {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		max-inline-size: var(--content-width-wide);
		margin-inline: auto;
	}

	.site-footer-mark {
		font-family: var(--font-family-ocr);
		font-size: var(--font-size-xs);
		color: var(--text-muted);

		a {
			transition: color var(--duration) var(--ease);

			&:hover {
				color: var(--neon);
			}
		}
	}

	.site-footer-links {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		font-size: var(--font-size-xs);
		color: var(--text-muted);

		a {
			transition: color var(--duration) var(--ease);

			&:hover {
				color: var(--neon);
			}
		}
	}

	@media (width >= 40rem) {
		.site-footer-inner {
			flex-direction: row;
		}
	}
</style>
