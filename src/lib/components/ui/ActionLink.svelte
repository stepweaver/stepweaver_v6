<script lang="ts">
	type Variant = 'primary' | 'secondary';

	type Props = {
		href: string;
		label: string;
		variant?: Variant;
		external?: boolean;
	};

	let { href, label, variant = 'secondary', external = false }: Props = $props();
</script>

<a
	{href}
	target={external ? '_blank' : undefined}
	rel={external ? 'noopener noreferrer' : undefined}
	class="action-link"
	class:action-link--primary={variant === 'primary'}
	class:action-link--secondary={variant === 'secondary'}
>
	{label}
</a>

<style>
	.action-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding-inline: 1.25rem;
		padding-block: 0.75rem;
		border: 1px solid;
		font-family: var(--font-family-ocr);
		font-size: var(--font-size-sm);
		letter-spacing: 0.025em;
		text-transform: uppercase;
		transition:
			color var(--duration) var(--ease),
			background-color var(--duration) var(--ease),
			border-color var(--duration) var(--ease);
	}

	.action-link--primary {
		border-color: var(--neon);
		background: color-mix(in oklch, var(--neon) 10%, transparent);
		color: var(--neon);

		&:hover {
			background: color-mix(in oklch, var(--neon) 20%, transparent);
		}
	}

	.action-link--secondary {
		border-color: color-mix(in oklch, var(--text-muted) 50%, transparent);
		color: var(--text);

		&:hover {
			border-color: var(--neon);
			color: var(--neon);
		}
	}
</style>
