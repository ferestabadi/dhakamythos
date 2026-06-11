<script lang="ts">
	import LqipImage from '$lib/components/LqipImage.svelte';
	import Prose from '$lib/components/Prose.svelte';
	import VideoChrome from '$lib/components/VideoChrome.svelte';
	import { appState } from '$lib/app-state.svelte';
	import { loadPiece, warmUpPiece } from '$lib/pieces/load';
	import { ogImageUrl } from '$lib/sanity/image';
	import { absUrl } from '$lib/site';

	let { data } = $props();
	const work = $derived(data.work);
	const next = $derived(data.next);
	const words = $derived(work.title.split(' '));

	const pieceKey = $derived(work.interactive ? work.componentKey : undefined);

	$effect(() => {
		if (pieceKey) warmUpPiece(pieceKey);
	});

	/* Arrival (grammar §5.4): backdrop + content fade in together, 500ms
	   quad-inout. Prerender ships visible; JS commits the hidden frame first,
	   so no-JS and reduced-motion render instantly. The hero is exempt by
	   construction — its view-transition-name lifts it out of ancestor
	   opacity while the card→case morph runs. */
	function sheetFade(el: HTMLElement) {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		el.style.transition = 'none';
		el.style.opacity = '0';
		void el.offsetWidth;
		el.style.transition = 'opacity var(--dur-label) var(--ease-quad-inout)';
		el.style.opacity = '1';
		const settle = (event: TransitionEvent) => {
			if (event.target !== el) return;
			el.style.removeProperty('transition');
			el.style.removeProperty('opacity');
			el.removeEventListener('transitionend', settle);
		};
		el.addEventListener('transitionend', settle);
		return {
			destroy() {
				el.removeEventListener('transitionend', settle);
			}
		};
	}

	/* Theme flip (grammar §2.1, gap W3-10): while the dark film hero sits
	   under the header band, the header inks inverse — the Nav carries the
	   500ms color tween. The observation zone is the top ~8% of the
	   viewport (the 66px header at 844-900px tall screens). */
	function inverseUnderHeader(el: HTMLElement) {
		const io = new IntersectionObserver(
			([entry]) => {
				appState.theme = entry.isIntersecting ? 'inverse' : 'ink';
			},
			{ rootMargin: '0px 0px -92% 0px', threshold: 0 }
		);
		io.observe(el);
		return {
			destroy() {
				io.disconnect();
				appState.theme = 'ink';
			}
		};
	}
</script>

