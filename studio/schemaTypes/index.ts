// dhakamythos — Sanity schema (install as studio/schemaTypes/index.ts)
// Sanity v3+ style. Free-plan aware: alt text enforced, video files capped
// by policy (loops ≤3MB — enforced editorially + noted in descriptions).

import {defineField, defineType} from 'sanity'

const RESERVED_SLUGS = ['index', 'archive', 'collective', 'open-calls', 'legal']

const slugField = defineField({
  name: 'slug',
  type: 'slug',
  options: {source: 'title', maxLength: 64},
  validation: (r) =>
    r.required().custom((slug) =>
      slug?.current && RESERVED_SLUGS.includes(slug.current)
        ? 'Reserved route — pick another slug'
        : true,
    ),
})

const imageWithAlt = (name: string, title: string, required = true) =>
  defineField({
    name,
    title,
    type: 'image',
    options: {hotspot: true},
    fields: [
      defineField({
        name: 'alt',
        title: 'Alt text',
        type: 'string',
        validation: (r) => (required ? r.required() : r),
      }),
      defineField({name: 'caption', title: 'Caption', type: 'string'}),
    ],
    validation: (r) => (required ? r.required() : r),
  })

/* ------------------------------------------------------------------ work */
const work = defineType({
  name: 'work',
  title: 'Work',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
    slugField,
    defineField({
      name: 'year',
      type: 'number',
      validation: (r) => r.required().integer().min(2020).max(2100),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at (orders the Deck, newest first)',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'medium',
      title: 'Medium (first tag)',
      type: 'string',
      options: {list: ['Text', 'Photo', 'Video', 'Interactive', 'Mixed'], layout: 'radio'},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'descriptors',
      title: 'Descriptors (rest of the compound tag, e.g. Essay, Series, Film, Map)',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
      validation: (r) => r.max(3),
    }),
    defineField({
      name: 'standfirst',
      title: 'Standfirst (1–2 sentences under the title)',
      type: 'text',
      rows: 3,
      validation: (r) => r.required().max(240),
    }),
    imageWithAlt('cover', 'Cover (≥1600px wide; drives Card + OG image)'),
    defineField({
      name: 'coverLoop',
      title: 'Cover loop (optional — muted WebM/MP4, ≤3MB, ~5s)',
      type: 'file',
      options: {accept: 'video/webm,video/mp4'},
    }),
    defineField({
      name: 'hero',
      title: 'Case hero',
      type: 'object',
      fields: [
        defineField({
          name: 'kind',
          type: 'string',
          options: {list: ['cover', 'embed'], layout: 'radio'},
          initialValue: 'cover',
        }),
        defineField({
          name: 'embedUrl',
          title: 'Film URL (Vimeo / YouTube — facade-embedded, never self-hosted)',
          type: 'url',
          hidden: ({parent}) => parent?.kind !== 'embed',
        }),
        imageWithAlt('poster', 'Poster (required for embeds)', false),
      ],
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      of: [imageWithAlt('image', 'Image')],
    }),
    defineField({
      name: 'body',
      title: 'Body (Text works / articles)',
      type: 'array',
      of: [
        {type: 'block'},
        imageWithAlt('image', 'Inline image'),
      ],
      hidden: ({document}) => document?.medium !== 'Text' && document?.medium !== 'Mixed',
    }),
    defineField({
      name: 'credits',
      title: 'Credits',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({name: 'role', type: 'string', validation: (r) => r.required()}),
            defineField({
              name: 'names',
              type: 'array',
              of: [{type: 'string'}],
              validation: (r) => r.required().min(1),
            }),
          ],
          preview: {select: {title: 'role'}},
        },
      ],
    }),
    defineField({
      name: 'interactive',
      title: 'Interactive piece?',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'componentKey',
      title: 'Component key (folder name under src/lib/pieces/)',
      type: 'string',
      hidden: ({document}) => !document?.interactive,
      validation: (r) =>
        r.custom((val, ctx) =>
          (ctx.document as {interactive?: boolean})?.interactive && !val
            ? 'Interactive works need a component key'
            : true,
        ),
    }),
  ],
  orderings: [
    {
      title: 'Newest first',
      name: 'publishedAtDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {title: 'title', subtitle: 'medium', media: 'cover'},
  },
})

/* -------------------------------------------------------------- openCall */
const openCall = defineType({
  name: 'openCall',
  title: 'Open call',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
    slugField,
    defineField({
      name: 'status',
      type: 'string',
      options: {list: ['open', 'closed'], layout: 'radio'},
      initialValue: 'open',
      validation: (r) => r.required(),
    }),
    defineField({name: 'deadline', type: 'date'}),
    defineField({
      name: 'summary',
      title: 'Summary (list line)',
      type: 'text',
      rows: 2,
      validation: (r) => r.required().max(200),
    }),
    defineField({name: 'brief', title: 'Brief', type: 'array', of: [{type: 'block'}]}),
    defineField({
      name: 'submissionUrl',
      title: 'Submission form URL (Tally — embedded lazily on the page)',
      type: 'url',
      hidden: ({document}) => document?.status !== 'open',
    }),
    imageWithAlt('cover', 'Cover', false),
    defineField({
      name: 'results',
      title: 'Resulting works (when closed)',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'work'}]}],
      hidden: ({document}) => document?.status !== 'closed',
    }),
  ],
  preview: {select: {title: 'title', subtitle: 'status', media: 'cover'}},
})

/* ---------------------------------------------------------- archiveScrap */
const archiveScrap = defineType({
  name: 'archiveScrap',
  title: 'Archive scrap (Wall item)',
  type: 'document',
  fields: [
    imageWithAlt('image', 'Image'),
    defineField({name: 'note', title: 'Note (lightbox caption)', type: 'string'}),
    defineField({name: 'date', type: 'date'}),
  ],
  preview: {select: {title: 'note', media: 'image'}},
})

/* ---------------------------------------------------------------- member */
const member = defineType({
  name: 'member',
  title: 'Member',
  type: 'document',
  fields: [
    defineField({name: 'name', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'role', type: 'string'}),
    defineField({name: 'link', type: 'url'}),
    defineField({name: 'order', type: 'number', initialValue: 0}),
  ],
  orderings: [{title: 'Order', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
})

/* ----------------------------------------------------------- legalPage */
const legalPage = defineType({
  name: 'legalPage',
  title: 'Legal page',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
    slugField,
    defineField({name: 'body', type: 'array', of: [{type: 'block'}]}),
  ],
})

/* --------------------------------------------------------- siteSettings */
const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  // Singleton: pin in studio structure; do not create more than one.
  fields: [
    defineField({name: 'siteTitle', type: 'string', initialValue: 'DHAKAMYTHOS'}),
    defineField({
      name: 'manifesto',
      title: 'Manifesto (Collective page)',
      type: 'array',
      of: [{type: 'block'}],
    }),
    defineField({name: 'email', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'instagram', type: 'url'}),
    defineField({name: 'cityLine', title: 'City line (e.g. Dhaka, Bangladesh)', type: 'string'}),
    defineField({
      name: 'press',
      title: 'Press links',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({name: 'label', type: 'string', validation: (r) => r.required()}),
            defineField({name: 'url', type: 'url', validation: (r) => r.required()}),
          ],
        },
      ],
    }),
  ],
})

export const schemaTypes = [work, openCall, archiveScrap, member, legalPage, siteSettings]
