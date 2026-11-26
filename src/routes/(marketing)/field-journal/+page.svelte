<script lang="ts">
	import DistanceChart from '$lib/components/journal/DistanceChart.svelte';
	import {
		formatJournalDate,
		formatMiles,
		type MileageRejection,
		type PeriodTotal
	} from '$lib/journal/mileage';

	let { data } = $props();
	const journal = $derived(data.journal);
	const entry = $derived(journal.status === 'ok' ? journal.journal : null);

	function periodValue(period: PeriodTotal): string {
		if (period.miles === null) return 'No record';
		return `${formatMiles(period.miles)} miles`;
	}

	function rejectionCopy(rejection: MileageRejection): string {
		const dated = rejection.dates.filter((date) => date !== 'undated');
		const undated = rejection.dates.includes('undated');
		if (rejection.reason === 'duplicate-date') {
			return `More than one public record uses ${dated.join(', ')}. Totals stay hidden until each date has one public entry.`;
		}
		if (rejection.reason === 'negative-miles') {
			return `Mileage on ${dated.join(', ')} is negative, so no total is shown.`;
		}
		if (rejection.reason === 'invalid-miles') {
			return `Mileage on ${dated.join(', ')} is not a number this journal can publish.`;
		}
		const parts: string[] = [];
		if (undated) parts.push('A public record is missing a calendar date.');
		if (dated.length > 0) parts.push(`These dates are not usable: ${dated.join(', ')}.`);
		return `${parts.join(' ')} No total is shown.`;
	}
</script>

