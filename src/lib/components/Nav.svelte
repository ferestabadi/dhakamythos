<script lang="ts">
	import { page } from '$app/state';
	import { appState } from '$lib/app-state.svelte';

	const links = [
		{ href: '/works', label: 'Work' },
		{ href: '/archive', label: 'Archive' },
		{ href: '/collective', label: 'Collective' },
		{ href: '/open-calls', label: 'Open calls' }
	];

	const path = $derived(page.url.pathname.replace(/\/$/, ''));

	/* The brand cell carries the current section word ≥768px (grammar §5.0);
	   home reads Work — the deck is the work section, as the original's home
	   reads its own catalogue word. Root-level dynamic routes are case
	   pages, so unmatched paths also read Work. */
	const sectionWord = $derived(
		links.find((l) => path === l.href || path.startsWith(l.href + '/'))?.label ??
			(path.startsWith('/legal') ? 'Legal' : 'Work')
	);

	/* Prerendered markup ships visible so the nav survives no-JS; after
	   hydration the header obeys the intro and contact choreography
	   (gaps W3-10, W3-05): in only once appState.ready, out while the
	   contact overlay is open. */
	let hydrated = $state(false);
	$effect(() => {
		hydrated = true;
	});
	const shown = $derived(!hydrated || (appState.ready && !appState.contactOpen));
</script>

<header class="nav type-button" class:shown class:inverse={appState.theme === 'inverse'}>
	<nav aria-label="Primary">
		<ul>
			<li class="brand">
				<a
					class="button cell"
					href="/"
					class:active={path === ''}
					aria-current={path === '' ? 'page' : undefined}
				>
					<span>Dhakamythos<small class="mark">®</small></span>
					{#if sectionWord}<span class="section">{sectionWord}</span>{/if}
				</a>
			</li>
			{#each links as { href, label } (href)}
				<li>
					<a
						class="button cell"
						{href}
						class:active={path === href}
						aria-current={path === href ? 'page' : undefined}
					>
						<span>{label}</span>
					</a>
				</li>
			{/each}
			<li>
				<button class="button cell" onclick={() => (appState.contactOpen = true)}>
					<span>Contact</span>
				</button>
			</li>
		</ul>
	</nav>
</header>

<style>
	.nav {
		/* cell anatomy (grammar §5.0) — measures absent from the global set */
		--cell-h: 58px;
		--cell-pad: 40px 10px 7px;
		--brand-w: 200px;
		--nav-cap: 36.25rem; /* 580px */
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		z-index: var(--z-header);
		padding: var(--frame);
		pointer-events: none;
		color: var(--ink);
		user-select: none;
		-webkit-user-select: none;
		backface-visibility: hidden;
		opacity: 0;
		/* show/hide rides the beat; the color tween is the spec's ONE
		   permitted color transition — the theme flip over dark media
		   (grammar §2.1) */
		transition:
			opacity var(--dur-beat) var(--ease-quad-inout),
			color var(--dur-label) var(--ease-quad-inout);
	}

	.nav.shown {
		opacity: 1;
	}

	.nav.inverse {
		color: var(--ink-inverse);
	}

	/* a hidden header must not catch clicks above the contact overlay */
	.nav:not(.shown) :is(a, button) {
		pointer-events: none;
	}

	nav {
		width: 100%;
	}

	@media (min-width: 640px) {
		nav {
			max-width: var(--nav-cap);
		}
	}

	/* base: equal-width cells filling the row minus the frame, wrapping to a
	   second row of three (six destinations — our IA) */
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--gap-cell);
	}

	@media (min-width: 640px) {
		ul {
			display: flex;
			flex-wrap: wrap;
		}

		/* zero basis — link cells divide the row evenly (the original's even
		   cell rhythm) instead of hugging their label widths */
		li {
			flex: 1 1 0;
			min-width: 0;
		}

		.brand {
			flex: 1 1 25%;
		}
	}

	@media (min-width: 768px) {
		.brand {
			flex: 0 0 var(--brand-w);
		}
	}

	/* label sits bottom-left of each frosted cell */
	.cell {
		display: flex;
		align-items: flex-end;
		justify-content: flex-start;
		width: 100%;
		height: var(--cell-h);
		padding: var(--cell-pad);
		border: 0;
		background: none;
		color: inherit;
		font: inherit;
		letter-spacing: inherit;
		text-transform: inherit;
		text-align: left;
		text-decoration: none;
		cursor: pointer;
		pointer-events: all;
		white-space: nowrap;
	}

	/* wordmark ® and section word read as one adjacent bottom-left cluster
	   (§5.0 "UNVEIL ® PROJECTS"), never pushed to opposite cell edges */
	.brand .cell {
		gap: 0.35em;
	}

	/* ® at preflight 80%, optically lifted (grammar §2.2) */
	.mark {
		position: relative;
		top: -0.5px;
	}

	.section {
		display: none;
	}

	@media (min-width: 768px) {
		.section {
			display: inline;
		}
	}
</style>
