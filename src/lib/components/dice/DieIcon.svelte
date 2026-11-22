<script lang="ts">
	let { sides, size = 40 }: { sides: number; size?: number } = $props();
</script>

<svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
	{#if sides === 4}
		<path fill-rule="evenodd" d="M32 6 L58 54 L6 54 Z M32 16 L35 16 L35 48 L32 48 Z" />
	{:else if sides === 6}
		<polygon points="14,24 32,14 50,24 32,34" />
		<polygon points="14,24 32,34 32,54 14,44" opacity="0.72" />
		<polygon points="32,34 50,24 50,44 32,54" opacity="0.45" />
	{:else if sides === 8}
		<path fill-rule="evenodd" d="M32 4 L58 32 L32 60 L6 32 Z M8 30 L56 30 L56 34 L8 34 Z" />
	{:else if sides === 10 || sides === 100}
		<path fill-rule="evenodd" d="M32 3 L52 24 L32 61 L12 24 Z M29 14 L35 14 L35 50 L29 50 Z" />
	{:else if sides === 12}
		<path
			fill-rule="evenodd"
			d="M32 5 L56 24 L48 54 L16 54 L8 24 Z M32 20 L44 28 L40 46 L24 46 L20 28 Z"
		/>
	{:else}
		<path fill-rule="evenodd" d="M32 5 L60 56 L4 56 Z M32 20 L48 50 L16 50 Z" />
	{/if}
</svg>

<style>
	svg {
		display: block;
		fill: currentColor;
		overflow: visible;
	}
</style>
