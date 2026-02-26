export const MATERIALS = [
  { id: 'green-shadow', name: 'Groen Schaduw', color: '#767b67' },
  { id: 'shadow', name: 'Schaduw', color: '#6c6764' },
  { id: 'everest-white', name: 'Everest Wit', color: '#fcfcfa' },
  { id: 'industrial-green', name: 'Industrieel Groen', color: '#a4b6a0' },
  { id: 'elegant-black', name: 'Elegant Zwart', color: '#12100f' },
  { id: 'mojave', name: 'Mojave', color: '#b1a08f' },
  { id: 'pale-green', name: 'Bleek Groen', color: '#ddebda' },
  { id: 'stone-grey', name: 'Steen Grijs', color: '#312c29' },
  { id: 'dune-beige', name: 'Duin Beige', color: '#ccc1af' },
  { id: 'night', name: 'Nacht', color: '#2f373a' },
  { id: 'silver-blue', name: 'Zilver Blauw', color: '#859aaf' },
  { id: 'shade-brown', name: 'Schaduw Bruin', color: '#6b5f53' },
  { id: 'evening-red', name: 'Avond Rood', color: '#743136' },
  { id: 'ink-blue', name: 'Ink Blauw', color: '#1c315c' },
  { id: 'mokka', name: 'Mokka', color: '#93857a' },
]

export const MATERIAL_COLORS: Record<string, string> = Object.fromEntries(
  MATERIALS.map((m) => [m.id, m.color]),
)
