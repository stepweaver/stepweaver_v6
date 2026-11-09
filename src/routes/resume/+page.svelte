<script lang="ts">
	import {
		CAREER_TRANSITION,
		HOMEPAGE_EXPERIENCE,
		PRIMARY_TITLE,
		PRODUCTION_RESUME_PDF,
		PROFESSIONAL_SUMMARY,
		SUPPORTING_LINE,
		TRAJECTORY
	} from '#lib/data/identity.ts';
</script>

<svelte:head>
	<title>Resume | λstepweaver</title>
	<meta name="description" content={`${PRIMARY_TITLE}. ${SUPPORTING_LINE}.`} />
</svelte:head>

<div class="page-wrap">
	<p class="page-kicker">// RESUME</p>
	<h1 class="page-title">Stephen Weaver</h1>
	<p>{PRIMARY_TITLE}</p>
	<p class="support-line">{SUPPORTING_LINE}</p>

	<section class="section">
		<h2>Summary</h2>
		{#each PROFESSIONAL_SUMMARY as paragraph (paragraph)}
			<p>{paragraph}</p>
		{/each}
	</section>

	<section class="section">
		<h2>Recent chronology</h2>
		{#each HOMEPAGE_EXPERIENCE as item (item.org)}
			<article class="experience">
				<h3>{item.role} · {item.org}</h3>
				<p class="meta">{item.when}</p>
				<p>{item.body}</p>
			</article>
		{/each}
		<p>{CAREER_TRANSITION}</p>
		<ul>
			{#each TRAJECTORY.items as item (item)}
				<li>{item}</li>
			{/each}
		</ul>
	</section>

	<section class="panel section">
		<h2>PDF</h2>
		<p>
			The downloadable résumé is the production file. It has not been regenerated for the title on
			this page. This build does not generate a new PDF.
		</p>
		<p>
			<a href={PRODUCTION_RESUME_PDF}>Production résumé PDF</a>
		</p>
	</section>
</div>
