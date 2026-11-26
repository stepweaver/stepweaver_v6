<script lang="ts">
	import { formatMiles, type HistoryBucket } from '$lib/journal/mileage';

	let { weeks, months }: { weeks: HistoryBucket[]; months: HistoryBucket[] } = $props();

	let view = $state<'month' | 'week'>('month');
	const buckets = $derived(view === 'month' ? months : weeks);
	const peak = $derived(Math.max(1, ...buckets.map((bucket) => bucket.miles ?? 0)));
	const width = $derived(Math.max(buckets.length * 36, 280));

	function height(miles: number | null): number {
		if (miles === null || miles <= 0) return 0;
		return Math.max(4, (miles / peak) * 120);
	}

	function status(bucket: HistoryBucket): string {
		if (bucket.miles === null) return 'No record';
		if (bucket.partial) return 'Open';
		return 'Recorded';
	}

	function milesText(bucket: HistoryBucket): string {
		if (bucket.miles === null) return 'No record';
		return formatMiles(bucket.miles);
	}
</script>

<section class="history" aria-labelledby="distance-history-heading">
	<div class="heading">
		<div>
			<h2 id="distance-history-heading">Distance</h2>
			<p>Recorded miles. A day with no entry is left out, not counted as zero.</p>
		</div>
		<div role="group" aria-label="Distance history range">
			<button type="button" aria-pressed={view === 'month'} onclick={() => (view = 'month')}>
				Monthly
			</button>
			<button type="button" aria-pressed={view === 'week'} onclick={() => (view = 'week')}>
				Weekly
			</button>
		</div>
	</div>

	{#if buckets.length === 0}
		<p class="empty">No walking mileage is recorded yet.</p>
	{:else}
		<div class="chart-scroll">
			<svg
				viewBox="0 0 {width} 148"
				role="img"
				aria-hidden="true"
				class="chart"
				style:inline-size="{width}px"
			>
				{#each buckets as bucket, index (bucket.key)}
					{@const bar = height(bucket.miles)}
					<rect
						x={index * 36 + 8}
						y={128 - bar}
						width="20"
						height={bar}
						fill={bucket.partial ? 'var(--text-meta)' : 'var(--neon)'}
					/>
					<text x={index * 36 + 18} y="144" text-anchor="middle">{bucket.axisLabel}</text>
				{/each}
			</svg>
		</div>

		<table>
			<caption>
				{view === 'month' ? 'Miles by month' : 'Miles by week, Monday through Sunday'}. A day with
				no entry is left out, not counted as zero. Open means the period is unfinished or clipped by
				the first or last record.
			</caption>
			<thead>
				<tr>
					<th scope="col">Period</th>
					<th scope="col">Recorded miles</th>
					<th scope="col">Walking days</th>
					<th scope="col">Status</th>
				</tr>
			</thead>
			<tbody>
				{#each buckets as bucket (bucket.key)}
					<tr>
						<th scope="row">{bucket.label}</th>
						<td>{milesText(bucket)}</td>
						<td>{bucket.walkingDays}</td>
						<td>{status(bucket)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</section>

<style>
	.history {
		margin-top: var(--space-xl);
		min-inline-size: 0;
	}

	.heading {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		justify-content: space-between;
		gap: var(--space-md);
	}

	h2 {
		color: var(--text);
		font-size: var(--font-size-2xl);
		line-height: var(--line-height-tight);
	}

	.heading p,
	.empty,
	caption {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-body);
	}

	.heading p {
		max-inline-size: 36rem;
		margin-top: var(--space-xs);
	}

	button {
		min-block-size: 2.75rem;
		padding: 0.5rem 0.9rem;
		border: 1px solid color-mix(in oklab, var(--border) 45%, transparent);
		background: transparent;
		color: var(--text-meta);
		font-family: var(--font-family-ocr);
		font-size: var(--font-size-xs);
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	button + button {
		margin-inline-start: -1px;
	}

	button[aria-pressed='true'] {
		border-color: var(--neon);
		color: var(--neon);
		background: color-mix(in oklab, var(--neon) 8%, transparent);
	}

	.chart-scroll {
		max-inline-size: 100%;
		min-inline-size: 0;
		margin-top: var(--space-md);
		overflow-x: auto;
	}

	.chart {
		display: block;
		block-size: 9.25rem;
		max-inline-size: none;
	}

	text {
		fill: var(--text-meta);
		font-family: var(--font-family-ocr);
		font-size: 9px;
	}

	table {
		width: 100%;
		margin-top: var(--space-md);
		border-collapse: collapse;
		font-size: var(--font-size-sm);
	}

	caption {
		margin-bottom: var(--space-sm);
		text-align: start;
	}

	th,
	td {
		padding: 0.45rem 0.35rem;
		border-bottom: 1px solid color-mix(in oklab, var(--border) 35%, transparent);
		text-align: start;
		vertical-align: top;
	}

	td:nth-child(2),
	td:nth-child(3) {
		font-variant-numeric: tabular-nums;
	}
</style>
