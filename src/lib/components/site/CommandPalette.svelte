<script lang="ts">
	import { onMount } from 'svelte';
	import { PALETTE_LINKS } from '#lib/data/navigation.ts';

	let open = $state(false);
	let closeButton = $state<HTMLButtonElement | null>(null);

	function toggle() {
		open = !open;
	}

	onMount(() => {
		const onKey = (event: KeyboardEvent) => {
			if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
				event.preventDefault();
				open = !open;
			} else if (event.key === 'Escape') {
				open = false;
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	$effect(() => {
		if (open) closeButton?.focus();
	});
</script>

<button type="button" class="palette-button" aria-expanded={open} onclick={toggle}> Ctrl+K </button>

{#if open}
	<div class="palette-overlay" role="dialog" aria-modal="true" aria-label="Site navigation">
		<div class="overlay-top">
			<p class="label">Navigation</p>
			<button
				type="button"
				class="glitch-button quiet"
				bind:this={closeButton}
				onclick={() => (open = false)}
			>
				Close
			</button>
		</div>
		<p class="palette-note">Pages only. Terminal commands are not available in this build.</p>
		<div class="palette-list">
			{#each PALETTE_LINKS as link (link.href)}
				<a href={link.href} onclick={() => (open = false)}>
					<span>{link.label}</span>
					{#if link.note}<span class="meta">{link.note}</span>{/if}
				</a>
			{/each}
		</div>
	</div>
{/if}
