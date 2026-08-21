export type ColorMaterial = {
  id: string
  name: string
  type: 'color'
  color: string
  outsideOnly?: boolean
}

export type TextureMaterial = {
  id: string
  name: string
  type: 'texture'
  preview: string
}

export type Material = ColorMaterial | TextureMaterial

export const MATERIALS: Material[] = [
  // Textures (outside & inside)
  { id: 'h1199-thermo-eik', name: 'Thermo Eik Zwartbruin', type: 'texture', preview: '/materials/H1199 ST12 Thermo eik zwartbruin.jpg' },
  { id: 'h3165-vicenza-eik-licht', name: 'Vicenza Eik Licht', type: 'texture', preview: '/materials/H3165 ST12 Vicenza eik licht.jpg' },
  { id: 'h3158-vicenza-eik-grijs', name: 'Vicenza Eik Grijs', type: 'texture', preview: '/materials/H3158 ST19 Vicenza eik grijs.jpg' },
  { id: 'h1714-lincoln-notelaar', name: 'Lincoln Notelaar', type: 'texture', preview: '/materials/H1714 ST19 Lincoln notelaar.jpg' },
  { id: 'h3190-fineline-antraciet', name: 'Fineline Metallic Antraciet', type: 'texture', preview: '/materials/H3190 ST19 Fineline metallic antraciet.jpg' },
  // Colors — outside & inside
  { id: 'zwart', name: 'Zwart', type: 'color', color: '#050407' },
  { id: 'premium-wit', name: 'Premium Wit', type: 'color', color: '#FBFDF5' },
  { id: 'zandbeige', name: 'Zandbeige', type: 'color', color: '#E7D6C2' },
  { id: 'eucalyptus-groen', name: 'Eucalyptus Groen', type: 'color', color: '#747F74' },
  { id: 'amandelbeige', name: 'Amandelbeige', type: 'color', color: '#B6A294' },
  { id: 'truffelbruin', name: 'Truffelbruin', type: 'color', color: '#685A51' },
  { id: 'donkertaupe', name: 'Donkertaupe', type: 'color', color: '#90877A' },
  { id: 'koolstofgrijs', name: 'Koolstofgrijs', type: 'color', color: '#36383E' },
  { id: 'mistblauw', name: 'Mistblauw', type: 'color', color: '#556F84' },
  // Colors — outside only
  { id: 'cosmosblauw', name: 'Cosmosblauw', type: 'color', color: '#122744', outsideOnly: true },
  { id: 'granaatappelrood', name: 'Granaatappelrood', type: 'color', color: '#5f1e22', outsideOnly: true },
  { id: 'pistachegroen', name: 'Pistachegroen', type: 'color', color: '#c8d2c1', outsideOnly: true },
  { id: 'olijfgroen', name: 'Olijfgroen', type: 'color', color: '#9b9971', outsideOnly: true },
  { id: 'steengroen', name: 'Steengroen', type: 'color', color: '#526261', outsideOnly: true },
]

export const MATERIAL_COLORS: Record<string, string> = Object.fromEntries(
  MATERIALS.filter((m): m is ColorMaterial => m.type === 'color').map((m) => [m.id, m.color]),
)
