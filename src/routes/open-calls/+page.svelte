<script lang="ts">
	import ClosingBand from '$lib/components/ClosingBand.svelte';
	import { reveal } from '$lib/reveal';

	let { data } = $props();
	const calls = $derived(data.calls);

	const deadlineFormat = new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});

	/* mirrors --stagger-rows (50ms) — reveal() takes plain ms */
	const STEP = 50;
</script>

<svelte:head>
	<title>Open calls — DHAKAMYTHOS</title>
	<meta name="description" content="Calls for collaboration — submit your work." />
</svelte:head>

<div class="sheet route-sheet">
	<div class="axis-x">
		<h1 class="visually-hidden">Open calls</h1>

		{#if calls.length}
			<ul class="calls">
				{#each calls as call, i (call.slug)}
					<li use:reveal={{ delay: i * STEP }}>
						<a class="row" href="/open-calls/{call.slug}">
							<span class="pill button button--pill" class:active={call.status === 'open'}>
								<span class="pill-label type-button">
									{call.status === 'open' ? 'Open' : 'Closed'}
								</span>
							</span>
							<span class="title type-list">{call.title}</span>
							<span class="summary prose-case type-base">{call.summary}</span>
							{#if call.status === 'open' && call.deadline}
								<span class="deadline type-base">
									Open until {deadlineFormat.format(new Date(call.deadline))}
								</span>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="empty type-base">No calls open right now</p>
		{/if}
	</div>

	<ClosingBand />
</div>

<style>
	.sheet {
		--stack-gap: 1.25rem; /* 20px rhythm inside a call row */
		--call-gap: 2.5rem; /* 40px between calls — rhythm separates, not dividers */
		--measure: 27rem; /* 432px text column */
		--pill-pad-x: 1rem; /* 16px pill label inset (grammar §2.3) */
		--pill-pad-y: 0.875rem; /* 14px pill label inset */
		padding-bottom: 12.5vh;
		padding-bottom: 12.5svh;
	}

	.calls {
		list-style: none;
		margin: 0;
		padding: 0;
		max-width: var(--measure);
	}

	.calls li + li {
		margin-top: var(--call-gap);
	}

	.row {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: calc(var(--stack-gap) / 2);
		color: inherit;
		text-decoration: none;
	}

	.pill {
		display: inline-flex;
		align-items: center;
		padding: var(--pill-pad-y) var(--pill-pad-x);
	}

	.pill-label {
		transform: translateY(1.5px); /* optical pill centering (grammar §2.3) */
	}

	/* the title speaks the label language: rest .3, whole-row hover lifts it */
	.title {
		opacity: var(--alpha-rest);
		transition: opacity var(--dur-label) var(--ease-out-cubic);
	}

	@media (hover: hover) {
		.row:hover .title,
		.row:hover .pill span {
			opacity: var(--alpha-active);
		}
	}

	.deadline {
		opacity: var(--alpha-rest);
	}

	.empty {
		opacity: var(--alpha-rest);
	}
</style>
