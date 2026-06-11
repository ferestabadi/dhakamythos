<script lang="ts">
	/* Half-viewport closing module (grammar §3.5, gap W2-11): non-deck routes
	   end in one centered sentence-case statement instead of a footer. Contact
	   and legal links live in the contact overlay's legal nav. Mounted at the
	   end of each route sheet (the sheets are fixed and scroll internally, so
	   a layout-level footer would never be reached); city line comes from the
	   layout's site settings via page data. */
	import { page } from '$app/state';

	const cityLine = $derived(page.data.contact?.cityLine ?? 'Dhaka, Bangladesh');
	const year = new Date().getFullYear();
</script>

<section class="band" aria-label="Colophon">
	<p class="type-base prose-case">
		Dhakamythos makes one continuous mythology of the city — works to read, watch and touch,
		grown through open calls. {cityLine}, {year}.
	</p>
</section>

<style>
	.band {
		/* closing-module measures (grammar §3.5) — not in the global token set */
		--band-min: 320px;
		--measure: 17.6875rem; /* 283px */
		min-height: var(--band-min);
		height: 50vh;
		height: 50svh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding-inline: var(--axis-x);
	}

	p {
		max-width: var(--measure);
		margin: 0;
	}
</style>
