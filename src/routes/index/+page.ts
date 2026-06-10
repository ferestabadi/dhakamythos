/* `/` already owns the static file index.html, so the /index route must
 * prerender as a directory (index/index.html) — without this the two routes
 * collide and the Index view is silently dropped from the build. */
export const trailingSlash = 'always';
