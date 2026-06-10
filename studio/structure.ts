import type {StructureResolver} from 'sanity/structure'

/* Site settings is a singleton (see schema note) — pinned here as a single
 * editable document instead of a creatable list. */
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.documentTypeListItem('work').title('Works'),
      S.documentTypeListItem('openCall').title('Open calls'),
      S.documentTypeListItem('archiveScrap').title('Archive scraps'),
      S.documentTypeListItem('member').title('Members'),
      S.documentTypeListItem('legalPage').title('Legal pages'),
      S.divider(),
      S.listItem()
        .title('Site settings')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
    ])
