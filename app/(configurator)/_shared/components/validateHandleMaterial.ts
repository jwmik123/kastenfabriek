import {
  HANDLE_MATERIAL_IDS,
  DEFAULT_HANDLE_MATERIAL,
  type HandleMaterial,
} from '../constants/handleMaterials'

export type { HandleMaterial }

export function validateHandleMaterial(
  currentMaterial: HandleMaterial,
  allowedMaterials: HandleMaterial[] | undefined,
): HandleMaterial {
  const isKnown = (HANDLE_MATERIAL_IDS as readonly string[]).includes(currentMaterial)

  if (!allowedMaterials || allowedMaterials.length === 0) {
    return isKnown ? currentMaterial : DEFAULT_HANDLE_MATERIAL
  }

  if (allowedMaterials.includes(currentMaterial)) {
    return currentMaterial
  }

  return allowedMaterials[0]
}
