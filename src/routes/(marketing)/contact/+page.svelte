<script lang="ts">
	import { page } from '$app/state';

	type IntentCopy = {
		title: string;
		blurb: string;
	};

	function getIntentCopy(intent: string | null): IntentCopy {
		if (intent === 'consult') {
			return {
				title: 'Consulting inquiry',
				blurb:
					'Tell me about the workflow, data movement, or ops problem. Selective fit: if we vibe and the need is real, we can talk scope.'
			};
		}

		if (intent === 'hire' || intent === 'brief') {
			return {
				title: 'Hiring conversation',
				blurb:
					'Open to roles where operations, internal tools, and practical AI meet. Share the team, stack, and what you need built.'
			};
		}

		return {
			title: 'Get in Touch',
			blurb:
				"Hiring is the primary path. Selective consulting for custom data workflows when the fit is right. Say which lane you're in."
		};
	}

	let intent = $derived(page.url.searchParams.get('intent'));
	let copy = $derived(getIntentCopy(intent));

	let hireActive = $derived(intent === 'hire' || intent === 'brief');
	let consultActive = $derived(intent === 'consult');
	let generalActive = $derived(!intent);
</script>

<svelte:head>
	<title>Contact | λstepweaver</title>
	<meta name="description" content="Get in touch." />
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-16 pt-24 sm:px-6">
	<header class="mb-8">
		<p class="font-ocr text-neon mb-2 text-sm tracking-wider">// CONTACT</p>

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
					hireActive ? 'border-neon text-neon' : 'border-border/30 text-meta hover:border-neon/50'
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
</div>
