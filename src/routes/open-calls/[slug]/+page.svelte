<script lang="ts">
	import Prose from '$lib/components/Prose.svelte';
	import ClosingBand from '$lib/components/ClosingBand.svelte';
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

<!-- single fade on mount, like a legal page (grammar §5.4) -->
<article class="sheet route-sheet" use:reveal>
	<div class="column axis-x">
		<header class="head">
			<p class="eyebrow type-base">{eyebrow}</p>
			<h1 class="type-list">{call.title}</h1>
		</header>

		{#if call.brief.length}
			<div class="brief prose-case type-base">
				<Prose blocks={call.brief} />
			</div>
		{/if}

		{#if call.status === 'open' && call.submissionUrl}
			<div class="submit">
				{#if embedSrc}
					<div class="form button" use:mountNear>
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
					<a class="form-link type-base" href={call.submissionUrl} target="_blank" rel="noopener">
						Open the form in a new tab
					</a>
				{:else}
					<a class="form-link type-base" href={call.submissionUrl} target="_blank" rel="noopener">
						Submit to this call
					</a>
				{/if}
			</div>
		{:else if call.status === 'closed' && call.results.length}
			<section class="results block type-list">
				<h2 class="label">Results</h2>
				<ul class="values">
					{#each call.results as result (result.slug)}
						<li><a class="result" href="/{result.slug}">{result.title}</a></li>
					{/each}
				</ul>
			</section>
		{/if}
	</div>

	<ClosingBand />
</article>

<style>
	.sheet {
		--stack-gap: 1.25rem; /* 20px stack rhythm */
		--measure: 27rem; /* 432px text column */
		--label-gutter: 7.75rem; /* collapsed-label column — value x shared with /collective */
		--hit-pad: 0.3125rem; /* widens link targets without disturbing the line rhythm */
		padding-bottom: 12.5vh;
		padding-bottom: 12.5svh;
	}

	.column {
		display: flex;
		flex-direction: column;
		gap: var(--stack-gap);
		max-width: var(--measure);
	}

	.head {
		display: flex;
		flex-direction: column;
		gap: var(--gap-cell);
	}

	.eyebrow {
		margin: 0;
		opacity: var(--alpha-rest);
	}

	h1 {
		margin: 0;
	}

	/* +20px on top of the stack gap → 40px from the head to the brief */
	.brief {
		margin-top: var(--stack-gap);
	}

	.brief :global(.prose) {
		font-size: inherit;
		line-height: inherit;
		max-width: none;
	}

	.submit {
		margin-top: var(--stack-gap);
	}

	/* placeholder reserves the iframe's exact box ahead of mount (CLS rule);
	   the .button recipe draws its frosted frame — no hard border */
	.form {
		min-height: 600px;
	}

	iframe {
		display: block;
		border: 0;
		border-radius: inherit;
	}

	.form-link {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		margin-top: var(--gap-cell);
		color: inherit;
		text-decoration: none;
		opacity: var(--alpha-rest);
		transition: opacity var(--dur-label) var(--ease-out-cubic);
	}

	@media (hover: hover) {
		.form-link:hover {
			opacity: var(--alpha-active);
		}
	}

	/* result link rows: no borders — label .3, values 1 (gap W3-11) */
	.block {
		display: flex;
		gap: var(--label-gutter);
		margin-top: var(--stack-gap);
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

	.result {
		display: inline-block;
		color: inherit;
		text-decoration: none;
		padding-block: var(--hit-pad);
		margin-block: calc(-1 * var(--hit-pad));
	}
</style>
