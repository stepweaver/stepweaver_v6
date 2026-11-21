<script lang="ts">
	import { LAMBDA, splitLambda } from '$lib/text/lambda';

	let { text }: { text: string } = $props();
	const parts = $derived(splitLambda(text));
</script>

{#each parts as part, index (index)}{#if index > 0}<span class="lambda-glyph">{LAMBDA}</span
		>{/if}{part}{/each}

<style>
	.lambda-glyph {
		text-transform: none;
	}
</style>
