<script lang="ts">
	import LqipImage from './LqipImage.svelte';
	import type { Block } from '$lib/sanity/types';

	/* Renders normalized portable text (articles, manifesto, call briefs)
	   at the base scale and running-prose measure (grammar §2.2, §3.3).
	   Paragraphs and quotes opt out of uppercase; headings stay inherited. */
	let { blocks }: { blocks: Block[] } = $props();
</script>

<div class="prose type-base">
	{#each blocks as block, i (i)}
		{#if block.kind === 'image'}
			<figure>
				<LqipImage img={block.image} role="body" />
				{#if block.image.caption}
					<figcaption>{block.image.caption}</figcaption>
				{/if}
			</figure>
		{:else if block.style === 'h2'}
			<h2>
				{#each block.spans as span, j (j)}{span.text}{/each}
			</h2>
		{:else if block.style === 'h3'}
			<h3>
				{#each block.spans as span, j (j)}{span.text}{/each}
			</h3>
		{:else if block.style === 'blockquote'}
			<blockquote class="prose-case">
				{#each block.spans as span, j (j)}{span.text}{/each}
			</blockquote>
		{:else}
			<p class="prose-case">
				{#each block.spans as span, j (j)}
					{#if span.href}<a href={span.href}>{span.text}</a
						>{:else if span.strong}<strong>{span.text}</strong
						>{:else if span.em}<em>{span.text}</em
						>{:else}{span.text}{/if}
				{/each}
			</p>
		{/if}
	{/each}
</div>

<style>
	.prose {
		/* grammar §2.3 rhythm steps without global tokens yet — local by rule */
		--gap-stack: 20px;
		--gap-block: 40px;
		--gap-caption: 12px;
		--measure-prose: 432px; /* running-prose measure (§3.3) */
		max-width: var(--measure-prose);
	}

	.prose p {
		margin: 0 0 var(--gap-stack);
	}

	/* headings read as resting labels — same size, hierarchy by opacity (§4) */
	.prose h2,
	.prose h3 {
		opacity: var(--alpha-rest);
		margin: var(--gap-block) 0 var(--gap-stack);
	}

	.prose blockquote {
		margin: var(--gap-stack) 0;
		opacity: var(--alpha-rest);
	}

	/* inline links speak the resting-label language; they are exempt from the
	   44px floor (WCAG 2.5.8 inline exception) — forcing it would break flow */
	.prose a {
		color: inherit;
		text-decoration: none;
		opacity: var(--alpha-rest);
		transition: opacity var(--dur-label) var(--ease-out-cubic);
	}

	.prose a:focus-visible {
		opacity: var(--alpha-active);
	}

	@media (hover: hover) {
		.prose a:hover {
			opacity: var(--alpha-active);
		}
	}

	/* the face has no italic cut (§2.2); semantics stay for assistive tech */
	.prose em {
		font-style: normal;
	}

	.prose figure {
		margin: var(--gap-block) 0;
	}

	.prose figcaption {
		margin-top: var(--gap-caption);
		opacity: var(--alpha-rest);
	}
</style>
