<script lang="ts">
	import { onMount } from 'svelte';
	import { applyTheme, currentTheme, toggleLightDark } from '$lib/theme/apply-theme';
	import { isLightAppearance, THEME_IDS, type ThemeId } from '$lib/theme/themes';

	let { variant = 'header' }: { variant?: 'header' | 'menu' } = $props();

	let theme = $state<ThemeId>('dark');
	let ready = $state(false);
	const label = $derived(
		isLightAppearance(theme) ? 'Switch to dark theme' : 'Switch to light theme'
	);

	onMount(() => {
		const sync = () => {
			theme = currentTheme();
			ready = true;
		};
		sync();
		const observer = new MutationObserver(sync);
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme']
		});
		return () => observer.disconnect();
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

{#if variant === 'menu'}
	<label class="menu-theme">
		<span>Appearance</span>
		<select value={theme} onchange={onSelect} disabled={!ready}>
			{#each THEME_IDS as id (id)}
				<option value={id}>{id}</option>
			{/each}
		</select>
	</label>
{:else}
	<div class="theme-header">
		<label class="theme-select">
			<span class="sr-only">Appearance</span>
			<select aria-label="Appearance" value={theme} onchange={onSelect} disabled={!ready}>
				{#each THEME_IDS as id (id)}
					<option value={id}>{id}</option>
				{/each}
			</select>
		</label>

		<button
			type="button"
			class="scheme-toggle"
			aria-label={label}
			onclick={onToggle}
			disabled={!ready}
		>
			<span class="scheme-mark" aria-hidden="true">λ</span>
			<span class="scheme-text">{label}</span>
		</button>
	</div>
{/if}

<style>
	.theme-header {
		display: flex;
		align-items: center;
		gap: var(--space-md);
	}

	.theme-select,
	.menu-theme,
	select,
	.scheme-toggle {
		font-family: var(--font-family-ocr);
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		background: transparent;
	}

	select,
	.scheme-toggle {
		border: 1px solid var(--border-muted);
		padding: 0.35rem 0.5rem;
	}

	.scheme-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}

	.scheme-mark {
		display: none;
	}

	.scheme-toggle:disabled,
	select:disabled {
		opacity: 0.5;
	}

	.menu-theme {
		display: grid;
		gap: var(--space-xs);
	}

	.menu-theme span {
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
		color: var(--neon);
	}

	.menu-theme select {
		inline-size: 100%;
	}

	.sr-only {
		position: absolute;
		inline-size: 1px;
		block-size: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
	}

	@media (width < 64rem) {
		.theme-select,
		.scheme-text {
			display: none;
		}

		.scheme-toggle {
			justify-content: center;
			inline-size: 2.5rem;
			block-size: 2.5rem;
			padding: 0;
			color: var(--neon);
		}

		.scheme-mark {
			display: inline;
			font-size: var(--font-size-lg);
			line-height: 1;
		}
	}
</style>
