interface InstallationBasisInput {
  /** Full money subtotal: cabinet + LED + delivery. */
  subtotal: number
  deliveryCost: number
  ledCost: number
}

/**
 * Pure: the amount the installation tier (`getInstallationTier`) is looked up
 * against — the subtotal minus delivery and LED.
 *
 * Neither of those costs says anything about how much work the fitters have on
 * site, and both are big enough to shove a configuration across a tier boundary:
 * a customer ticking one LED strip would watch the montage price jump a whole
 * tier. Stripping them keeps the tier driven by the cabinet itself. They stay in
 * `subtotal` and in the grand total — this only changes which band is chosen.
 */
export function computeInstallationBasis({
  subtotal,
  deliveryCost,
  ledCost,
}: InstallationBasisInput): number {
  return subtotal - deliveryCost - ledCost
}
