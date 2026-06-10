<script lang="ts">
	import { reveal } from '$lib/reveal';

	let { data } = $props();
	const calls = $derived(data.calls);

	const deadlineFormat = new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
</script>

<svelte:head>
	<title>Open calls — DHAKAMYTHOS</title>
	<meta name="description" content="Calls for collaboration — submit your work." />
</svelte:head>

<div class="page">
	<h1 class="type-display">Open calls</h1>

	{#if calls.length}
		<ul class="calls">
			{#each calls as call (call.slug)}
				<li use:reveal>
					<a class="row" href="/open-calls/{call.slug}">
						<span class="pill type-meta" class:closed={call.status === 'closed'}>
							{call.status === 'open' ? 'Open' : 'Closed'}
						</span>
						<span class="title type-title">{call.title}</span>
						<span class="summary type-body">{call.summary}</span>
						{#if call.status === 'open' && call.deadline}
							<span class="deadline type-meta">
								Open until {deadlineFormat.format(new Date(call.deadline))}
							</span>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="empty type-meta">No calls open right now</p>
	{/if}
</div>

<style>
	.page {
		padding: 0 var(--gutter) var(--space-9);
	}

	h1 {
		margin: 0;
	}

	.calls {
		list-style: none;
		margin: var(--space-7) 0 0;
		padding: 0;
		border-top: 1px solid var(--line);
	}

	.calls li {
		border-bottom: 1px solid var(--line);
	}

	.row {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-2);
		padding: var(--space-5) 0;
		color: var(--ink);
		text-decoration: none;
	}

	.pill {
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius);
		background: var(--ink);
		color: var(--ground);
	}

	.pill.closed {
		padding: var(--space-1) 0;
		background: none;
		color: var(--muted);
	}

	.title {
		transition: transform var(--dur-fast) var(--ease-out);
	}

	.row:hover .title {
		transform: translateX(8px);
	}

	.summary {
		max-width: 68ch;
		color: var(--muted);
	}

	.deadline {
		color: var(--muted);
	}

	.empty {
		color: var(--muted);
		margin-top: var(--space-5);
	}
</style>