<svelte:head>
	<title>{work.title} — DHAKAMYTHOS</title>
	<meta name="description" content={work.standfirst} />
	<meta property="og:title" content="{work.title} — DHAKAMYTHOS" />
	<meta property="og:description" content={work.standfirst} />
	<meta property="og:type" content="article" />
	<meta property="og:url" content={absUrl(`/${work.slug}`)} />
	<meta property="og:image" content={absUrl(ogImageUrl(work.cover))} />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<article class="case route-sheet" use:sheetFade>
	<header class="head axis-x">
		<dl class="kv meta type-base">
			<dt>Year</dt>
			<dd>{work.year}</dd>
			<dt>Medium</dt>
			<dd>{work.medium}</dd>
			{#if work.descriptors.length}
				<dt>Tags</dt>
				<dd>{work.descriptors.join(' / ')}</dd>
			{/if}
		</dl>
		<h1 class="type-display">
			<!-- keyed so sibling-project arrivals (component reuse) replay the span fades -->
			{#key work.slug}
				{#each words as word, i (i)}<span class="word" style="--i: {i}">{word}</span
					>{#if i < words.length - 1}{' '}{/if}{/each}
			{/key}
		</h1>
		<!-- the standfirst is running prose: 10.5px on the 13px line (§2.2 —
		     the 1.0762 leading belongs to display-scaled paragraphs only) -->
		<p class="standfirst type-base prose-case">{work.standfirst}</p>
	</header>

	{#if pieceKey}
		<!-- interactive works mount the piece full-bleed below the standfirst;
		     the cover keeps the morph target and acts as the no-JS fallback -->
		<div class="hero piece">
			{#await loadPiece(pieceKey)}
				<span class="cover-fallback" style:view-transition-name="work-{work.slug}">
					<LqipImage img={work.cover} role="hero" eager priority outset />
				</span>
			{:then Piece}
				{#if Piece}
					<Piece />
				{:else}
					<LqipImage img={work.cover} role="hero" eager priority outset vtName="work-{work.slug}" />
				{/if}
			{/await}
		</div>
	{:else}
		<div class="hero">
			{#if work.hero.kind === 'embed'}
				<div use:inverseUnderHeader>
					<VideoChrome embedUrl={work.hero.embedUrl} poster={work.hero.poster} title={work.title} />
				</div>
			{:else}
				<LqipImage img={work.cover} role="hero" eager priority outset vtName="work-{work.slug}" />
			{/if}
		</div>
	{/if}

	{#if work.gallery.length}
		<div class="gallery">
			{#each work.gallery as image, i (i)}
				<figure>
					<LqipImage img={image} role="hero" outset />
					{#if image.caption}
						<figcaption class="type-base">{image.caption}</figcaption>
					{/if}
				</figure>
			{/each}
		</div>
	{/if}

	{#if work.body.length}
		<div class="body axis-x">
			<Prose blocks={work.body} />
		</div>
	{/if}

	{#if work.credits.length}
		<dl class="kv credits type-list axis-x">
			{#each work.credits as credit (credit.role)}
				<dt>{credit.role}</dt>
				<dd>{credit.names.join(', ')}</dd>
			{/each}
		</dl>
	{/if}

	<!-- closing half-viewport module (§3.5) doubling as the next-work link -->
	<a class="next axis-x" href="/{next.slug}">
		<span class="type-base next-label">Next work</span>
		<span class="type-base next-title">{next.title}</span>
	</a>
</article>

<style>
	.case {
		/* grammar §2.3 rhythm steps without global tokens yet — local by rule */
		--gap-stack: 20px;
		--gap-block: 40px;
		--gap-section: 124px;
		--gap-kv: 12px;
		--measure-standfirst: 283px; /* closing/standfirst measure (§3.3) */
	}

	/* label/value rows (meta + credits): label rests, value carries (§4) */
	.kv {
		display: grid;
		grid-template-columns: max-content 1fr;
		column-gap: var(--gap-kv);
		margin: 0;
	}

	.kv dt {
		opacity: var(--alpha-rest);
	}

	.kv dd {
		margin: 0;
	}

	.meta {
		margin-bottom: var(--gap-stack);
	}

	h1 {
		margin: 0;
	}

	/* arrival: per-span fade, no transform (§4, gap W3-04) — fill backwards
	   keeps spans hidden through their delay yet visible when animation is off */
	.word {
		animation: span-fade var(--dur-label) var(--ease-out-cubic) backwards;
		animation-delay: calc(var(--i) * var(--stagger-rows)); /* small per-span step */
	}

	@keyframes span-fade {
		from {
			opacity: 0;
		}
	}

	.standfirst {
		margin: var(--gap-block) 0 0;
		max-width: var(--measure-standfirst);
	}

	.hero {
		margin: var(--gap-section) 0 0;
	}

	.gallery {
		display: grid;
		gap: var(--grid-gap);
		margin: var(--gap-section) 0 0;
	}

	.gallery figure {
		margin: 0;
	}

	.gallery figcaption {
		opacity: var(--alpha-rest);
		margin-top: var(--gap-kv);
		padding-inline: var(--axis-x);
	}

	/* alternating widths against the page edge */
	@media (min-width: 1024px) {
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
		margin-top: var(--gap-section);
	}

	.credits {
		margin-top: var(--gap-section);
	}

	.next {
		margin-top: var(--gap-section);
		min-height: 320px;
		height: 50vh;
		height: 50svh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		color: inherit;
		text-decoration: none;
	}

	.next-label,
	.next-title {
		opacity: var(--alpha-rest);
	}

	.next-title {
		transition: opacity var(--dur-label) var(--ease-out-cubic);
	}

	.next:focus-visible .next-title {
		opacity: var(--alpha-active);
	}

	@media (hover: hover) {
		.next:hover .next-title {
			opacity: var(--alpha-active);
		}
	}
</style>
