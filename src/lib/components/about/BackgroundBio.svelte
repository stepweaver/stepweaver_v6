<script lang="ts">
	import { identity } from '$lib/data/identity';
</script>

<h2 class="text-text mb-5 text-xl leading-tight md:text-2xl">
	{identity.philosophy.headline}
</h2>

<div class="text-secondary space-y-4 text-sm leading-relaxed md:text-base">
	<p>
		{identity.philosophy.body}
	</p>

	<p class="font-ocr text-text text-xs tracking-wider uppercase">Trajectory</p>

	<ul class="list-disc space-y-2 pl-5">
		<li>U.S. Air Force veteran; Airborne Cryptologic Linguist</li>
		<li>Restaurant operations and management</li>
		<li>Business analysis</li>
		<li>Self-taught developer</li>
		<li>{identity.currently}</li>
	</ul>
</div>

<footer class="border-border/20 mt-8 space-y-2 border-t pt-6">
	<p class="text-accent text-base md:text-lg">Curious about my work or want to chat?</p>

	<p class="text-text text-sm leading-relaxed md:text-base">
		Check out my
		<a
			href={identity.links.resume}
			class="text-neon hover:text-accent font-semibold underline transition-colors hover:no-underline"
		>
			resume
		</a>
		or
		<a
			href={identity.links.contact}
			class="text-neon hover:text-accent font-semibold underline transition-colors hover:no-underline"
		>
			send me a message
		</a>.
	</p>
</footer>
