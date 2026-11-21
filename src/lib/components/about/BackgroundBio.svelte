<script lang="ts">
	import LambdaText from '$lib/components/site/LambdaText.svelte';
	import { identity } from '$lib/data/identity';
</script>

<h2 class="headline">
	{identity.philosophy.headline}
</h2>

<div class="bio">
	<p>
		{identity.philosophy.body}
	</p>

	<p class="trajectory">Trajectory</p>

	<ul class="trajectory-list">
		<li>U.S. Air Force veteran; Airborne Cryptologic Linguist</li>
		<li>Restaurant operations and management</li>
		<li>Business analysis</li>
		<li>Self-taught developer</li>
		<li><LambdaText text={identity.currently} /></li>
	</ul>
</div>

<footer class="bio-footer">
	<p class="invitation">Curious about my work or want to chat?</p>

	<p class="contact-copy">
		Check out my
		<a href={identity.links.resume} class="bio-link"> resume </a>
		or
		<a href={identity.links.contact} class="bio-link"> send me a message </a>.
	</p>
</footer>

<style>
	.headline {
		margin-bottom: 1.25rem;
		color: var(--text);
		font-size: var(--font-size-xl);
		line-height: 1.25;
	}

	.bio {
		display: grid;
		gap: var(--space-md);
		color: var(--text-secondary);
	}

	.bio,
	.contact-copy {
		font-size: var(--font-size-sm);
		line-height: 1.625;
	}

	.trajectory,
	.contact-copy {
		color: var(--text);
	}

	.trajectory {
		font: var(--font-size-xs) / 1rem var(--font-family-ocr);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
	}

	.trajectory-list {
		list-style: disc;
		padding-inline-start: 1.25rem;
	}

	.trajectory-list li + li,
	.contact-copy {
		margin-top: 0.5rem;
	}

	.bio-footer {
		margin-top: var(--space-xl);
		border-top: 1px solid color-mix(in oklab, var(--border) 20%, transparent);
		padding-top: var(--space-lg);
	}

	.invitation {
		color: var(--accent);
		font-size: var(--font-size-base);
		line-height: 1.5rem;
	}

	.bio-link {
		color: var(--neon);
		font-weight: 600;
		text-decoration: underline;
		transition: color var(--duration) var(--ease);
	}

	@media (hover: hover) {
		.bio-link:hover {
			color: var(--accent);
			text-decoration: none;
		}
	}

	@media (min-width: 48rem) {
		.headline {
			font-size: var(--font-size-2xl);
		}

		.bio,
		.contact-copy {
			font-size: var(--font-size-base);
		}

		.invitation {
			font-size: var(--font-size-lg);
			line-height: 1.75rem;
		}
	}
</style>
