<script lang="ts">
	import ClosingBand from '$lib/components/ClosingBand.svelte';
	import LqipImage from '$lib/components/LqipImage.svelte';
	import Prose from '$lib/components/Prose.svelte';
	import { reveal } from '$lib/reveal';

	let { data } = $props();

	/* mirrors --stagger-route (150ms) — reveal() takes plain ms */
	const STEP = 150;
</script>

<svelte:head>
	<title>Collective — DHAKAMYTHOS</title>
	<meta name="description" content="Who dhakamythos is and what it makes." />
</svelte:head>

<div class="sheet route-sheet">
	<h1 class="visually-hidden">Collective</h1>

	<!-- studio anatomy (grammar §5.2): square artwork pinned top-right at
	     exactly 50vh, desktop only; it never scrolls with the column -->
	{#if data.artwork}
		<figure class="artwork" use:reveal={{ delay: STEP * 5 }}>
			<LqipImage img={data.artwork} role="card" fill />
		</figure>
	{/if}

	<div class="column axis-x">
		{#if data.manifesto.length}
			<div class="mission prose-case type-base" use:reveal>
				<Prose blocks={data.manifesto} />
			</div>
		{/if}

		<section class="block type-list" use:reveal={{ delay: STEP }}>
			<h2 class="label">Members</h2>
			<ul class="values">
				{#each data.members as member (member.name)}
					<li>
						{#if member.link}
							<a class="line-link" href={member.link} target="_blank" rel="noopener noreferrer"
								>{member.name}</a
							>
						{:else}
							{member.name}
						{/if}
						{#if member.role}<span class="role">&nbsp;— {member.role}</span>{/if}
					</li>
				{/each}
			</ul>
		</section>

		<section class="block type-list" use:reveal={{ delay: STEP * 2 }}>
			<h2 class="label">Calls</h2>
			<ul class="values">
				<li><a class="line-link rest" href="/open-calls">Submit to an open call</a></li>
			</ul>
		</section>

		{#if data.press.length}
			<section class="block type-list" use:reveal={{ delay: STEP * 3 }}>
				<h2 class="label">Press</h2>
				<ul class="values">
					{#each data.press as item (item.url)}
						<li>
							<a class="line-link rest" href={item.url} target="_blank" rel="noopener noreferrer"
								>{item.label}</a
							>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	</div>

	<!-- below 640 the page ends in the same artwork, full-bleed and flush -->
	{#if data.artwork}
		<figure class="figure-mobile" use:reveal={{ delay: STEP * 4 }}>
			<LqipImage img={data.artwork} role="card" />
		</figure>
	{/if}

	<ClosingBand />
</div>

<style>
	.sheet {
		/* grammar §5.2 measures, local to this anatomy */
		--stack-gap: 1.25rem; /* 20px studio stack rhythm */
		--measure: 27rem; /* 432px text column */
		--label-gutter: 7.75rem; /* clears the longest collapsed label so all value columns share one x */
		--figure-gap: 3.5rem; /* 56px mobile figure offset */
		--hit-pad: 0.3125rem; /* widens link targets without disturbing the 1.25 rhythm */
	}

	@media (min-width: 640px) {
		.sheet {
			padding-bottom: 12.5vh;
			padding-bottom: 12.5svh;
		}
	}

	.column {
		display: flex;
		flex-direction: column;
		gap: var(--stack-gap);
		max-width: var(--measure);
	}

	/* +20px on top of the stack gap → 40px from mission to the first list */
	.mission {
		margin-bottom: var(--stack-gap);
	}

	/* the column owns the measure and the type role; Prose only provides
	   markup here (its own metrics are superseded from outside) */
	.mission :global(.prose) {
		font-size: inherit;
		line-height: inherit;
		max-width: none;
	}

	/* label-collapsed list (grammar §4): the label sits in a 2px column so
	   every value column starts at the same x regardless of label length */
	.block {
		display: flex;
		gap: var(--label-gutter);
	}

	.label {
		flex: 0 0 var(--gap-cell);
		white-space: nowrap;
		opacity: var(--alpha-rest);
		margin: 0;
	}

	.values {
		list-style: none;
		margin: 0;
		padding: 0;
		min-width: 0;
	}

	.line-link {
		display: inline-block;
		color: inherit;
		text-decoration: none;
		padding-block: var(--hit-pad);
		margin-block: calc(-1 * var(--hit-pad));
	}

	/* navigational lines speak the label language: rest .3, hover/active 1 */
	.rest,
	.role {
		opacity: var(--alpha-rest);
		transition: opacity var(--dur-label) var(--ease-out-cubic);
	}

	@media (hover: hover) {
		.rest:hover {
			opacity: var(--alpha-active);
		}

		/* a hovered member line lights its role line up with it */
		li:hover .role {
			opacity: var(--alpha-active);
		}
	}

	.artwork {
		display: none;
		margin: 0;
	}

	@media (min-width: 1024px) {
		.artwork {
			display: block;
			position: fixed;
			top: 0;
			right: 0;
			height: 50vh;
			height: 50svh;
			aspect-ratio: 1;
			z-index: var(--z-accent);
		}
	}

	.figure-mobile {
		margin: var(--figure-gap) 0 0; /* flush left/right/bottom — the page ends here */
	}

	@media (min-width: 640px) {
		.figure-mobile {
			display: none;
		}
	}
</style>
