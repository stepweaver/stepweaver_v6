<script lang="ts">
	type Variant = 'primary' | 'secondary';

	type Props = {
		href: string;
		label: string;
		variant?: Variant;
	};

	let { href, label, variant = 'secondary' }: Props = $props();

	const baseClasses =
		'inline-flex items-center justify-center border px-5 py-3 font-ocr text-sm uppercase tracking-wide transition-colors';

	const variantClasses: Record<Variant, string> = {
		primary: 'border-neon bg-neon/10 text-neon hover:bg-neon/20',
		secondary: 'border-muted/50 text-text hover:border-neon hover:text-neon'
	};
</script>

<a href={href} class={`${baseClasses} ${variantClasses[variant]}`}>
	{label}
</a>