<script lang="ts">
	import TerminalPage from '$lib/components/terminal/TerminalPage.svelte';

	let { data } = $props();
</script>

<TerminalPage library={{ status: data.status, posts: data.posts }} />
