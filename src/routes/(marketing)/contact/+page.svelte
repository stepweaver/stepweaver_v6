<script lang="ts">
	import { enhance } from '$app/forms';
	import { env } from '$env/dynamic/public';
	import { page } from '$app/state';
	import { mountTurnstile, type TurnstileHandle } from '$lib/contact/turnstile-widget';
	import { identity } from '$lib/data/identity';
	import { onMount } from 'svelte';

	type IntentCopy = {
		title: string;
		blurb: string;
		placeholder: string;
	};

	let { form } = $props();

	function getIntentCopy(intent: string | null): IntentCopy {
		if (intent === 'hire' || intent === 'brief') {
			return {
				title: 'Hiring conversation',
				blurb:
					'Open to roles where business analysis, internal tools, integrations, and practical AI meet. Share the team and the work.',
				placeholder: 'Role, team context, and why this might be a fit...'
			};
		}
		if (intent === 'general') {
			return {
				title: 'General note',
				blurb: 'For anything that is not a consulting engagement or a hiring conversation.',
				placeholder: 'What would you like to talk about...'
			};
		}
		return {
			title: 'Consulting inquiry',
			blurb:
				'Tell me about the workflow, the handoffs, or the system that is not keeping up. If the problem is real and the fit is right, we can talk scope.',
			placeholder: "What's broken, who feels it, and what a good outcome looks like..."
		};
	}

	let intent = $derived(page.url.searchParams.get('intent'));
	let copy = $derived(getIntentCopy(intent));
	let intentValue = $derived(
		intent === 'hire' || intent === 'brief' ? 'hire' : intent === 'general' ? 'general' : 'consult'
	);
	let hireActive = $derived(intent === 'hire' || intent === 'brief');
	let consultActive = $derived(intent !== 'hire' && intent !== 'brief' && intent !== 'general');
	let generalActive = $derived(intent === 'general');
	let siteKey = $derived(env.PUBLIC_TURNSTILE_SITE_KEY ?? '');
	let name = $state('');
	let email = $state('');
	let message = $state('');
	let openedAt = $state('');
	let turnstileToken = $state('');
	let submitting = $state(false);
	let widget: HTMLDivElement | undefined = $state();
	let challenge: TurnstileHandle | undefined;

	$effect(() => {
		if (!form?.success) return;
		name = '';
		email = '';
		message = '';
		turnstileToken = '';
	});

	onMount(() => {
		openedAt = String(Date.now());
		if (!siteKey || !widget) return;
		const handle = mountTurnstile(widget, siteKey, (token) => {
			turnstileToken = token;
		});
		challenge = handle;
		return () => {
			handle.destroy();
			challenge = undefined;
		};
	});
</script>

<svelte:head>
	<title>Contact | λstepweaver</title>
	<meta
		name="description"
		content="Consulting inquiries, hiring conversations, and general notes for Stephen Weaver."
	/>
</svelte:head>

