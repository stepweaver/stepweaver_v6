<script lang="ts">
	const playItems = [
		{
			href: '/terminal',
			label: 'Terminal',
			description: 'Command-style portfolio shell: resume, chat, codex, weather, games.'
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
		content="Playground lane: terminal, field journal, Meshtastic, and experiments. Personality without crowding the hiring path."
	/>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-16 pt-24 sm:px-6">
	<header class="mb-8">
		<p class="font-ocr text-neon mb-2 text-sm tracking-wider">// PLAY</p>

		<h1 class="text-text mb-4 text-3xl sm:text-4xl">Playground</h1>

		<p class="text-secondary max-w-2xl text-sm">
			Experiments and personality surfaces. The hiring path lives on Work, About, Resume, and
			Contact. This lane is for curiosity.
		</p>
	</header>

	<div class="border-border/20 bg-border/15 grid grid-cols-1 gap-px border sm:grid-cols-2">
		{#each playItems as item (item.href)}
			<a href={item.href} class="group bg-panel hover:bg-neon/3 block p-6 transition-colors">
				<h2 class="font-ibm text-text group-hover:text-neon mb-2 text-lg transition-colors">
					{item.label}
				</h2>

				<p class="text-secondary text-sm">
					{item.description}
				</p>
			</a>
		{/each}
	</div>
</div>
