<script lang="ts">
	import { onMount } from 'svelte';
	import { applyTheme, currentTheme, toggleLightDark } from '$lib/theme/apply-theme';
	import { isLightAppearance, THEME_IDS, type ThemeId } from '$lib/theme/themes';

	let theme = $state<ThemeId>('dark');
	let ready = $state(false);

	onMount(() => {
		theme = currentTheme();
		ready = true;
	});

	function onSelect(event: Event) {
		const next = (event.currentTarget as HTMLSelectElement).value as ThemeId;
		theme = next;
		applyTheme(next);
	}

	function onToggle() {
		const next = toggleLightDark(theme);
		theme = next;
		applyTheme(next);
	}
</script>

<label class="theme-label">
	<span class="sr-only">Appearance</span>
	<select aria-label="Appearance" value={theme} onchange={onSelect}>
		{#each THEME_IDS as id (id)}
			<option value={id}>{id}</option>
		{/each}
	</select>
</label>

<button type="button" onclick={onToggle} disabled={!ready}>
	{isLightAppearance(theme) ? 'Switch to dark theme' : 'Switch to light theme'}
</button>

<style>
	.theme-label,
	select,
	button {
		font-family: var(--font-family-ocr);
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		background: transparent;
	}

	select,
	button {
		border: 1px solid var(--border-muted);
		padding: 0.35rem 0.5rem;
	}

	button:disabled {
		opacity: 0.5;
	}

	.sr-only {
		position: absolute;
		inline-size: 1px;
		block-size: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
	}
</style>
