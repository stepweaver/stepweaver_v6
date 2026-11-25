<script lang="ts">
	import { isSiteHref } from '$lib/writing/rich-text';
	import type { RichSpan } from '$lib/writing/types';

	let { spans }: { spans: RichSpan[] } = $props();
</script>

{#each spans as span, index (`${index}-${span.text}`)}
	{#if span.href}
		<a
			href={span.href}
			rel={isSiteHref(span.href) ? undefined : 'noopener noreferrer'}
			target={isSiteHref(span.href) ? undefined : '_blank'}
		>
			{#if span.code}<code>{span.text}</code>{:else if span.bold}<strong>{span.text}</strong
				>{:else if span.italic}<em>{span.text}</em>{:else}{span.text}{/if}
		</a>
	{:else if span.code}
		<code>{span.text}</code>
	{:else if span.bold}
		<strong>{span.text}</strong>
	{:else if span.italic}
		<em>{span.text}</em>
	{:else}
		{span.text}
	{/if}
{/each}
