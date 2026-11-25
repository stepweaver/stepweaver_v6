<script lang="ts">
	const lastUpdated = new Intl.DateTimeFormat('en-US').format(new Date());
</script>

<div class="privacy">
	<header class="intro">
		<p class="kicker">// PRIVACY</p>

		<h1>Privacy Policy</h1>

		<p class="updated">
			Last updated: {lastUpdated}
		</p>
	</header>

	<div class="policy">
		<section>
			<h2>Data Collection</h2>

			<p>
				This build does not run analytics, and the contact form does not deliver or store a message.
				No personal data is sold or shared with third parties.
			</p>
		</section>

		<section>
			<h2>Cookies</h2>

			<p>Theme preference is stored in localStorage only. No tracking cookies are used.</p>
		</section>

		<section>
			<h2>AI Chat</h2>

			<p>
				Chat messages are sent to AI providers (Groq or OpenAI) for processing. Conversations are
				not persisted on the server.
			</p>
		</section>

		<section>
			<h2>Contact</h2>

			<p>
				For privacy inquiries, contact
				<a href="mailto:hello@stepweaver.dev">hello@stepweaver.dev</a>.
			</p>
		</section>
	</div>
</div>

<style>
	.privacy {
		max-inline-size: 48rem;
		margin-inline: auto;
		padding: var(--page-top-space, var(--space-3xl)) var(--space-md) var(--space-2xl);
	}

	.intro {
		margin-bottom: var(--space-xl);
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

	.updated,
	.policy p {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		line-height: 1.25rem;
	}

	.policy p {
		line-height: 1.625;
	}

	.policy {
		display: grid;
		gap: var(--space-lg);
		border: 1px solid color-mix(in oklab, var(--border) 25%, transparent);
		background: var(--surface);
		padding: var(--space-lg);
	}

	h2 {
		margin-bottom: 0.5rem;
		color: var(--text);
		font-family: var(--font-family-ibm);
		font-size: var(--font-size-lg);
		line-height: 1.75rem;
	}

	.policy a {
		color: var(--neon);
		transition: color var(--duration) var(--ease);
	}

	@media (hover: hover) {
		.policy a:hover {
			color: var(--accent);
		}
	}

	@media (min-width: 40rem) {
		.privacy {
			padding-inline: var(--space-lg);
		}

		.policy {
			padding: var(--space-xl);
		}
	}
</style>