<div class="journal">
	<header class="intro">
		<p class="kicker">// FIELD JOURNAL</p>
		<h1>The Long Walk</h1>
		<p class="lede">
			A record of miles walked: the distance that has added up, and the days that were written down.
			A blank day is left blank. It is not a zero.
		</p>
	</header>

	{#if journal.status === 'unconfigured'}
		<p class="notice" role="status">
			The mileage source is not configured for this app. This is not an empty journal.
		</p>
	{:else if journal.status === 'unavailable'}
		<p class="notice" role="status">
			The mileage record is temporarily unavailable. This is not an empty journal, and an older copy
			is not shown after the publication window.
		</p>
	{:else if journal.status === 'rejected'}
		<div class="notice" role="status">
			{#each journal.rejections as rejection (rejection.reason)}
				<p>{rejectionCopy(rejection)}</p>
			{/each}
		</div>
	{:else if journal.status === 'empty'}
		<p class="notice" role="status">
			No public mileage is recorded yet. This is not a zero-mile total.
		</p>
	{:else if entry && entry.recordedEntries === 0}
		<p class="notice" role="status">
			Public dates are here, and none of them include a mileage value. Missing mileage is not shown
			as zero.
		</p>
	{:else if entry}
		<p class="span">
			Recorded from {formatJournalDate(entry.firstDate ?? '')} to {formatJournalDate(
				entry.lastDate ?? ''
			)}.
		</p>
		<p class="total">
			<span class="total-value">{formatMiles(entry.totalMiles)}</span>
			<span class="total-unit">miles recorded</span>
		</p>

		<dl class="stats">
			<div>
				<dt>Walking days</dt>
				<dd>{entry.walkingDays}</dd>
			</div>
			<div>
				<dt>Average per walking day</dt>
				<dd>
					{entry.averageMiles === null
						? 'No walking days'
						: `${formatMiles(entry.averageMiles)} miles`}
				</dd>
			</div>
			<div>
				<dt>This week</dt>
				<dd>
					{periodValue(entry.currentWeek)}
					{#if entry.currentWeek.partial && entry.currentWeek.miles !== null}
						<span class="meta">Still open. Unlogged days are omitted.</span>
					{/if}
				</dd>
			</div>
			<div>
				<dt>This month</dt>
				<dd>
					{periodValue(entry.currentMonth)}
					{#if entry.currentMonth.partial && entry.currentMonth.miles !== null}
						<span class="meta">Still open. Unlogged days are omitted.</span>
					{/if}
				</dd>
			</div>
		</dl>

		<DistanceChart weeks={entry.weeks} months={entry.months} />

		<section class="milestone" aria-labelledby="next-distance">
			<h2 id="next-distance">Next distance</h2>
			{#if entry.milestone.nextMiles === null}
				<p>{formatMiles(entry.milestone.previousMiles)} miles is the last mark on this scale.</p>
			{:else}
				<p>
					{formatMiles(entry.milestone.milesRemaining ?? 0)} miles to {formatMiles(
						entry.milestone.nextMiles
					)}.
				</p>
				<div
					class="track"
					role="progressbar"
					aria-valuemin={entry.milestone.previousMiles}
					aria-valuemax={entry.milestone.nextMiles}
					aria-valuenow={entry.milestone.recordedMiles}
					aria-valuetext="{formatMiles(entry.milestone.milesRemaining ?? 0)} miles to {formatMiles(
						entry.milestone.nextMiles
					)}"
				>
					<div
						class="fill"
						style:inline-size="{Math.max(0, Math.min(100, entry.milestone.progress * 100))}%"
					></div>
				</div>
			{/if}
		</section>
	{/if}

	<p class="writing-link">
		<a href="/writing?tag=Field%20Journal">Notes tagged Field Journal</a>
	</p>
</div>

<style>
	.journal {
		max-inline-size: 46rem;
		min-inline-size: 0;
		margin-inline: auto;
		padding: var(--page-top-space, var(--space-3xl)) var(--space-md) var(--space-2xl);
	}

	.kicker,
	.meta,
	.writing-link a {
		font-family: var(--font-family-ocr);
	}

	.kicker {
		margin-bottom: 0.5rem;
		color: var(--neon);
		font-size: var(--font-size-sm);
		letter-spacing: var(--letter-spacing-wide);
	}

	h1,
	h2,
	.total-value,
	dd {
		color: var(--text);
	}

	h1 {
		font-size: var(--font-size-3xl);
		line-height: var(--line-height-tight);
	}

	h2 {
		font-size: var(--font-size-2xl);
		line-height: var(--line-height-tight);
	}

	.lede,
	.notice,
	.span,
	.milestone p,
	.meta {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-body);
	}

	.lede,
	.span {
		max-inline-size: 40rem;
		margin-top: var(--space-md);
	}

	.notice {
		margin-top: var(--space-lg);
		border: 1px solid color-mix(in oklab, var(--border) 30%, transparent);
		padding: 1.25rem;
	}

	.notice p + p {
		margin-top: 0.75rem;
	}

	.total {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.75rem;
		margin-top: var(--space-lg);
	}

	.total-value {
		font-family: var(--font-family-ibm);
		font-size: clamp(2.75rem, 12vw, 4.5rem);
		font-variant-numeric: tabular-nums;
		line-height: 0.95;
	}

	.total-unit {
		color: var(--text-secondary);
		font-size: var(--font-size-lg);
	}

	.stats {
		display: grid;
		gap: var(--space-md);
		margin-top: var(--space-xl);
	}

	@media (min-width: 40rem) {
		.stats {
			grid-template-columns: 1fr 1fr;
		}
	}

	dt {
		color: var(--text-meta);
		font-family: var(--font-family-ocr);
		font-size: var(--font-size-xs);
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	dd {
		margin-top: 0.35rem;
		font-family: var(--font-family-ibm);
		font-size: var(--font-size-xl);
		font-variant-numeric: tabular-nums;
		line-height: var(--line-height-snug);
	}

	.meta {
		display: block;
		margin-top: 0.35rem;
		font-family: var(--font-family-ocr);
		font-size: var(--font-size-xs);
	}

	.milestone {
		margin-top: var(--space-xl);
	}

	.milestone p {
		margin-top: var(--space-sm);
	}

	.track {
		max-inline-size: 24rem;
		block-size: 0.55rem;
		margin-top: var(--space-md);
		border: 1px solid var(--border);
		background: color-mix(in oklab, var(--border) 25%, transparent);
	}

	.fill {
		block-size: 100%;
		background: var(--neon);
	}

	.writing-link {
		margin-top: var(--space-xl);
	}

	.writing-link a {
		color: var(--neon);
		font-size: var(--font-size-xs);
		letter-spacing: 0.04em;
	}
</style>
