export type ColorMaterial = {
  id: string
  name: string
  type: 'color'
  color: string
}

export type TextureMaterial = {
  id: string
  name: string
  type: 'texture'
  preview: string
}

export type Material = ColorMaterial | TextureMaterial

export const MATERIALS: Material[] = [
  { id: 'h1199-thermo-eik', name: 'Thermo Eik Zwartbruin', type: 'texture', preview: '/materials/H1199 ST12 Thermo eik zwartbruin.webp' },
  { id: 'h1714-lincoln-notelaar', name: 'Lincoln Notelaar', type: 'texture', preview: '/materials/H1714 ST19 Lincoln notelaar.jpg' },
  { id: 'h3158-vicenza-eik-grijs', name: 'Vicenza Eik Grijs', type: 'texture', preview: '/materials/H3158 ST19 Vicenza eik grijs.webp' },
  { id: 'h3165-vicenza-eik-licht', name: 'Vicenza Eik Licht', type: 'texture', preview: '/materials/H3165 ST12 Vicenza eik licht.webp' },
  { id: 'h3190-fineline-antraciet', name: 'Fineline Metallic Antraciet', type: 'texture', preview: '/materials/H3190 ST19 Fineline metallic antraciet.webp' },
  { id: 'green-shadow', name: 'Groen Schaduw', type: 'color', color: '#767b67' },
  { id: 'shadow', name: 'Schaduw', type: 'color', color: '#6c6764' },
  { id: 'everest-white', name: 'Everest Wit', type: 'color', color: '#fcfcfa' },
  { id: 'industrial-green', name: 'Industrieel Groen', type: 'color', color: '#a4b6a0' },
  { id: 'elegant-black', name: 'Elegant Zwart', type: 'color', color: '#12100f' },
  { id: 'mojave', name: 'Mojave', type: 'color', color: '#b1a08f' },
  { id: 'pale-green', name: 'Bleek Groen', type: 'color', color: '#ddebda' },
  { id: 'stone-grey', name: 'Steen Grijs', type: 'color', color: '#312c29' },
  { id: 'dune-beige', name: 'Duin Beige', type: 'color', color: '#ccc1af' },
  { id: 'night', name: 'Nacht', type: 'color', color: '#2f373a' },
  { id: 'silver-blue', name: 'Zilver Blauw', type: 'color', color: '#859aaf' },
  { id: 'shade-brown', name: 'Schaduw Bruin', type: 'color', color: '#6b5f53' },
  { id: 'evening-red', name: 'Avond Rood', type: 'color', color: '#743136' },
  { id: 'ink-blue', name: 'Ink Blauw', type: 'color', color: '#1c315c' },
  { id: 'mokka', name: 'Mokka', type: 'color', color: '#93857a' },
]

export const MATERIAL_COLORS: Record<string, string> = Object.fromEntries(
  MATERIALS.filter((m): m is ColorMaterial => m.type === 'color').map((m) => [m.id, m.color]),
)