<div class="contact">
	<header class="intro">
		<p class="kicker">// CONTACT</p>
		<h1>{copy.title}</h1>
		<p class="blurb">{copy.blurb}</p>
		<p class="email-row">
			<a class="email-link" href="mailto:{identity.email}">
				{identity.email}
			</a>
		</p>
		<nav class="intents" aria-label="Contact intent">
			<a
				href="/contact?intent=consult"
				class:active={consultActive}
				aria-current={consultActive ? 'page' : undefined}>CONSULT</a
			>
			<a
				href="/contact?intent=hire"
				class:active={hireActive}
				aria-current={hireActive ? 'page' : undefined}>HIRE</a
			>
			<a
				href="/contact?intent=general"
				class:active={generalActive}
				aria-current={generalActive ? 'page' : undefined}>GENERAL</a
			>
		</nav>
	</header>

	<form
		method="POST"
		novalidate
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
				turnstileToken = '';
				challenge?.reset();
			};
		}}
	>
		<input type="hidden" name="intent" value={intentValue} />
		<input type="hidden" name="opened_at" value={openedAt} />
		<input type="hidden" name="cf_turnstile_response" value={turnstileToken} />

		<div class="hp" aria-hidden="true">
			<label for="company_website">Company website</label>
			<input
				id="company_website"
				name="company_website"
				type="text"
				tabindex="-1"
				autocomplete="off"
			/>
		</div>

		<div class="field">
			<label for="name">Name</label>
			<input
				id="name"
				name="name"
				type="text"
				required
				maxlength="200"
				autocomplete="name"
				bind:value={name}
				aria-invalid={form?.fieldErrors?.name ? 'true' : undefined}
				aria-describedby={form?.fieldErrors?.name ? 'name-error' : undefined}
				placeholder="Your name"
			/>
			{#if form?.fieldErrors?.name}
				<p id="name-error" class="field-error">{form.fieldErrors.name}</p>
			{/if}
		</div>

		<div class="field">
			<label for="email">Email</label>
			<input
				id="email"
				name="email"
				type="email"
				required
				maxlength="200"
				autocomplete="email"
				bind:value={email}
				aria-invalid={form?.fieldErrors?.email ? 'true' : undefined}
				aria-describedby={form?.fieldErrors?.email ? 'email-error' : undefined}
				placeholder="you@example.com"
			/>
			{#if form?.fieldErrors?.email}
				<p id="email-error" class="field-error">{form.fieldErrors.email}</p>
			{/if}
		</div>

		<div class="field">
			<label for="message">Message</label>
			<textarea
				id="message"
				name="message"
				required
				maxlength="5000"
				rows="6"
				bind:value={message}
				aria-invalid={form?.fieldErrors?.message ? 'true' : undefined}
				aria-describedby={form?.fieldErrors?.message ? 'message-error' : undefined}
				placeholder={copy.placeholder}></textarea>
			{#if form?.fieldErrors?.message}
				<p id="message-error" class="field-error">{form.fieldErrors.message}</p>
			{/if}
		</div>

		{#if siteKey}
			<div bind:this={widget}></div>
		{:else}
			<p class="form-note">
				The bot check is not configured in this environment. A submission will not be sent.
			</p>
		{/if}

		{#if form?.message}
			<p
				role={form.success ? 'status' : 'alert'}
				class="form-status"
				class:form-status-ok={form.success}
				class:form-status-error={!form.success}
			>
				{form.message}
			</p>
		{/if}

		<button type="submit" disabled={submitting}>
			{submitting ? 'Sending...' : 'Send message'}
		</button>
	</form>
</div>

<style>
	.contact {
		max-inline-size: 42rem;
		margin-inline: auto;
		padding: var(--page-top-space, var(--space-3xl)) var(--space-md) var(--space-2xl);
	}

	.intro {
		margin-bottom: var(--space-xl);
	}

	.kicker,
	.email-link,
	.intents,
	button {
		font-family: var(--font-family-ocr);
	}

	.kicker {
		margin-bottom: 0.5rem;
		color: var(--neon);
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

	.blurb {
		max-inline-size: 36rem;
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		line-height: 1.25rem;
	}

	.email-row {
		margin-top: var(--space-md);
	}

	.email-link,
	button {
		border: 1px solid var(--neon);
		color: var(--neon);
		font-size: var(--font-size-sm);
		line-height: 1.25rem;
		letter-spacing: 0.025em;
		transition:
			background-color var(--duration) var(--ease),
			border-color var(--duration) var(--ease),
			color var(--duration) var(--ease);
	}

	.email-link {
		display: inline-block;
		padding: 0.5rem 1rem;
	}

	.intents {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: var(--space-md);
		font-size: var(--font-size-xs);
		line-height: 1rem;
		letter-spacing: 0.025em;
	}

	.intents a {
		border: 1px solid color-mix(in oklab, var(--border) 30%, transparent);
		padding: 0.25rem 0.5rem;
		color: var(--text-meta);
		transition:
			color var(--duration) var(--ease),
			border-color var(--duration) var(--ease);
	}

	.intents a.active {
		border-color: var(--neon);
		color: var(--neon);
	}

	form {
		border: 1px solid color-mix(in oklab, var(--border) 25%, transparent);
		background: var(--surface);
		padding: var(--space-lg);
	}

	form > :not(:last-child) {
		margin-bottom: var(--space-lg);
	}

	.field label {
		display: block;
		margin-bottom: 0.5rem;
		color: var(--text-label);
	}

	.field input,
	.field textarea {
		box-sizing: border-box;
		width: 100%;
		border: 1px solid color-mix(in oklab, var(--border) 30%, transparent);
		background: var(--panel);
		padding: 0.5rem 0.75rem;
		color: var(--text);
		font-family: var(--font-family-ibm);
		font-size: var(--font-size-sm);
		line-height: 1.25rem;
		transition: border-color var(--duration) var(--ease);
	}

	.field textarea {
		resize: none;
	}

	.field input:focus,
	.field textarea:focus {
		border-color: var(--neon);
		outline: none;
	}

	.field-error,
	.form-status-error {
		color: var(--danger);
		font-size: var(--font-size-sm);
		line-height: 1.25rem;
	}

	.form-note,
	.form-status {
		font-size: var(--font-size-sm);
		line-height: 1.25rem;
	}

	.form-note {
		color: var(--text-meta);
	}

	.form-status-ok {
		color: var(--neon);
	}

	button {
		padding: 0.5rem 1rem;
	}

	button:disabled {
		opacity: 0.6;
	}

	.hp {
		position: absolute;
		inline-size: 1px;
		block-size: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}

	@media (hover: hover) {
		.email-link:hover,
		button:hover {
			background: color-mix(in oklab, var(--neon) 10%, transparent);
		}

		.intents a:hover {
			border-color: color-mix(in oklab, var(--neon) 50%, transparent);
		}
	}

	@media (min-width: 40rem) {
		.contact {
			padding-inline: var(--space-lg);
		}

		h1 {
			font-size: 2.25rem;
			line-height: 2.5rem;
		}

		form {
			padding: var(--space-xl);
		}
	}
</style>
