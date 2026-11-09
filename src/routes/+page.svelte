<script lang="ts">
	import OperatorCard from '#lib/components/home/OperatorCard.svelte';
	import {
		AGENT_OWNERSHIP_NOTE,
		BACKGROUND_LEAD,
		HOMEPAGE_CHAPTER_NOTE,
		HOMEPAGE_EXPERIENCE,
		HOW_I_WORK,
		PRIMARY_TITLE,
		PROFESSIONAL_SUMMARY,
		SUPPORTING_LINE,
		TRAJECTORY,
		WHAT_I_DO
	} from '#lib/data/identity.ts';
</script>

<svelte:head>
	<title>Stephen Weaver | {PRIMARY_TITLE}</title>
</svelte:head>

<div class="home-wrap">
	<section class="hero-grid">
		<OperatorCard />
		<div class="hero-copy">
			<h1>
				Business Systems Developer
				<br />
				<span>&amp; Systems Integration Consultant</span>
			</h1>
			<p class="lede">{PROFESSIONAL_SUMMARY[0]}</p>
			<p class="support-line">{SUPPORTING_LINE}</p>
			<div class="button-row">
				<a class="glitch-button primary" href="/contact?intent=consult"
					>Let's talk about your system</a
				>
				<a class="glitch-button" href="/writing">Writing</a>
				<a class="glitch-button" href="/about">About</a>
			</div>
		</div>
	</section>

	<section class="section" aria-labelledby="what-i-do">
		<p class="label section-kicker" id="what-i-do">What I do</p>
		<h2 class="section-title">The work is the system, not a catalog of projects.</h2>
		<div class="offer-grid">
			{#each WHAT_I_DO as item (item.title)}
				<article class="offer">
					<h3>{item.title}</h3>
					<p>{item.body}</p>
				</article>
			{/each}
		</div>
	</section>

	<section class="section" aria-labelledby="how-i-work">
		<p class="label section-kicker" id="how-i-work">How I work</p>
		<h2 class="section-title">Understand the workflow, then make it operable.</h2>
		<div class="step-grid">
			{#each HOW_I_WORK as item (item.step)}
				<article class="step">
					<span class="label">{item.step}</span>
					<h3>{item.title}</h3>
					<p>{item.body}</p>
				</article>
			{/each}
		</div>
		<p class="quiet-note">{AGENT_OWNERSHIP_NOTE}</p>
	</section>

	<section class="section" aria-labelledby="background">
		<p class="label section-kicker" id="background">Background</p>
		<h2 class="section-title">The chronology matches the résumé.</h2>
		<div class="stack-list">
			{#each HOMEPAGE_EXPERIENCE as item (item.org)}
				<article class="experience">
					<h3>{item.role} · {item.org}</h3>
					<p class="meta">{item.when}</p>
					<p>{item.body}</p>
				</article>
			{/each}
		</div>
		<p>{HOMEPAGE_CHAPTER_NOTE}</p>
		<p>{BACKGROUND_LEAD}</p>
		<p>{TRAJECTORY.framing}</p>
	</section>

	<section class="section" aria-labelledby="writing-preview">
		<p class="label section-kicker" id="writing-preview">Recent writing</p>
		<h2 class="section-title">Writing will live here.</h2>
		<div class="writing-placeholder">
			<p>
				Notion is still the CMS. This build does not fetch it yet, so no posts are shown. The empty
				state is intentional, tracked as Milestone 2 in <code>docs/MIGRATION.md</code>.
			</p>
			<p><a href="/writing">Writing status</a></p>
		</div>
	</section>

	<section class="section panel" aria-labelledby="conversation">
		<p class="label section-kicker" id="conversation">Conversation</p>
		<h2 class="section-title">Tell me about the system.</h2>
		<p>
			The contact form is not connected in this build. You can still start from the contact page,
			which shows the email address and does not pretend to send a message.
		</p>
		<div class="button-row">
			<a class="glitch-button primary" href="/contact?intent=consult"
				>Let's talk about your system</a
			>
			<a class="glitch-button" href="/resume">Resume</a>
		</div>
		<p class="quiet-links">
			Terminal and Lab are not rebuilt here.
			<a href="/terminal">Terminal status</a>
			·
			<a href="/lab">Lab status</a>
		</p>
	</section>
</div>
