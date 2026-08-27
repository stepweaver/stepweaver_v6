<script lang="ts">
	import Hero from '$lib/components/home/Hero.svelte';
	import { identity } from '$lib/data/identity';
	import FeaturedSystems from './_components/FeaturedSystems.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{identity.name} | {identity.site}</title>
	<meta name="description" content={identity.positioning.short} />
</svelte:head>

<Hero />
<FeaturedSystems projects={data.projects} />
