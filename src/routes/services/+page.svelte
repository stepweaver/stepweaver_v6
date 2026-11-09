<script lang="ts">
	import { AGENT_OWNERSHIP_NOTE, PRIMARY_TITLE, WHAT_I_DO } from '#lib/data/identity.ts';
</script>

<svelte:head>
	<title>What I Do | λstepweaver</title>
	<meta
		name="description"
		content={`${PRIMARY_TITLE}. Systems discovery, integration, automation, custom software, and applied AI.`}
	/>
</svelte:head>

<div class="page-wrap">
	<p class="page-kicker">// WHAT I DO</p>
	<h1 class="page-title">Systems work for real operations.</h1>
	<p class="lede">
		I help when a workflow, an integration, or a piece of software is in the way of the work. This
		is not an agency menu and not a list of unverified case studies.
	</p>
	<div class="button-row">
		<a class="glitch-button primary" href="/contact?intent=consult">Let's talk about your system</a>
		<a class="glitch-button" href="/about">About</a>
	</div>

	<section class="section" aria-labelledby="offers">
		<h2 class="label" id="offers">Capabilities</h2>
		<div class="offer-grid">
			{#each WHAT_I_DO as item (item.title)}
				<article class="offer">
					<h3>{item.title}</h3>
					<p>{item.body}</p>
				</article>
			{/each}
		</div>
		<p>{AGENT_OWNERSHIP_NOTE}</p>
	</section>

	<section class="panel section">
		<p class="label">Hiring and consulting</p>
		<p>
			Both conversations are welcome. Say which one it is. The form on the contact page does not
			send mail yet; the address there does.
		</p>
	</section>
</div>
