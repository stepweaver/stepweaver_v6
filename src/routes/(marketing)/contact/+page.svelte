<script lang="ts">
	import { page } from '$app/state';

	type IntentCopy = {
		title: string;
		blurb: string;
		placeholder: string;
	};

	function getIntentCopy(intent: string | null): IntentCopy {
		if (intent === 'consult') {
			return {
				title: 'Consulting inquiry',
				blurb:
					'Tell me about the workflow, data movement, or ops problem. Selective fit: if we vibe and the need is real, we can talk scope.',
				placeholder: "What's broken, who feels it, and what a good outcome looks like..."
			};
		}

		if (intent === 'hire' || intent === 'brief') {
			return {
				title: 'Hiring conversation',
				blurb:
					'Open to roles where operations, internal tools, and practical AI meet. Share the team, stack, and what you need built.',
				placeholder: 'Role, team context, and why this might be a fit...'
			};
		}

		return {
			title: 'Get in Touch',
			blurb:
				"Hiring is the primary path. Selective consulting for custom data workflows when the fit is right. Say which lane you're in.",
			placeholder: "Tell me what you're looking for..."
		};
	}

	let intent = $derived(page.url.searchParams.get('intent'));
	let copy = $derived(getIntentCopy(intent));

	let hireActive = $derived(intent === 'hire' || intent === 'brief');
	let consultActive = $derived(intent === 'consult');
	let generalActive = $derived(!intent);

	let name = $state('');
	let email = $state('');
	let message = $state('');

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
	}
</script>

<svelte:head>
	<title>Contact | λstepweaver</title>
	<meta name="description" content="Get in touch." />
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-16 pt-24 sm:px-6">
	<header class="mb-8">
		<p class="font-ocr text-neon mb-2 text-sm tracking-wider">
			// CONTACT
		</p>

		<h1 class="text-text mb-4 text-3xl sm:text-4xl">
			{copy.title}
		</h1>

		<p class="text-secondary max-w-xl text-sm">
			{copy.blurb}
		</p>

		<nav
			class="font-ocr mt-4 flex flex-wrap gap-2 text-xs tracking-wide"
			aria-label="Contact intent"
		>
			<a
				href="/contact?intent=hire"
				class={`border px-2 py-1 transition-colors ${
					hireActive
						? 'border-neon text-neon'
						: 'border-border/30 text-meta hover:border-neon/50'
				}`}
			>
				HIRE
			</a>

			<a
				href="/contact?intent=consult"
				class={`border px-2 py-1 transition-colors ${
					consultActive
						? 'border-neon text-neon'
						: 'border-border/30 text-meta hover:border-neon/50'
				}`}
			>
				CONSULT
			</a>

			<a
				href="/contact"
				class={`border px-2 py-1 transition-colors ${
					generalActive
						? 'border-neon text-neon'
						: 'border-border/30 text-meta hover:border-neon/50'
				}`}
			>
				GENERAL
			</a>
		</nav>
	</header>

	<form
		onsubmit={handleSubmit}
		class="border-border/25 bg-surface space-y-6 border p-6 sm:p-8"
	>
		<div>
			<label for="name" class="text-label mb-2 block">
				Name
			</label>

			<input
				id="name"
				name="name"
				type="text"
				bind:value={name}
				required
				placeholder="Your name"
				class="bg-panel border-border/30 text-text focus:border-neon font-ibm w-full border px-3 py-2 text-sm transition-colors outline-none"
			/>
		</div>

		<div>
			<label for="email" class="text-label mb-2 block">
				Email
			</label>

			<input
				id="email"
				name="email"
				type="email"
				bind:value={email}
				required
				placeholder="you@example.com"
				class="bg-panel border-border/30 text-text focus:border-neon font-ibm w-full border px-3 py-2 text-sm transition-colors outline-none"
			/>
		</div>

		<div>
			<label for="message" class="text-label mb-2 block">
				Message
			</label>

			<textarea
				id="message"
				name="message"
				bind:value={message}
				required
				rows={6}
				placeholder={copy.placeholder}
				class="bg-panel border-border/30 text-text focus:border-neon font-ibm w-full resize-none border px-3 py-2 text-sm transition-colors outline-none"
			></textarea>
		</div>

		<button
			type="submit"
			class="font-ocr border-neon text-neon hover:bg-neon/10 w-full border px-4 py-2 text-sm tracking-wide transition-colors sm:w-auto"
		>
			Send Message
		</button>
	</form>
</div>