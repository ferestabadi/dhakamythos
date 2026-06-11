<script lang="ts">
	import { page } from '$app/state';
	import { appState } from '$lib/app-state.svelte';

	// Placeholder contact details until siteSettings content is wired in M3.
	let {
		email = 'hello@dhakamythos.com',
		instagram = 'https://instagram.com/dhakamythos',
		cityLine = 'Dhaka, Bangladesh'
	}: { email?: string; instagram?: string; cityLine?: string } = $props();

	const year = new Date().getFullYear();

	/* Native <dialog> supplies the accessibility floor for free: focus trap,
	   Esc to close, inert background, focus restored to the trigger. */
	let dialog: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (appState.contactOpen) dialog?.showModal();
		else dialog?.close();
	});

	// any route change closes the overlay (grammar §6.4)
	$effect(() => {
		void page.url.pathname;
		appState.contactOpen = false;
	});

	const close = () => (appState.contactOpen = false);
</script>

<dialog
	bind:this={dialog}
	class="contact"
	aria-label="Contact"
	onclose={close}
	onclick={(event) => {
		const target = event.target as HTMLElement;
		if (target === dialog || 'scrim' in target.dataset) close();
	}}
>
	<div class="scrim" data-scrim></div>

	<ul class="pills">
		<li class="item" style="--i: 0">
			<a class="button type-button" href="mailto:{email}">
				<span class="hit" aria-hidden="true"></span>
				<span class="label">{email}</span>
			</a>
		</li>
		<li class="item" style="--i: 1">
			<a class="button button--pill type-button" href={instagram} rel="noopener">
				<span class="hit" aria-hidden="true"></span>
				<span class="label">Instagram</span>
			</a>
		</li>
		<li class="item city" style="--i: 2">
			<span class="button button--pill type-button"><span class="label">{cityLine}</span></span>
		</li>
	</ul>

	<nav class="legal type-base" aria-label="Legal">
		<a class="item link" style="--i: 3" href="/legal/privacy"><span class="rest">Privacy</span></a>
		<a class="item link" style="--i: 4" href={instagram} rel="noopener">
			<span class="rest">Instagram</span>
		</a>
		<p class="item colophon" style="--i: 5">
			<span class="rest">Dhakamythos · {cityLine} · {year}</span>
		</p>
	</nav>

	<!-- pixel-free close affordance for keyboard users; Esc and the scrim
	     close for everyone else -->
	<button class="close type-base" onclick={close}>Close</button>
</dialog>

<style>
	.contact {
		/* close beat, legal gap, pill padding (grammar §6.4) — values absent
		   from the global token set */
		--dur-out: 250ms;
		--gap-legal: 12px;
		--pill-pad: 14px 16px;
		position: fixed;
		inset: 0;
		width: 100%;
		height: 100%;
		max-width: none;
		max-height: none;
		margin: 0;
		border: 0;
		padding: 0;
		background: none;
		color: var(--ink);
		/* hold display/top-layer until the slowest exit (the scrim) settles */
		transition:
			display var(--dur-beat) allow-discrete,
			overlay var(--dur-beat) allow-discrete;
	}

	.contact::backdrop {
		background: transparent;
	}

	/* frosted sheet: blur is constant, only opacity ever animates */
	.scrim {
		position: absolute;
		inset: 0;
		z-index: var(--z-scrim);
		background: var(--sheet);
		-webkit-backdrop-filter: blur(var(--blur-sheet));
		backdrop-filter: blur(var(--blur-sheet));
		opacity: 0;
		transition: opacity var(--dur-beat) var(--ease-quad-inout);
	}

	@media (min-width: 768px) {
		.scrim {
			-webkit-backdrop-filter: blur(var(--blur-sheet-md));
			backdrop-filter: blur(var(--blur-sheet-md));
		}
	}

	.contact[open] .scrim {
		opacity: 1;
	}

	/* items: open = beat-long fade with route stagger; close = quick
	   collective fade, no stagger (grammar §6.4) */
	.item {
		opacity: 0;
		transition: opacity var(--dur-out) var(--ease-quad-inout);
	}

	.contact[open] .item {
		opacity: 1;
		transition: opacity var(--dur-beat) var(--ease-quad-inout)
			calc(var(--i) * var(--stagger-route));
	}

	@starting-style {
		.contact[open] .scrim,
		.contact[open] .item {
			opacity: 0;
		}
	}

	/* pills dead-center ≥640px; below, the row sits low in the sheet */
	.pills {
		position: absolute;
		inset: 0;
		z-index: var(--z-contact);
		margin: 0;
		padding: 0;
		padding-top: 75vh;
		padding-top: 75svh;
		list-style: none;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		gap: var(--gap-cell);
		pointer-events: none;
	}

	@media (min-width: 640px) {
		.pills {
			align-items: center;
			padding-top: 0;
		}
	}

	.pills .button {
		position: relative;
		display: inline-flex;
		padding: var(--pill-pad);
		color: inherit;
		text-decoration: none;
		pointer-events: auto;
	}

	/* invisible outset lifts the 39px pill to the 44px hit floor */
	.hit {
		position: absolute;
		inset: -3px;
	}

	/* optical centering (grammar §6.4) */
	.pills .label {
		display: inline-block;
		transform: translateY(1.5px);
	}

	.city {
		display: none;
	}

	@media (min-width: 640px) {
		.city {
			display: block;
		}
	}

	/* bottom-left legal nav — footer duties live here (gap W2-11) */
	.legal {
		position: absolute;
		left: var(--axis-x);
		bottom: var(--legal-bottom);
		z-index: var(--z-contact);
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--gap-legal);
	}

	.legal .link {
		color: inherit;
		text-decoration: none;
		/* invisible hit-area padding to the 44px floor */
		padding-block: 16px;
		margin-block: -16px;
	}

	.colophon {
		margin: 0;
	}

	/* labels idle at rest opacity; links hit 1 on hover */
	.rest {
		opacity: var(--alpha-rest);
		transition: opacity var(--dur-label) var(--ease-out-cubic);
	}

	@media (hover: hover) {
		.link:hover .rest {
			opacity: var(--alpha-active);
		}
	}

	/* invisible until keyboard focus reaches it (skip-link idiom) */
	.close {
		position: absolute;
		top: var(--axis-x);
		right: var(--axis-x);
		z-index: var(--z-contact);
		border: 0;
		background: none;
		padding: var(--axis-x);
		color: inherit;
		font: inherit;
		letter-spacing: inherit;
		text-transform: inherit;
		opacity: 0;
		pointer-events: none;
	}

	.close:focus-visible {
		opacity: 1;
		pointer-events: auto;
	}
</style>
