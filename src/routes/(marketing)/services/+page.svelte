<script lang="ts">
	import ActionLink from '$lib/components/ui/ActionLink.svelte';
	import { AGENT_OWNERSHIP_NOTE, WHAT_I_DO } from '$lib/data/identity';
</script>

<svelte:head>
	<title>Services | λstepweaver</title>
	<meta
		name="description"
		content="Business analysis, systems integration, automation, custom software, and applied AI for real operations."
	/>
</svelte:head>

<div class="services">
	<header>
		<p class="kicker">// WHAT I DO</p>

		<h1>Systems work for real operations.</h1>

		<div class="lede">
			<p>
				I help when a workflow, an integration, or a piece of software is in the way of the work.
				This is not an agency menu and not a list of unverified case studies.
			</p>
		</div>

		<div class="intro-actions">
			<ActionLink
				href="/contact?intent=consult"
				label="Let's talk about your system"
				variant="primary"
			/>
			<ActionLink href="/about" label="About" />
		</div>
	</header>

	<section>
		<div class="section-label">HOW I CAN HELP</div>

		<div class="offers">
			{#each WHAT_I_DO as offer (offer.title)}
				<div class="offer">
					<h2>{offer.title}</h2>
					<p>{offer.body}</p>
				</div>
			{/each}
		</div>
		<p class="note">{AGENT_OWNERSHIP_NOTE}</p>
	</section>

	<div class="next">
		<div>
			<div class="section-label next-label">NEXT STEP</div>

			<p class="next-copy">
				Tell me what is broken, what you are building, and why it matters. If it is a hire
				conversation, say that too.
			</p>
		</div>

		<div class="next-action">
			<ActionLink href="/contact?intent=consult" label="Get in Touch" variant="primary" />
		</div>
	</div>
</div>

<style>
	.services {
		display: grid;
		gap: 3rem;
		max-inline-size: var(--content-width-narrow);
		margin-inline: auto;
		padding: var(--page-top-space, var(--space-3xl)) var(--space-md) var(--space-2xl);
	}

	.kicker {
		margin-bottom: 0.5rem;
		color: var(--neon);
		font-family: var(--font-family-ocr);
		font-size: var(--font-size-sm);
		line-height: 1.25rem;
		letter-spacing: var(--letter-spacing-wide);
	}

	h1 {
		margin-bottom: var(--space-md);
		color: var(--text);
		font-size: var(--font-size-3xl);
		line-height: 2.25rem;
	}

	.lede {
		max-inline-size: 48rem;
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		line-height: 1.25rem;
	}

	.intro-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: var(--space-lg);
	}

	.section-label {
		margin-bottom: var(--space-md);
		color: var(--text-label);
	}

	.next-label {
		margin-bottom: 0.5rem;
	}

	.offers {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1px;
		border: 1px solid color-mix(in oklab, var(--border) 20%, transparent);
		background: color-mix(in oklab, var(--border) 15%, transparent);
	}

	.offer {
		scroll-margin-top: var(--space-3xl);
		background: var(--panel);
		padding: var(--space-lg);
	}

	.offer h2 {
		margin-bottom: 0.5rem;
		color: var(--text);
		font-family: var(--font-family-ibm);
		font-size: var(--font-size-lg);
		line-height: 1.75rem;
	}

	.offer p,
	.note,
	.next-copy {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		line-height: 1.25rem;
	}

	.offer p {
		line-height: 1.625;
	}

	.note {
		max-inline-size: 48rem;
		margin-top: var(--space-lg);
	}

	.next {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		border: 1px solid color-mix(in oklab, var(--border) 25%, transparent);
		background: var(--surface);
		padding: var(--space-lg);
	}

	.next-copy {
		max-inline-size: 36rem;
	}

	.next-action {
		flex-shrink: 0;
	}

	@media (min-width: 40rem) {
		.services {
			padding-inline: var(--space-lg);
		}

		h1 {
			font-size: 3rem;
			line-height: 1;
		}

		.lede {
			font-size: var(--font-size-base);
			line-height: 1.5rem;
		}

		.next {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
			padding: var(--space-xl);
		}
	}

	@media (min-width: 48rem) {
		.offers {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>
