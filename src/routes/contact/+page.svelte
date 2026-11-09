<script lang="ts">
	import { page } from '$app/state';
	import { CONTACT } from '#lib/data/identity.ts';

	const intent = $derived(page.url.searchParams.get('intent'));
	const known = $derived(intent === 'consult' || intent === 'hire' || intent === 'general');
</script>

<svelte:head>
	<title>Contact | λstepweaver</title>
	<meta
		name="description"
		content={`Email ${CONTACT.email}. The contact form is not connected in this build.`}
	/>
</svelte:head>

<div class="page-wrap">
	<p class="page-kicker">// CONTACT</p>
	<h1 class="page-title">Let's talk about the system.</h1>
	{#if known}
		<p class="meta">Intent: {intent}</p>
	{/if}
	<div class="panel">
		<p>
			The production site accepts consult, hire, and general messages through a validated form with
			Turnstile and rate limits. None of that is implemented here. This page does not submit
			anywhere.
		</p>
		<p>
			Email <a href="mailto:{CONTACT.email}">{CONTACT.email}</a>
			{#if known}
				and include “{intent}” in the subject so the thread is clear.
			{/if}
		</p>
		<ul class="status-list">
			<li>No form action, no mailer, and no captcha.</li>
			<li>Nothing typed into this site is stored, because there is no form.</li>
			<li>
				The production form remains at <a href="https://stepweaver.dev/contact"
					>stepweaver.dev/contact</a
				>.
			</li>
		</ul>
	</div>
</div>
