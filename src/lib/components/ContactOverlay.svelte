<script lang="ts">
	import { contactOverlay } from '$lib/contact-overlay.svelte';

	// Placeholder contact details until siteSettings content is wired in M3.
	let {
		email = 'hello@dhakamythos.com',
		instagram = 'https://instagram.com/dhakamythos',
		cityLine = 'Dhaka, Bangladesh'
	}: { email?: string; instagram?: string; cityLine?: string } = $props();

	/* Native <dialog> supplies the accessibility floor for free: focus trap,
	   Esc to close, inert background, focus restored to the trigger. */
	let dialog: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (contactOverlay.isOpen) dialog?.showModal();
		else dialog?.close();
	});
</script>

<dialog
	bind:this={dialog}
	class="contact"
	aria-label="Contact"
	onclose={contactOverlay.close}
	onclick={(event) => {
		if (event.target === dialog) contactOverlay.close();
	}}
>
	<div class="inner">
		<button class="close text-button type-meta" onclick={contactOverlay.close}>Close</button>
		<p class="eyebrow type-meta">Contact</p>
		<a class="email type-title" href="mailto:{email}">{email}</a>
		<div class="rows type-meta">
			<a href={instagram} rel="noopener">Instagram</a>
			<p class="city">{cityLine}</p>
		</div>
	</div>
</dialog>

<style>
	.contact {
		position: fixed;
		inset: 0;
		width: 100%;
		height: 100%;
		max-width: none;
		max-height: none;
		margin: 0;
		border: 0;
		padding: 0;
		background: var(--overlay);
		color: var(--ground);
		transform: translateY(100%);
		transition:
			transform var(--dur-base) var(--ease-inout),
			display var(--dur-base) allow-discrete,
			overlay var(--dur-base) allow-discrete;
	}

	.contact[open] {
		transform: none;
	}

	@starting-style {
		.contact[open] {
			transform: translateY(100%);
		}
	}

	.contact::backdrop {
		background: transparent;
	}

	.inner {
		display: grid;
		align-content: center;
		justify-items: start;
		gap: var(--space-6);
		min-height: 100%;
		padding: var(--gutter);
	}

	.eyebrow {
		color: var(--muted);
		margin: 0;
	}

	.email {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		color: inherit;
		text-decoration: none;
		overflow-wrap: anywhere;
	}

	.email:hover {
		text-decoration: underline;
	}

	.rows {
		display: grid;
		gap: var(--space-3);
	}

	.rows a {
		color: inherit;
		display: inline-flex;
		align-items: center;
		min-height: 44px;
	}

	.rows a:hover {
		text-decoration: underline;
	}

	.city {
		color: var(--muted);
		margin: 0;
	}

	.close {
		position: absolute;
		top: var(--space-3);
		right: var(--gutter);
	}

	/* the ink focus outline vanishes on the dark scrim */
	.contact :focus-visible {
		outline-color: var(--ground);
	}
</style>
