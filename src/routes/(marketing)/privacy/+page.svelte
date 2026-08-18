<script lang="ts">
	const lastUpdated = new Intl.DateTimeFormat('en-US').format(new Date());
</script>

<svelte:head>
	<title>Privacy | λstepweaver</title>
	<meta name="description" content="Privacy policy." />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-16 pt-24 sm:px-6">
	<header class="mb-8">
		<p class="font-ocr text-neon mb-2 text-sm tracking-wider">// PRIVACY</p>

		<h1 class="text-text mb-4 text-3xl">Privacy Policy</h1>

		<p class="text-secondary text-sm">
			Last updated: {lastUpdated}
		</p>
	</header>

	<div class="border-border/25 bg-surface space-y-6 border p-6 sm:p-8">
		<section>
			<h2 class="font-ibm text-text mb-2 text-lg">Data Collection</h2>

			<p class="text-secondary text-sm leading-relaxed">
				This site collects minimal analytics data through Vercel Analytics. Contact form submissions
				are sent via email and not stored. No personal data is sold or shared with third parties.
			</p>
		</section>

		<section>
			<h2 class="font-ibm text-text mb-2 text-lg">Cookies</h2>

			<p class="text-secondary text-sm leading-relaxed">
				Theme preference is stored in localStorage only. No tracking cookies are used.
			</p>
		</section>

		<section>
			<h2 class="font-ibm text-text mb-2 text-lg">AI Chat</h2>

			<p class="text-secondary text-sm leading-relaxed">
				Chat messages are sent to AI providers (Groq or OpenAI) for processing. Conversations are
				not persisted on the server.
			</p>
		</section>

		<section>
			<h2 class="font-ibm text-text mb-2 text-lg">Contact</h2>

			<p class="text-secondary text-sm leading-relaxed">
				For privacy inquiries, contact
				<a href="mailto:hello@stepweaver.dev" class="text-neon hover:text-accent transition-colors">
					hello@stepweaver.dev
				</a>.
			</p>
		</section>
	</div>
</div>
