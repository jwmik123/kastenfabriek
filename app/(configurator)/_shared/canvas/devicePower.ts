/**
 * Coarse device-power heuristic for the 3D configurator. Phones and tablets
 * get a lighter render path: no SSGI post-processing, capped DPR, smaller
 * shadow maps. Evaluated client-side only.
 */
export function isLowPowerDevice(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.innerWidth < 768 ||
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  )
}
