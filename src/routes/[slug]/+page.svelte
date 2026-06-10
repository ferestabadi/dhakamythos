<script lang="ts">
	import LqipImage from '$lib/components/LqipImage.svelte';
	import Prose from '$lib/components/Prose.svelte';
	import VideoChrome from '$lib/components/VideoChrome.svelte';
	import { reveal } from '$lib/reveal';

	let { data } = $props();
	const work = $derived(data.work);
	const next = $derived(data.next);
	const words = $derived(work.title.split(' '));

	/* The grammar staggers per LINE; lines only exist after layout. Words
	   carry a half-step fallback for the no-JS/hard-load render, and this
	   re-groups them by measured line when the title mounts fresh (the
	   container-transform arrival). A title already animating keeps the
	   word approximation rather than re-timing mid-flight. */
	function staggerByLine(h1: HTMLElement) {
		const animating = h1
			.getAnimations({ subtree: true })
			.some((a) => typeof a.currentTime === 'number' && a.currentTime > 50);
		if (animating) return;
		let line = -1;
		let lastTop = -Infinity;
		for (const w of h1.querySelectorAll<HTMLElement>('.wi')) {
			const top = (w.parentElement as HTMLElement).offsetTop;
			if (top > lastTop) {
				line++;
				lastTop = top;
			}
			w.style.setProperty('--line', String(line));
		}
	}
</script>

<svelte:head>
	<title>{work.title} — DHAKAMYTHOS</title>
	<meta name="description" content={work.standfirst} />
</svelte:head>

<article class="case">
	<header class="head">
		<p class="eyebrow type-meta">{work.year} · {work.tags.join(' / ')}</p>
		<h1 class="type-display" use:staggerByLine>
			{#each words as word, i (i)}<span class="w"
					><span class="wi" style="--d: {i}">{word}</span></span
				>{#if i < words.length - 1}{' '}{/if}{/each}
		</h1>
		<p class="standfirst type-body">{work.standfirst}</p>
	</header>

	<div class="hero">
		{#if work.hero.kind === 'embed'}
			<VideoChrome embedUrl={work.hero.embedUrl} poster={work.hero.poster} title={work.title} />
		{:else}
			<LqipImage img={work.cover} role="hero" eager priority vtName="work-{work.slug}" />
		{/if}
	</div>

	{#if work.gallery.length}
		<div class="gallery">
			{#each work.gallery as image, i (i)}
				<figure use:reveal>
					<LqipImage img={image} role="hero" />
					{#if image.caption}
						<figcaption class="type-meta">{image.caption}</figcaption>
					{/if}
				</figure>
			{/each}
		</div>
	{/if}

	{#if work.body.length}
		<div class="body" use:reveal>
			<Prose blocks={work.body} />
		</div>
	{/if}

	{#if work.credits.length}
		<dl class="credits" use:reveal>
			{#each work.credits as credit (credit.role)}
				<div class="credit type-meta">
					<dt>{credit.role}</dt>
					<dd>{credit.names.join(', ')}</dd>
				</div>
			{/each}
		</dl>
	{/if}

	<a class="next" href="/{next.slug}" data-cursor="Next">
		<span class="type-meta next-eyebrow">Next work</span>
		<span class="type-title next-title">{next.title}</span>
	</a>
</article>

<style>
	.case {
		padding: 0 var(--gutter);
	}

	.head {
		max-width: 68ch;
	}

	.eyebrow {
		color: var(--muted);
		margin: 0 0 var(--space-4);
	}

	h1 {
		margin: 0;
	}

	/* arrival: per-word rise inside clipped lines (CSS-only, runs without JS;
	   reduced motion collapses it via the global override) */
	.w {
		display: inline-block;
		overflow: hidden;
		vertical-align: bottom;
	}

	.wi {
		display: inline-block;
		transform: translateY(110%);
		animation: rise var(--dur-base) var(--ease-out) forwards;
		/* one --stagger per measured line; the word-index half-step is the
		   pre-measurement fallback */
		animation-delay: calc(var(--line, calc(var(--d) / 2)) * var(--stagger));
	}

	@keyframes rise {
		to {
			transform: translateY(0);
		}
	}

	.standfirst {
		margin: var(--space-5) 0 0;
		max-width: 68ch;
	}

	.hero {
		margin: var(--space-7) calc(-1 * var(--gutter)) 0;
	}

	.gallery {
		display: grid;
		gap: var(--space-6);
		margin: var(--space-8) calc(-1 * var(--gutter)) 0;
	}

	.gallery figure {
		margin: 0;
	}

	.gallery figcaption {
		color: var(--muted);
		margin: var(--space-2) var(--gutter) 0;
	}

	@media (min-width: 1024px) {
		.gallery {
			margin-left: 0;
			margin-right: 0;
		}

		.gallery figcaption {
			margin-left: 0;
			margin-right: 0;
		}

		/* alternating widths against the page edge */
		.gallery figure:nth-child(odd) {
			width: 58%;
			margin-right: auto;
		}

		.gallery figure:nth-child(even) {
			width: 72%;
			margin-left: auto;
		}
	}

	.body {
		margin-top: var(--space-8);
	}

	.credits {
		margin: var(--space-9) 0 0;
		max-width: 48ch;
	}

	.credit {
		display: flex;
		justify-content: space-between;
		gap: var(--space-5);
		padding: var(--space-3) 0;
		border-bottom: 1px solid var(--line);
	}

	.credit dt {
		color: var(--muted);
	}

	.credit dd {
		margin: 0;
		text-align: right;
	}

	.next {
		display: block;
		margin: var(--space-9) calc(-1 * var(--gutter)) 0;
		padding: var(--space-6) var(--gutter);
		border-top: 1px solid var(--line);
		color: var(--ink);
		text-decoration: none;
	}

	.next-eyebrow {
		display: block;
		color: var(--muted);
	}

	.next-title {
		display: inline-block;
		margin-top: var(--space-2);
		transition: transform var(--dur-fast) var(--ease-out);
	}

	.next:hover .next-title {
		transform: translateX(8px);
	}
</style>
