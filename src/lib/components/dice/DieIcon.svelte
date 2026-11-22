<script lang="ts">
	let { sides, size = 40 }: { sides: number; size?: number } = $props();

	const kite = 'M32 3 L52 24 L32 61 L12 24 Z';
	const ridge = 'M29 14 L35 14 L35 50 L29 50 Z';
	const showTens = $derived(size >= 36);
</script>

<svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
	{#if sides === 4}
		<path fill-rule="evenodd" d="M32 6 L58 54 L6 54 Z M32 16 L35 16 L35 48 L32 48 Z" />
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
		<path fill-rule="evenodd" d="{kite} {ridge}" />
	{:else if sides === 12}
		<path
			fill-rule="evenodd"
			d="M32 5 L56 24 L48 54 L16 54 L8 24 Z M32 20 L44 28 L40 46 L24 46 L20 28 Z"
		/>
	{:else if sides === 100}
		<g transform="translate(2 1) scale(0.62)" opacity="0.78">
			<path fill-rule="evenodd" d="{kite} {ridge}" />
		</g>
		<g transform="translate(18 12) scale(0.82)">
			<path fill-rule="evenodd" d={showTens ? kite : `${kite} ${ridge}`} />
		</g>
		{#if showTens}
			<text class="tens" x="44" y="41" text-anchor="middle" font-size="20">00</text>
		{/if}
	{:else}
		<polygon class="facet" points="19.5,6.9 4,32 19.6,23.4" opacity="0.5" />
		<polygon class="facet" points="44.6,38.9 44.5,57.1 60,32" opacity="0.45" />
		<polygon class="facet" points="44.6,11.3 19.5,6.9 19.6,23.4" opacity="0.85" />
		<polygon class="facet" points="44.6,38.9 60,32 44.6,11.3" opacity="0.68" />
		<polygon class="facet" points="19.5,51.7 19.6,23.4 4,32" opacity="0.78" />
		<polygon class="facet" points="44.6,38.9 19.5,51.7 44.5,57.1" opacity="0.55" />
		<polygon class="facet" points="44.6,38.9 44.6,11.3 19.6,23.4" />
		<polygon class="facet" points="44.6,38.9 19.6,23.4 19.5,51.7" opacity="0.72" />
		<polygon class="shell" points="4,32 19.5,6.9 44.6,11.3 60,32 44.5,57.1 19.5,51.7" />
	{/if}
</svg>

<style>
	svg {
		display: block;
		fill: currentColor;
		overflow: visible;
	}

	.facet {
		stroke: var(--panel);
		stroke-width: 1.75px;
		stroke-linejoin: round;
		vector-effect: non-scaling-stroke;
	}

	.shell,
	.ridge {
		fill: none;
		stroke: currentColor;
		stroke-linejoin: miter;
		vector-effect: non-scaling-stroke;
	}

	.shell {
		stroke-width: 3px;
	}

	.ridge {
		stroke-width: 2.5px;
		stroke-linejoin: round;
	}

	.tens {
		fill: var(--panel);
		font-family: var(--font-family-ibm);
		font-weight: 700;
	}
</style>
