<script lang="ts">
	import { contactOverlay } from '$lib/contact-overlay.svelte';

	// Placeholder contact details until siteSettings content is wired in M3.
	let {
		email = 'hello@dhakamythos.com',
		instagram = 'https://instagram.com/dhakamythos',
		cityLine = 'Dhaka, Bangladesh'
	}: { email?: string; instagram?: string; cityLine?: string } = $props();

	const year = new Date().getFullYear();
</script>

<footer class="footer">
	<div class="reach">
		<p class="eyebrow type-meta">Get in touch</p>
		<a class="email type-title" href="mailto:{email}">{email}</a>
	</div>

	<nav class="rows" aria-label="Footer">
		<button class="text-button type-meta" onclick={contactOverlay.open}>Contact</button>
		<a class="text-button type-meta" href={instagram} rel="noopener">Instagram</a>
	</nav>

	<p class="colophon type-meta">Dhakamythos · {cityLine} · {year}</p>
</footer>

<style>
	.footer {
		border-top: 1px solid var(--line);
		margin-top: var(--space-9);
		padding: var(--space-8) var(--gutter) var(--space-7);
		display: grid;
		gap: var(--space-7);
	}

	.eyebrow {
		color: var(--muted);
		margin: 0 0 var(--space-3);
	}

	.email {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		color: var(--ink);
		text-decoration: none;
		overflow-wrap: anywhere;
	}

	.email:hover {
		text-decoration: underline;
	}

	.rows {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-5);
		color: var(--ink);
	}

	.rows a:hover {
		text-decoration: underline;
	}

	.colophon {
		color: var(--muted);
		margin: 0;
	}
</style>
