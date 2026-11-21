<script lang="ts">
	import ActionLink from '$lib/components/ui/ActionLink.svelte';
	import LambdaText from '$lib/components/site/LambdaText.svelte';
	import { identity } from '$lib/data/identity';
	import { resumeData } from '$lib/data/resume-data';
	import { upperLabel } from '$lib/text/lambda';
</script>

<svelte:head>
	<title>Resume | λstepweaver</title>
	<meta
		name="description"
		content="Professional background: systems, automation, and business-facing software."
	/>
</svelte:head>

<div class="resume">
	<div class="resume-inner">
		<header class="resume-header">
			<div>
				<p class="kicker">
					<LambdaText text={resumeData.identity.eyebrow} />
				</p>

				<h1>
					{resumeData.identity.title}
				</h1>

				<p class="subtitle">
					{resumeData.identity.subtitle}
				</p>
			</div>

			<div class="resume-actions">
				<ActionLink
					href={identity.links.resumePdf}
					label="Download current PDF"
					variant="primary"
				/>
				<ActionLink href="/resume/draft.pdf" label="Download draft PDF" />
				<ActionLink href={identity.links.about} label="About" />
				<ActionLink href={identity.links.contactHire} label="Contact" />
			</div>
		</header>

		<div class="sheet">
			<section>
				<p class="section-label">Identity</p>

				<p class="copy">
					{resumeData.identity.statement}
				</p>
			</section>

			<section>
				<p class="section-label">
					{resumeData.summary.title}
				</p>

				<p class="copy">
					{resumeData.summary.practice}
				</p>
				<ul class="points">
					{#each resumeData.summary.body as item (item)}
						<li>
							<span class="bullet">·</span>
							<span>{item}</span>
						</li>
					{/each}
				</ul>
			</section>

			<section>
				<p class="section-label skills-label">
					{resumeData.skills.title}
				</p>

				<div class="skill-groups">
					{#each resumeData.skills.groups as group (group.label)}
						<div class="skill-group">
							<p class="group-label">
								{group.label}
							</p>

							<ul class="skill-list">
								{#each group.items as skill (skill)}
									<li>{skill}</li>
								{/each}
							</ul>
						</div>
					{/each}
				</div>
			</section>

			<section>
				<div class="plain-label">
					{upperLabel(resumeData.experience.title)}
				</div>

				<div class="roles">
					{#each resumeData.experience.roles as role (`${role.org}-${role.role}-${role.when}`)}
						<div class="role">
							<div class="role-header">
								<div>
									<div class="role-title">
										{role.role}
									</div>

									<div class="role-org"><LambdaText text={role.org} /></div>
								</div>

								<div class="role-when">
									{role.when}
								</div>
							</div>

							<ul class="points role-points">
								{#each role.bullets as bullet (bullet)}
									<li>
										<span class="bullet" aria-hidden="true">·</span>
										<span><LambdaText text={bullet} /></span>
									</li>
								{/each}
							</ul>
						</div>
					{/each}
				</div>
			</section>

			<section>
				<p class="copy">
					Current PDF is the production file already in this repository. It keeps its previous
					wording. Draft PDF is generated from this page and is marked pending editorial review. It
					does not replace the current file.
				</p>
			</section>

			<section>
				<div class="plain-label education-label">
					{upperLabel(resumeData.education.title)}
				</div>

				<ul class="education">
					{#each resumeData.education.items as item (item)}
						<li>
							{item}
						</li>
					{/each}
				</ul>
			</section>
		</div>
	</div>
</div>

<style>
	.resume {
		min-block-size: 100vh;
		padding-top: 5rem;
		padding-bottom: var(--space-2xl);
	}

	.resume-inner {
		max-inline-size: var(--content-width-narrow);
		margin-inline: auto;
		padding-inline: var(--space-md);
	}

	.resume-header {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: var(--space-md);
		margin-bottom: var(--space-xl);
	}

	.kicker,
	.section-label,
	.group-label,
	.role-when {
		font-family: var(--font-family-ocr);
		letter-spacing: var(--letter-spacing-wide);
	}

	.kicker {
		margin-bottom: 0.5rem;
		color: var(--neon);
		font-size: var(--font-size-sm);
		line-height: 1.25rem;
	}

	h1 {
		color: var(--text);
		font-size: var(--font-size-3xl);
		line-height: 2.25rem;
	}

	.subtitle {
		margin-top: 0.5rem;
		color: var(--text-meta);
		font-size: var(--font-size-sm);
		line-height: 1.25rem;
	}

	.resume-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.sheet {
		display: grid;
		gap: 2.5rem;
		border: 1px solid color-mix(in oklab, var(--neon) 20%, transparent);
		background: var(--surface);
		padding: var(--space-lg);
	}

	.section-label,
	.plain-label {
		color: var(--text-label);
	}

	.section-label {
		margin-bottom: 0.75rem;
		font-size: var(--font-size-xs);
		line-height: 1rem;
		text-transform: uppercase;
	}

	.skills-label {
		margin-bottom: var(--space-md);
	}

	.copy,
	.points,
	.education {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		line-height: 1.625;
	}

	.copy {
		max-inline-size: 48rem;
	}

	.points {
		display: grid;
		gap: 0.5rem;
		max-inline-size: 56rem;
		margin-top: 0.75rem;
	}

	.points li {
		display: flex;
		gap: 0.5rem;
	}

	.bullet {
		flex-shrink: 0;
		color: color-mix(in oklab, var(--neon) 50%, transparent);
	}

	.skill-groups {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-md);
	}

	.skill-group {
		border: 1px solid color-mix(in oklab, var(--border) 25%, transparent);
		background: color-mix(in oklab, var(--panel) 15%, transparent);
		padding: var(--space-md);
	}

	.group-label {
		margin-bottom: 0.75rem;
		color: color-mix(in oklab, var(--neon) 50%, transparent);
		font-size: 0.625rem;
		line-height: 1.5;
		letter-spacing: 0.18em;
		text-transform: uppercase;
	}

	.skill-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.skill-list li {
		border: 1px solid color-mix(in oklab, var(--border) 30%, transparent);
		padding: 0.25rem 0.5rem;
		color: var(--text-secondary);
		font-size: var(--font-size-xs);
		line-height: 1rem;
	}

	.plain-label {
		margin-bottom: var(--space-md);
	}

	.education-label {
		margin-bottom: 0.75rem;
	}

	.roles {
		display: grid;
		gap: var(--space-lg);
	}

	.role {
		border: 1px solid color-mix(in oklab, var(--border) 25%, transparent);
		padding: 1.25rem;
	}

	.role-header {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		column-gap: var(--space-md);
		row-gap: 0.25rem;
	}

	.role-title {
		color: var(--text);
		font-family: var(--font-family-ibm);
		font-size: var(--font-size-sm);
		line-height: 1.25rem;
	}

	.role-org,
	.role-when {
		color: var(--text-meta);
		font-size: var(--font-size-xs);
		line-height: 1rem;
	}

	.role-points {
		margin-top: 0.75rem;
	}

	.education {
		display: grid;
		gap: 0.5rem;
	}

	@media (min-width: 40rem) {
		.resume-inner {
			padding-inline: var(--space-lg);
		}

		h1 {
			font-size: 2.25rem;
			line-height: 2.5rem;
		}

		.sheet {
			padding: var(--space-xl);
		}
	}

	@media (min-width: 48rem) {
		.skill-groups {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>
