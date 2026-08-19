<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const project = $derived(data.project);
</script>

<svelte:head>
	<title>{project.title} | λstepweaver</title>
	<meta name="description" content={project.description} />
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-16 pt-24 sm:px-6">
	<a
		href="/work"
		class="font-ocr text-neon hover:text-accent mb-6 inline-block text-xs tracking-wider transition-colors"
	>
		← BACK TO WORK
	</a>

	<div class="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
		<aside class="space-y-4">
			<section class="border-border/20 bg-panel border p-4">
				<p class="font-ocr text-label mb-2 text-xs tracking-wider">SYS.BRIEF</p>

				<h1 class="text-text mb-3 text-xl">
					{project.title}
				</h1>

				<p class="font-ocr text-neon mb-3 text-xs tracking-wider">
					[{project.status.toUpperCase()}]
				</p>

				<p class="text-secondary text-sm">
					{project.description}
				</p>
			</section>

			{#if project.builtFor || project.solved || project.delivered?.length}
				<section class="border-border/20 bg-panel space-y-4 border p-4">
					<p class="font-ocr text-label text-xs tracking-wider">SUMMARY</p>

					{#if project.builtFor}
						<div>
							<p class="font-ocr text-neon/60 mb-1 text-[10px] tracking-wider uppercase">
								Context / Users
							</p>

							<p class="text-secondary text-xs leading-relaxed">
								{project.builtFor}
							</p>
						</div>
					{/if}

					{#if project.solved}
						<div>
							<p class="font-ocr text-neon/60 mb-1 text-[10px] tracking-wider uppercase">
								What changed
							</p>

							<p class="text-secondary text-xs leading-relaxed">
								{project.solved}
							</p>
						</div>
					{/if}

					{#if project.delivered?.length}
						<div>
							<p class="font-ocr text-neon/60 mb-1 text-[10px] tracking-wider uppercase">
								Key decisions
							</p>

							<ul class="space-y-1">
								{#each project.delivered.slice(0, 4) as item (item)}
									<li class="text-secondary flex gap-2 text-xs leading-relaxed">
										<span class="text-neon/50 shrink-0">·</span>
										<span>{item}</span>
									</li>
								{/each}
							</ul>
						</div>
					{/if}
				</section>
			{/if}

			{#if project.tags.length}
				<section class="border-border/20 bg-panel border p-4">
					<p class="font-ocr text-label mb-2 text-xs tracking-wider">TAGS</p>

					<div class="flex flex-wrap gap-1.5">
						{#each project.tags as tag (tag)}
							<span class="border-border/30 text-secondary border px-2 py-0.5 text-xs">
								{tag}
							</span>
						{/each}
					</div>
				</section>
			{/if}
		</aside>

		<main class="min-w-0">
			<section class="border-border/20 bg-panel border p-6">
				<p class="font-ocr text-label mb-3 text-xs tracking-wider">CASE STUDY</p>

				<h2 class="text-text mb-3 text-2xl">
					{project.title}
				</h2>

				<p class="text-secondary max-w-3xl leading-relaxed">
					{project.description}
				</p>
			</section>
		</main>
	</div>
</div>
