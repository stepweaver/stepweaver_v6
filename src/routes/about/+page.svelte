<script lang="ts">
	import {
		ABOUT_STATEMENT,
		BACKGROUND_LEAD,
		CAREER_TRANSITION,
		PRIMARY_TITLE,
		SUPPORTING_LINE,
		TRAJECTORY,
		WORKING_STACK
	} from '#lib/data/identity.ts';
</script>

<svelte:head>
	<title>About | λstepweaver</title>
	<meta
		name="description"
		content={`${PRIMARY_TITLE}. Professional narrative, chronology, and how the work gets done.`}
	/>
</svelte:head>

<div class="page-wrap">
	<p class="page-kicker">// ABOUT</p>
	<h1 class="page-title">Stephen Weaver</h1>
	<p class="support-line">{PRIMARY_TITLE}</p>
	<p class="support-line">{SUPPORTING_LINE}</p>

	<section class="panel section">
		<p class="label">Statement</p>
		<p>{ABOUT_STATEMENT}</p>
		<p class="label">Trajectory</p>
		<p>{CAREER_TRANSITION}</p>
		<p>{BACKGROUND_LEAD}</p>
		<p>{TRAJECTORY.framing}</p>
		<ul>
			{#each TRAJECTORY.items as item (item)}
				<li>{item}</li>
			{/each}
		</ul>
	</section>

	<section class="section" aria-labelledby="stack">
		<p class="label" id="stack">Working stack</p>
		<p>
			Tools that already show up in the work. This is not a promise that every engagement uses all
			of them.
		</p>
		<div class="stack-grid">
			{#each WORKING_STACK as group (group.label)}
				<article class="stack-card">
					<h2>{group.label}</h2>
					<ul>
						{#each group.items as item (item)}
							<li>{item}</li>
						{/each}
					</ul>
				</article>
			{/each}
		</div>
	</section>

	<section class="panel section">
		<p class="label">Case studies</p>
		<p>
			Project write-ups stay unpublished until each one is reviewed. This page does not link to
			them. The private inventory is in <code>docs/PROJECT_REVIEW.md</code>.
		</p>
		<p>
			<a href="/services">What I do</a> · <a href="/resume">Resume</a> ·
			<a href="/contact">Contact</a>
		</p>
	</section>
</div>
