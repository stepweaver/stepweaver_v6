<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>{data.project.title} | λstepweaver</title>
</svelte:head>

<div class="page-wrap">
	<p class="page-kicker">// CASE STUDY</p>
	<h1 class="page-title">{data.project.title}</h1>
	<p>{data.project.description}</p>
	<p class="meta">
		Registry status: {data.project.registryStatus}. Publication was explicitly approved.
	</p>
	<p>Recorded links are shown as stored. This page does not re-check that a demo is up.</p>
	{#if data.project.link}
		<p><a href={data.project.link}>Recorded link</a></p>
	{/if}
	{#if data.project.repo}
		<p><a href={data.project.repo}>Recorded repository</a></p>
	{/if}
	<ul>
		{#each data.project.tags as tag (tag)}
			<li>{tag}</li>
		{/each}
	</ul>
</div>
