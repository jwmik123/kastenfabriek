/**
 * Widest cabinet the configurators allow, in cm.
 *
 * The live value comes from the `pricingConfig` document
 * (Prijsconfiguratie → Afmeting limieten → Max Totale Breedte); this constant
 * is only the fallback for before Sanity data has loaded.
 */
export const FALLBACK_MAX_TOTAL_WIDTH_CM = 1000

/** Upper bound of every width slider — Sanity's value, or the fallback. */
export function maxTotalWidthCm(
  constraints?: { maxTotalWidth?: number } | null,
): number {
  return constraints?.maxTotalWidth ?? FALLBACK_MAX_TOTAL_WIDTH_CM
}
