# dhakamythos

Site for the dhakamythos art collective. SvelteKit (Svelte 5) · Tailwind +
CSS tokens · GSAP-free motion within the cinematic budget · Sanity (embedded
`studio/`) · Vercel.

Read first: `CLAUDE.md` (rules) · `docs/DESIGN.md` · `docs/SITEMAP.md` ·
`docs/PERFORMANCE.md`. Specs win over defaults.

```
npm run dev          # site (fixture content until a projectId is set)
npm run studio       # sanity studio (needs studio/.env)
npm run build && npm run preview
npm run perf         # lighthouse ship gate (-- --runs=3 for medians)
```

## Going live (one-time)

1. **Sanity** — create a free-plan project (dataset `production`), note the
   projectId. Fill `.env` (site) and `studio/.env` from the examples.
2. **Seed** — `cd seed && npx sanity dataset import production.ndjson
   production` (run from `studio/` with the env set), or start publishing
   real works straight away.
3. **Vercel** — `npx vercel link && npx vercel --prod` from the repo root
   (or connect the GitHub repo in the dashboard). Set the env vars from
   `.env.example` in the project settings.
4. **Publish loop** — Vercel → Settings → Git → create a Deploy Hook; set
   `VERCEL_DEPLOY_HOOK_URL` + `SANITY_REVALIDATE_SECRET` env vars; in
   sanity.io → API → Webhooks add a webhook on create/update/delete of
   published documents pointing at
   `https://<site>/api/rebuild?secret=<SANITY_REVALIDATE_SECRET>`.
   Publishing in the studio then rebuilds the site in about a minute.

## Publishing how-to (for the collective)

Everything is edited in the Sanity studio — no git, no code.

- **A work**: Works → new. Title, year, medium + up to three descriptors
  (these become the compound tag, e.g. `Photo / Series`), a one-to-two
  sentence standfirst, a cover at least 1600px wide **with alt text**, then
  whatever the work needs: gallery images, article body (Text works), a
  Vimeo/YouTube link as the hero for films (never upload the film itself),
  an optional ≤3MB muted loop for the card. Publish — the deck reorders by
  publish date, newest first.
- **A film**: hero kind "embed" + the Vimeo/YouTube URL + a poster image.
  The site embeds it as a tap-to-play facade; nothing heavy loads up front.
- **An interactive piece**: ask a developer to add the component under
  `src/lib/pieces/<key>/index.svelte`, then set "Interactive piece?" and the
  matching component key on the work.
- **An open call**: Open calls → new. Title, summary, brief, deadline and a
  Tally form URL (tally.so, free). Close it later by flipping status —
  the page stays up and can link the resulting works.
- **The wall**: Archive scraps — small process images with a note and date.
- **Contact / manifesto / members**: Site settings and Members.

Free-tier guardrails: never upload video files over 3MB (films are embeds),
keep images sensible (the CDN resizes, but storage and bandwidth are
quota'd). If Sanity warns about quota, stop and ask before working around it.
