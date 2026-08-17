<script lang="ts">
	import { briefData } from '$lib/data/brief-data';
</script>

<svelte:head>
	<title>About | λstepweaver</title>
	<meta
		name="description"
		content="Where Stephen Weaver fits: product-minded systems builder for operations, internal tools, and AI-assisted workflows."
	/>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-16 pt-24 sm:px-6">
	<header class="mb-8">
		<p class="font-ocr text-neon mb-2 text-sm tracking-wider">// ABOUT</p>

		<h1 class="text-text mb-2 text-3xl sm:text-4xl">
			{briefData.identity.name}
		</h1>

		<p class="text-meta text-sm">
			{briefData.identity.roles.join(' · ')}
		</p>
	</header>

	<section class="border-neon/20 bg-surface space-y-8 border p-6 sm:p-8">
		<div>
			<p class="font-ocr text-label mb-2 text-xs tracking-wider uppercase">Statement</p>

			<p class="text-secondary text-sm leading-relaxed">
				{briefData.identity.statement}
			</p>
		</div>

		<div>
			<p class="font-ocr text-label mb-3 text-xs tracking-wider uppercase">
				{briefData.roleFit.title}
			</p>

			<ul class="space-y-2">
				{#each briefData.roleFit.items as item (item)}
					<li class="text-secondary flex gap-2 text-sm leading-relaxed">
						<span class="text-neon/50 shrink-0">·</span>
						<span>{item}</span>
					</li>
				{/each}
			</ul>
		</div>

		<div class="border-border/25 bg-panel/15 border p-4">
			<p class="font-ocr text-label mb-2 text-xs tracking-wider uppercase">Selective Consulting</p>

			<p class="text-secondary mb-3 text-sm leading-relaxed">
				Hiring is the primary path. I also take on custom data workflows and ops systems when the
				people and problem fit, when there is a need I can get passionate about. Not volume
				consulting; relationship-gated work.
			</p>

			<a href="/services" class="text-neon hover:text-accent text-xs transition-colors">
				See how consulting fits →
			</a>
		</div>

		<div>
			<p class="font-ocr text-label mb-3 text-xs tracking-wider uppercase">Flagship Work</p>

			<div class="space-y-4">
				{#each briefData.flagshipProjects as project (project.slug)}
					<div class="border-border/25 bg-panel/15 border p-4">
						<div class="mb-1 flex flex-wrap items-baseline gap-2">
							<span class="text-text text-sm">{project.label}</span>
							<span class="font-ocr text-neon/45 text-[10px] tracking-wider uppercase">
								{project.type}
							</span>
						</div>

						<p class="text-secondary mb-2 text-xs leading-relaxed">
							{project.summary}
						</p>

						<div class="mb-2 flex flex-wrap gap-1.5">
							{#each project.tags as tag (tag)}
								<span class="border-border/30 text-meta border px-1.5 py-0.5 text-[10px]">
									{tag}
								</span>
							{/each}
						</div>

						<a href={project.href} class="text-neon hover:text-accent text-xs transition-colors">
							View case study →
						</a>
					</div>
				{/each}
			</div>
		</div>

		<div>
			<p class="font-ocr text-label mb-3 text-xs tracking-wider uppercase">
				{briefData.stackSnapshot.title}
			</p>

			<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
				{#each briefData.stackSnapshot.categories as category (category.label)}
					<div>
						<p class="font-ocr text-neon/50 mb-2 text-[10px] tracking-[0.18em] uppercase">
							{category.label}
						</p>

						<ul class="space-y-1">
							{#each category.items as item (item)}
								<li class="text-secondary text-xs">
									{item}
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		</div>
	</section>
</div>
