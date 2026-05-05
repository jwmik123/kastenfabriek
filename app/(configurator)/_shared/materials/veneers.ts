/**
 * Veneer registry — single source of truth for fineer texture paths.
 *
 * Slice 3 (#047) shape: id + label + colorPath + optional normalPath /
 * roughnessPath. Per-veneer physical-material parameters (tileU/tileV,
 * anisotropy, clearcoat, sheen, bumpScale) remain global until slice 2
 * (#046, HITL) eye-tunes per-veneer values and migrates them onto each
 * record. The optional map slots are honored by the loader and the
 * triplanar builder today even though all five veneers leave them
 * undefined; supplier-provided PBR maps drop in by editing one record.
 */
export interface Veneer {
  id: string
  label: string
  colorPath: string
  normalPath?: string
  roughnessPath?: string
}

export const VENEERS: readonly Veneer[] = [
  {
    id: 'h1199-thermo-eik',
    label: 'Thermo eik zwartbruin',
    colorPath: '/materials/H1199 ST12 Thermo eik zwartbruin.jpg',
  },
  {
    id: 'h1714-lincoln-notelaar',
    label: 'Lincoln notelaar',
    colorPath: '/materials/H1714 ST19 Lincoln notelaar.jpg',
  },
  {
    id: 'h3158-vicenza-eik-grijs',
    label: 'Vicenza eik grijs',
    colorPath: '/materials/H3158 ST19 Vicenza eik grijs.jpg',
  },
  {
    id: 'h3165-vicenza-eik-licht',
    label: 'Vicenza eik licht',
    colorPath: '/materials/H3165 ST12 Vicenza eik licht.jpg',
  },
  {
    id: 'h3190-fineline-antraciet',
    label: 'Fineline metallic antraciet',
    colorPath: '/materials/H3190 ST19 Fineline metallic antraciet.jpg',
  },
] as const

export const VENEER_IDS: readonly string[] = VENEERS.map((v) => v.id)

export function getVeneer(id: string): Veneer | undefined {
  return VENEERS.find((v) => v.id === id)
}
