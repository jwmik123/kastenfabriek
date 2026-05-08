import type {StructureBuilder, StructureResolver} from 'sanity/structure'

function singleton(S: StructureBuilder, type: string, title: string) {
  return S.listItem()
    .title(title)
    .child(S.document().schemaType(type).documentId(type).title(title))
}

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Inhoud')
    .items([
      S.listItem()
        .title('Website')
        .child(
          S.list()
            .title('Website')
            .items([
              singleton(S, 'siteSettings', 'Instellingen'),
              S.divider(),
              S.documentTypeListItem('page').title("Pagina's"),
              S.documentTypeListItem('testimonial').title('Klantbeoordelingen'),
            ]),
        ),

      S.divider(),

      S.listItem()
        .title('Commerce')
        .child(
          S.list()
            .title('Commerce')
            .items([
              S.documentTypeListItem('product').title('Producten'),
              S.documentTypeListItem('coupon').title('Kortingscodes'),
            ]),
        ),

      S.divider(),

      S.listItem()
        .title('Configurator')
        .child(
          S.list()
            .title('Configurator')
            .items([
              singleton(S, 'pricingConfig', 'Prijsconfiguratie'),
              S.divider(),
              S.listItem()
                .title('Onderdelen')
                .child(
                  S.list()
                    .title('Onderdelen')
                    .items([
                      S.documentTypeListItem('moduleLayout').title('Modules'),
                      S.documentTypeListItem('doorType').title('Deuren'),
                      S.documentTypeListItem('handle').title('Grepen'),
                      S.documentTypeListItem('accessory').title('Accessoires'),
                    ]),
                ),
              S.divider(),
              S.documentTypeListItem('installationTier').title('Montage'),
            ]),
        ),
    ])
