<script lang="ts">
	import StatusPage from '$lib/components/site/StatusPage.svelte';
</script>

<StatusPage
	kicker="// TERMINAL"
	title="The terminal is not available here."
	body="This route is a status page. It does not accept commands, store history, or open a chat."
	points={[
		'Command parsing, résumé output, Codex, weather, dice, blackjack, and Zork are not ported.',
		'The shared λlambda chat is not ported.',
		'The working terminal remains at stepweaver.dev/terminal.'
	]}
/>
