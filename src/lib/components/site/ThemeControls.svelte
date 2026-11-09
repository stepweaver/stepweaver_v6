<script lang="ts">
	import { onMount } from 'svelte';
	import { applyTheme, currentTheme, toggleLightDark } from '#lib/theme/apply-theme.ts';
	import { isLightAppearance, THEME_IDS, type ThemeId } from '#lib/theme/themes.ts';

	let theme = $state<ThemeId>('dark');
	let ready = $state(false);

	onMount(() => {
		theme = currentTheme();
		applyTheme(theme);
		ready = true;
	});

	function onToggle() {
		theme = toggleLightDark(theme);
		applyTheme(theme);
	}

	function onSelect(event: Event) {
		const value = (event.currentTarget as HTMLSelectElement).value;
		if (!THEME_IDS.includes(value as ThemeId)) return;
		theme = value as ThemeId;
		applyTheme(theme);
	}

	const toggleLabel = $derived(`Switch to ${isLightAppearance(theme) ? 'dark' : 'light'} theme`);
</script>

<select class="appearance-select" aria-label="Appearance" value={theme} onchange={onSelect}>
	{#each THEME_IDS as id (id)}
		<option value={id}>{id}</option>
	{/each}
</select>

<button
	type="button"
	class="theme-toggle {theme}"
	aria-label={toggleLabel}
	title={toggleLabel}
	disabled={!ready}
	onclick={onToggle}
>
	<span class="theme-toggle-lambda">
		<img class="lambda-icon {theme}" src="/images/lambda_stepweaver.png" alt="" />
	</span>
</button>

<style>
	.theme-toggle-lambda img {
		width: 1.5rem;
		height: 1.5rem;
	}
</style>
