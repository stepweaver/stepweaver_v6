<script lang="ts">
	import { enhance } from '$app/forms';
	import { env } from '$env/dynamic/public';
	import { page } from '$app/state';
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
		const script = document.createElement('script');
		script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
		script.async = true;
		script.onload = () => {
			const turnstile = (
				window as Window & {
					turnstile?: {
						render: (
							element: HTMLElement,
							options: { sitekey: string; callback: (token: string) => void }
						) => void;
					};
				}
			).turnstile;
			if (!widget) return;
			turnstile?.render(widget, {
				sitekey: siteKey,
				callback(token: string) {
					turnstileToken = token;
				}
			});
		};
		document.head.appendChild(script);
	});
</script>

<svelte:head>
	<title>Contact | λstepweaver</title>
	<meta
		name="description"
		content="Consulting inquiries, hiring conversations, and general notes for Stephen Weaver."
	/>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-16 pt-24 sm:px-6">
	<header class="mb-8">
		<p class="font-ocr text-neon mb-2 text-sm tracking-wider">// CONTACT</p>
		<h1 class="text-text mb-4 text-3xl sm:text-4xl">{copy.title}</h1>
		<p class="text-secondary max-w-xl text-sm">{copy.blurb}</p>
		<p class="mt-4">
			<a
				class="font-ocr border-neon text-neon hover:bg-neon/10 inline-block border px-4 py-2 text-sm tracking-wide transition-colors"
				href="mailto:{identity.email}"
			>
				{identity.email}
			</a>
		</p>
		<nav
			class="font-ocr mt-4 flex flex-wrap gap-2 text-xs tracking-wide"
			aria-label="Contact intent"
		>
			<a
				href="/contact?intent=consult"
				class={`border px-2 py-1 transition-colors ${consultActive ? 'border-neon text-neon' : 'border-border/30 text-meta hover:border-neon/50'}`}
				aria-current={consultActive ? 'page' : undefined}>CONSULT</a
			>
			<a
				href="/contact?intent=hire"
				class={`border px-2 py-1 transition-colors ${hireActive ? 'border-neon text-neon' : 'border-border/30 text-meta hover:border-neon/50'}`}
				aria-current={hireActive ? 'page' : undefined}>HIRE</a
			>
			<a
				href="/contact?intent=general"
				class={`border px-2 py-1 transition-colors ${generalActive ? 'border-neon text-neon' : 'border-border/30 text-meta hover:border-neon/50'}`}
				aria-current={generalActive ? 'page' : undefined}>GENERAL</a
			>
		</nav>
	</header>

	<form
		method="POST"
		class="border-border/25 bg-surface space-y-6 border p-6 sm:p-8"
		novalidate
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				submitting = false;
				await update();
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

		<div>
			<label for="name" class="text-label mb-2 block">Name</label>
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
				class="bg-panel border-border/30 text-text focus:border-neon font-ibm w-full border px-3 py-2 text-sm transition-colors outline-none"
			/>
			{#if form?.fieldErrors?.name}
				<p id="name-error" class="text-sm text-red-400">{form.fieldErrors.name}</p>
			{/if}
		</div>

		<div>
			<label for="email" class="text-label mb-2 block">Email</label>
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
				class="bg-panel border-border/30 text-text focus:border-neon font-ibm w-full border px-3 py-2 text-sm transition-colors outline-none"
			/>
			{#if form?.fieldErrors?.email}
				<p id="email-error" class="text-sm text-red-400">{form.fieldErrors.email}</p>
			{/if}
		</div>

		<div>
			<label for="message" class="text-label mb-2 block">Message</label>
			<textarea
				id="message"
				name="message"
				required
				maxlength="5000"
				rows="6"
				bind:value={message}
				aria-invalid={form?.fieldErrors?.message ? 'true' : undefined}
				aria-describedby={form?.fieldErrors?.message ? 'message-error' : undefined}
				placeholder={copy.placeholder}
				class="bg-panel border-border/30 text-text focus:border-neon font-ibm w-full resize-none border px-3 py-2 text-sm transition-colors outline-none"
			></textarea>
			{#if form?.fieldErrors?.message}
				<p id="message-error" class="text-sm text-red-400">{form.fieldErrors.message}</p>
			{/if}
		</div>

		{#if siteKey}
			<div bind:this={widget}></div>
		{:else}
			<p class="text-meta text-sm">
				The bot check is not configured in this environment. A submission will not be sent.
			</p>
		{/if}

		{#if form?.message}
			<p
				role={form.success ? 'status' : 'alert'}
				class={form.success ? 'text-neon text-sm' : 'text-sm text-red-400'}
			>
				{form.message}
			</p>
		{/if}

		<button
			type="submit"
			class="font-ocr border-neon text-neon hover:bg-neon/10 border px-4 py-2 text-sm tracking-wide disabled:opacity-60"
			disabled={submitting}
		>
			{submitting ? 'Sending...' : 'Send message'}
		</button>
	</form>
</div>

<style>
	.hp {
		position: absolute;
		inline-size: 1px;
		block-size: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
