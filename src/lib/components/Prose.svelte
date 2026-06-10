<script lang="ts">
	import LqipImage from './LqipImage.svelte';
	import type { Block } from '$lib/sanity/types';

	/* Renders normalized portable text (articles, manifesto, call briefs)
	   in the body type role at reading measure. */
	let { blocks }: { blocks: Block[] } = $props();
</script>

<div class="prose type-body">
	{#each blocks as block, i (i)}
		{#if block.kind === 'image'}
			<figure>
				<LqipImage img={block.image} role="body" />
				{#if block.image.caption}
					<figcaption class="type-meta">{block.image.caption}</figcaption>
				{/if}
			</figure>
		{:else if block.style === 'h2'}
			<h2 class="type-title">
				{#each block.spans as span, j (j)}{span.text}{/each}
			</h2>
		{:else if block.style === 'h3'}
			<h3 class="type-title">
				{#each block.spans as span, j (j)}{span.text}{/each}
			</h3>
		{:else if block.style === 'blockquote'}
			<blockquote>
				{#each block.spans as span, j (j)}{span.text}{/each}
			</blockquote>
		{:else}
			<p>
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
		max-width: 68ch;
		font-size: 1.0625rem;
	}

	.prose p {
		margin: 0 0 var(--space-4);
	}

	.prose h2,
	.prose h3 {
		margin: var(--space-7) 0 var(--space-4);
	}

	.prose blockquote {
		margin: var(--space-5) 0;
		padding-left: var(--space-4);
		border-left: 1px solid var(--line);
		color: var(--muted);
	}

	/* inline links in running text are exempt from the 44px floor (WCAG
	   2.5.8 inline exception) — forcing it would break the text flow */
	.prose a {
		color: var(--ink);
	}

	.prose figure {
		margin: var(--space-6) 0;
	}

	.prose figcaption {
		margin-top: var(--space-2);
		color: var(--muted);
	}
</style>
