/** Used when the samples product leaves "Max aantal stalen" empty. */
export const DEFAULT_MAX_SAMPLES = 3;

const NUMBER_WORDS = ['nul', 'één', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien']

/** A sample count written out for copy: 3 → "drie". */
export function samplesAmountLabel(n: number | null | undefined): string | null {
  if (n == null) return null
  return NUMBER_WORDS[n] ?? String(n)
}
