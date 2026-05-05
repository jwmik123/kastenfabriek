// Minimal local union; refactor to import from _shared/constants/handleMaterials in slice 054.
export type HandleMaterial = 'chrome' | 'black' | 'gold'

const ALL_METALS: readonly HandleMaterial[] = ['chrome', 'black', 'gold']
const DEFAULT_FALLBACK: HandleMaterial = 'chrome'

export function validateHandleMaterial(
  currentMaterial: HandleMaterial,
  allowedMaterials: HandleMaterial[] | undefined,
): HandleMaterial {
  const isKnown = (ALL_METALS as readonly string[]).includes(currentMaterial)

  if (!allowedMaterials || allowedMaterials.length === 0) {
    return isKnown ? currentMaterial : DEFAULT_FALLBACK
  }

  if (allowedMaterials.includes(currentMaterial)) {
    return currentMaterial
  }

  return allowedMaterials[0]
}
