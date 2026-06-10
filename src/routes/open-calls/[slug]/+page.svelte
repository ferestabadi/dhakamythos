<script lang="ts">
	import Prose from '$lib/components/Prose.svelte';
	import { reveal } from '$lib/reveal';

	let { data } = $props();
	const call = $derived(data.call);

	const deadlineFormat = new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});

	const eyebrow = $derived(
		call.status === 'closed'
			? 'Closed'
			: call.deadline
				? `Open until ${deadlineFormat.format(new Date(call.deadline))}`
				: 'Open'
	);

	/* Tally share links (tally.so/r/ID) have an embeddable twin at
	   tally.so/embed/ID; any other submission host gets a plain link only. */
	const embedSrc = $derived.by(() => {
		const m = call.submissionUrl?.match(/^https:\/\/tally\.so\/r\/(\w+)/);
		return m ? `https://tally.so/embed/${m[1]}?hideTitle=1` : undefined;
	});

	let formMounted = $state(false);

	/* Holds the form iframe back until its placeholder scrolls within 600px
	   (once) — the brief renders without waiting on Tally's payload. The
	   placeholder keeps the iframe's height, so mounting shifts no layout. */
	function mountNear(el: HTMLElement) {
		const io = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					formMounted = true;
					io.disconnect();
				}
			},
			{ rootMargin: '600px' }
		);
		io.observe(el);
		return { destroy: () => io.disconnect() };
	}
</script>

<svelte:head>
	<title>{call.title} — DHAKAMYTHOS</title>
	<meta name="description" content={call.summary} />
</svelte:head>

<article class="page">
	<header>
		<p class="eyebrow type-meta">{eyebrow}</p>
		<h1 class="type-display">{call.title}</h1>
	</header>

	{#if call.brief.length}
		<div class="brief" use:reveal>
			<Prose blocks={call.brief} />
		</div>
	{/if}

	{#if call.status === 'open' && call.submissionUrl}
		<div class="submit">
			{#if embedSrc}
				<div class="form" use:mountNear>
					{#if formMounted}
						<iframe
							src={embedSrc}
							title="Submission form — {call.title}"
							width="100%"
							height="600"
							loading="lazy"
						></iframe>
					{/if}
				</div>
				<a
					class="form-link text-button type-meta"
					href={call.submissionUrl}
					target="_blank"
					rel="noopener"
				>
					Open the form in a new tab
				</a>
			{:else}
				<a
					class="form-link text-button type-meta"
					href={call.submissionUrl}
					target="_blank"
					rel="noopener"
				>
					Submit to this call
				</a>
			{/if}
		</div>
	{:else if call.status === 'closed'}
		<div class="results-block" use:reveal>
			<p class="closed-note type-meta">{call.results.length ? 'Closed — results' : 'Closed'}</p>
			{#if call.results.length}
				<ul class="results">
					{#each call.results as result (result.slug)}
						<li>
							<a class="result text-button type-title" href="/{result.slug}">{result.title}</a>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}
</article>

<style>
	.page {
		padding: 0 var(--gutter) var(--space-9);
	}

	.eyebrow {
		color: var(--muted);
		margin: 0 0 var(--space-4);
	}

	h1 {
		margin: 0;
	}

	.brief {
		margin-top: var(--space-7);
	}

	.submit {
		margin-top: var(--space-8);
		max-width: 68ch;
	}

	/* placeholder reserves the iframe's exact box ahead of mount (CLS rule) */
	.form {
		min-height: 600px;
		border: 1px solid var(--line);
	}

	iframe {
		display: block;
		border: 0;
	}

	.form-link {
		margin-top: var(--space-4);
		color: var(--muted);
	}

	.results-block {
		margin-top: var(--space-8);
	}

	.closed-note {
		color: var(--muted);
	}

	.results {
		list-style: none;
		margin: var(--space-4) 0 0;
		padding: 0;
		border-top: 1px solid var(--line);
	}

	.results li {
		border-bottom: 1px solid var(--line);
	}

	.result {
		width: 100%;
		padding: var(--space-4) 0;
		color: var(--ink);
		transition: transform var(--dur-fast) var(--ease-out);
	}

	.result:hover {
		transform: translateX(8px);
	}
</style>
