<script lang="ts">
	import Prose from '$lib/components/Prose.svelte';
	import { reveal } from '$lib/reveal';

	let { data } = $props();
</script>

<svelte:head>
	<title>Collective — DHAKAMYTHOS</title>
	<meta name="description" content="Who dhakamythos is and what it makes." />
</svelte:head>

<div class="page">
	<h1 class="type-display">Collective</h1>

	{#if data.manifesto.length}
		<div class="manifesto" use:reveal>
			<Prose blocks={data.manifesto} />
		</div>
	{/if}

	<section use:reveal>
		<h2 class="visually-hidden">Members</h2>
		<ul class="members">
			{#each data.members as member (member.name)}
				<li class="member">
					{#if member.link}
						<a
							class="member-name text-button type-title"
							href={member.link}
							target="_blank"
							rel="noopener">{member.name}</a
						>
					{:else}
						<span class="member-name type-title">{member.name}</span>
					{/if}
					{#if member.role}
						<span class="member-role type-meta">{member.role}</span>
					{/if}
				</li>
			{/each}
		</ul>
	</section>

	{#if data.press.length}
		<section class="press" use:reveal>
			<h2 class="eyebrow type-meta">Press</h2>
			<ul class="press-list">
				{#each data.press as item (item.url)}
					<li>
						<a class="press-link text-button type-meta" href={item.url} target="_blank" rel="noopener"
							>{item.label}</a
						>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</div>

<style>
	.page {
		padding: 0 var(--gutter) var(--space-9);
	}

	h1 {
		margin: 0;
	}

	.manifesto {
		margin-top: var(--space-7);
	}

	.members {
		list-style: none;
		margin: var(--space-9) 0 0;
		padding: 0;
		max-width: 68ch;
		border-top: 1px solid var(--line);
	}

	.member {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-5);
		padding: var(--space-3) 0;
		border-bottom: 1px solid var(--line);
	}

	/* the plain span mirrors the link's 44px box so linked and unlinked
	   rows keep one height */
	.member-name {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		color: var(--ink);
	}

	a.member-name:hover {
		text-decoration: underline;
	}

	.member-role {
		color: var(--muted);
		text-align: right;
	}

	.press {
		margin-top: var(--space-9);
	}

	.eyebrow {
		margin: 0;
		color: var(--muted);
	}

	.press-list {
		list-style: none;
		margin: var(--space-4) 0 0;
		padding: 0;
	}

	.press-link {
		color: var(--ink);
	}

	a.press-link:hover {
		text-decoration: underline;
	}
</style>
