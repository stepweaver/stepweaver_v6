<script lang="ts">
	const playItems = [
		{
			href: '/terminal',
			label: 'Terminal',
			description: 'Command console for the résumé: help, resume, and clear.'
		},
		{
			href: '/field-journal',
			label: 'Field Journal',
			description: 'Personal walking and fitness log: miles, weather, recovery, milestones.'
		},
		{
			href: '/meshtastic',
			label: 'Meshtastic',
			description: 'Field-guide docs and notes for mesh radio tinkering.'
		},
		{
			href: '/dice-roller',
			label: 'Dice Roller',
			description: 'RPG dice utility with local persistence.'
		},
		{
			href: '/yankee-samurai',
			label: 'Yankee Samurai',
			description: 'Identity / experiment surface.'
		},
		{
			href: '/mail-sort-academy',
			label: 'Mail Sort Academy',
			description: 'Unofficial mail-classification study drill from public educational material.'
		}
	];
</script>

<svelte:head>
	<title>Play | λstepweaver</title>
	<meta
		name="description"
		content="Playground index. The linked tools are not connected in this build."
	/>
</svelte:head>

<div class="play">
	<header class="intro">
		<p class="kicker">// PLAY</p>

		<h1>Playground</h1>

		<p class="lede">
			This index is kept from the earlier shell. The terminal console is available. The other tools
			are not connected in this build.
		</p>
	</header>

	<div class="play-grid">
		{#each playItems as item (item.href)}
			<a href={item.href} class="play-card">
				<h2>{item.label}</h2>

				<p>
					{item.description}
				</p>
			</a>
		{/each}
	</div>
</div>

<style>
	.play {
		max-inline-size: var(--content-width-narrow);
		margin-inline: auto;
		padding: var(--space-3xl) var(--space-md) var(--space-2xl);
	}

	.intro {
		margin-bottom: var(--space-xl);
	}

	.kicker {
		margin-bottom: 0.5rem;
		color: var(--neon);
		font-family: var(--font-family-ocr);
		font-size: var(--font-size-sm);
		line-height: 1.25rem;
		letter-spacing: var(--letter-spacing-wide);
	}

	h1 {
		margin-bottom: var(--space-md);
		color: var(--text);
		font-size: var(--font-size-3xl);
		line-height: 2.25rem;
	}

	.lede {
		max-inline-size: 42rem;
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		line-height: 1.25rem;
	}

	.play-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1px;
		border: 1px solid color-mix(in oklab, var(--border) 20%, transparent);
		background: color-mix(in oklab, var(--border) 15%, transparent);
	}

	.play-card {
		display: block;
		background: var(--panel);
		padding: var(--space-lg);
		transition: background-color var(--duration) var(--ease);
	}

	.play-card h2 {
		margin-bottom: 0.5rem;
		color: var(--text);
		font-family: var(--font-family-ibm);
		font-size: var(--font-size-lg);
		line-height: 1.75rem;
		transition: color var(--duration) var(--ease);
	}

	.play-card p {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		line-height: 1.25rem;
	}

	@media (hover: hover) {
		.play-card:hover {
			background: color-mix(in oklab, var(--neon) 3%, transparent);
		}

		.play-card:hover h2 {
			color: var(--neon);
		}
	}

	@media (min-width: 40rem) {
		.play {
			padding-inline: var(--space-lg);
		}

		h1 {
			font-size: 2.25rem;
			line-height: 2.5rem;
		}

		.play-grid {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>
