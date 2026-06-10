<script lang="ts">
	import { page } from '$app/state';
	import { contactOverlay } from '$lib/contact-overlay.svelte';

	const links = [
		{ href: '/index', label: 'Index' },
		{ href: '/archive', label: 'Archive' },
		{ href: '/collective', label: 'Collective' },
		{ href: '/open-calls', label: 'Open calls' }
	];

	/* Mobile: wordmark + Contact persistent, the rest behind a full-screen
	   menu (native <dialog> — focus trap, Esc, focus restore for free). */
	let menu: HTMLDialogElement | undefined = $state();

	function openContact() {
		menu?.close();
		contactOverlay.open();
	}
</script>

<header class="nav">
	<a href="/" class="wordmark text-button type-meta">Dhakamythos</a>

	<nav class="row" aria-label="Primary">
		{#each links as { href, label } (href)}
			<a
				class="text-button type-meta"
				{href}
				aria-current={page.url.pathname === href ? 'page' : undefined}>{label}</a
			>
		{/each}
	</nav>

	<div class="cluster">
		<button class="text-button type-meta" onclick={contactOverlay.open}>Contact</button>
		<button
			class="menu-trigger text-button type-meta"
			onclick={() => menu?.showModal()}
			aria-haspopup="dialog"
		>
			Menu
		</button>
	</div>
</header>

<dialog bind:this={menu} class="menu" aria-label="Menu">
	<button class="close text-button type-meta" onclick={() => menu?.close()}>Close</button>
	<nav aria-label="Menu">
		<ul>
			{#each links as { href, label }, i (href)}
				<li style="--i: {i}">
					<a class="text-button type-display" {href} onclick={() => menu?.close()}>{label}</a>
				</li>
			{/each}
			<li style="--i: {links.length}">
				<button class="text-button type-display" onclick={openContact}>Contact</button>
			</li>
		</ul>
	</nav>
</dialog>

<style>
	/* Floats above the page; absolute so it never sticks over the deck
	   during card scroll (docs/DESIGN.md nav rule). */
	.nav {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		z-index: var(--z-nav);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-5);
		padding: var(--space-3) var(--gutter);
		color: var(--ink);
	}

	.wordmark {
		font-weight: 700;
	}

	.row {
		display: none;
		gap: var(--space-5);
	}

	/* color shifts instantly — only transform and opacity ever animate */
	.row a {
		color: var(--muted);
	}

	.row a:hover,
	.row a[aria-current='page'] {
		color: var(--ink);
	}

	.cluster {
		display: flex;
		gap: var(--space-5);
	}

	@media (min-width: 1024px) {
		.row {
			display: flex;
		}

		.menu-trigger {
			display: none;
		}
	}

	/* full-screen menu */
	.menu {
		position: fixed;
		inset: 0;
		width: 100%;
		height: 100%;
		max-width: none;
		max-height: none;
		margin: 0;
		border: 0;
		padding: var(--space-10) var(--gutter) var(--gutter);
		background: var(--ground);
		color: var(--ink);
	}

	.menu::backdrop {
		background: transparent;
	}

	.close {
		position: absolute;
		top: var(--space-3);
		right: var(--gutter);
	}

	.menu ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--space-4);
	}

	/* staggered reveal: transform + opacity only, one delay step per row */
	.menu li {
		opacity: 0;
		transform: translateY(24px);
		transition:
			opacity var(--dur-base) var(--ease-out),
			transform var(--dur-base) var(--ease-out);
		transition-delay: calc(var(--i) * var(--stagger));
	}

	.menu[open] li {
		opacity: 1;
		transform: none;
	}

	@starting-style {
		.menu[open] li {
			opacity: 0;
			transform: translateY(24px);
		}
	}
</style>
