<script lang="ts">
	import { CONTACT } from '#lib/data/identity.ts';
	const year = new Date().getFullYear();
</script>

<footer class="site-footer">
	<div class="site-footer-inner">
		<div>λstepweaver © {year}</div>
		<nav aria-label="Footer">
			<a href={CONTACT.github}>GitHub</a>
			<a href="/about">About</a>
			<a href="/contact">Contact</a>
			<a href="/privacy">Privacy</a>
			<a href="/work">Work</a>
		</nav>
	</div>
</footer>

<style>
	nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.9rem;
	}
</style>
