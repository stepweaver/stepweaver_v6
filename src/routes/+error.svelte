<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="page-wrap">
	<p class="page-kicker">// UNAVAILABLE</p>
	<h1 class="page-title">This page is not available.</h1>
	<p>{page.error?.message ?? 'This page is not available.'}</p>
	<p><a href="/">Back to the home page</a></p>
</div>
