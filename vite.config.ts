import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			adapter: adapter(),

			// site CSS is small — inlining it removes the render-blocking
			// stylesheet round-trip from the LCP critical path on 4G
			inlineStyleThreshold: 24576,

			prerender: {
				// the crawler folds the /index href into the already-visited /,
				// so the Index view must be an explicit entry
				entries: ['*', '/index/']
			}
		})
	]
});
