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
	</section>
</div>
