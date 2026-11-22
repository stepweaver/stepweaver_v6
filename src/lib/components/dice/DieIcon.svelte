<script lang="ts">
	let { sides, size = 40 }: { sides: number; size?: number } = $props();

	const showTens = $derived(size >= 36);
</script>

{#snippet tenFaces()}
	<polygon points="32,3 12,24 28,26" />
	<polygon points="12,24 32,61 27,38 28,26" opacity="0.72" />
	<polygon points="32,3 28,26 52,24" opacity="0.72" />
	<polygon points="52,24 32,61 27,38 28,26" opacity="0.45" />
{/snippet}

<svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
	{#if sides === 4}
		<polygon points="32,6 6,54 27,36" />
		<polygon points="32,6 58,54 27,36" opacity="0.72" />
		<polygon points="6,54 58,54 27,36" opacity="0.45" />
	{:else if sides === 6}
		<polygon points="14,24 32,14 50,24 32,34" />
		<polygon points="14,24 32,34 32,54 14,44" opacity="0.72" />
		<polygon points="32,34 50,24 50,44 32,54" opacity="0.45" />
	{:else if sides === 8}
		<polygon points="32,6 53,31 28,35" opacity="0.72" />
		<polygon points="53,31 32,58 28,35" opacity="0.45" />
		<polygon points="32,58 11,31 28,35" opacity="0.72" />
		<polygon points="11,31 32,6 28,35" />
	{:else if sides === 10}
		{@render tenFaces()}
	{:else if sides === 12}
		<polygon points="56,24 48,54 39,41.5 43,26.5" opacity="0.45" />
		<polygon points="48,54 16,54 23,41.5 39,41.5" opacity="0.45" />
		<polygon points="16,54 8,24 19,26.5 23,41.5" opacity="0.72" />
		<polygon points="8,24 32,5 31,17 19,26.5" opacity="0.72" />
		<polygon points="32,5 56,24 43,26.5 31,17" opacity="0.72" />
		<polygon points="31,17 43,26.5 39,41.5 23,41.5 19,26.5" />
	{:else if sides === 100}
		<g transform="translate(4 2) scale(0.58)" opacity="0.62">
			{@render tenFaces()}
		</g>
		<g transform="translate(20.6 16) scale(0.72)">
			{@render tenFaces()}
		</g>
		{#if showTens}
			<text class="tens" x="43.6" y="42" text-anchor="middle" font-size="16">00</text>
		{/if}
	{:else}
		<polygon points="19.5,6.9 4,32 19.6,23.4" />
		<polygon points="44.6,11.3 19.5,6.9 19.6,23.4" opacity="0.72" />
		<polygon points="19.5,51.7 19.6,23.4 4,32" opacity="0.72" />
		<polygon points="44.6,38.9 60,32 44.6,11.3" opacity="0.45" />
		<polygon points="44.6,38.9 44.5,57.1 60,32" opacity="0.45" />
		<polygon points="44.6,38.9 19.5,51.7 44.5,57.1" opacity="0.45" />
		<polygon points="44.6,38.9 44.6,11.3 19.6,23.4" />
		<polygon points="44.6,38.9 19.6,23.4 19.5,51.7" opacity="0.72" />
		<polygon class="shell" points="4,32 19.5,6.9 44.6,11.3 60,32 44.5,57.1 19.5,51.7" />
	{/if}
</svg>

<style>
	svg {
		display: block;
		fill: currentColor;
		overflow: visible;
	}

	.shell {
		fill: none;
		stroke: currentColor;
		stroke-width: 1.5px;
		stroke-linejoin: miter;
		vector-effect: non-scaling-stroke;
	}

	.tens {
		fill: var(--panel);
		font-family: var(--font-family-ibm);
		font-weight: 700;
	}
</style>
