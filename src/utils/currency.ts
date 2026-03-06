/**
 * Currency utilities — backend stores all monetary values in paise (integer).
 * ₹1 = 100 paise.  All display must convert paise → rupees.
 * All writes to the API must convert rupees → paise.
 */

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/** Paise integer → formatted string: "₹25,000" */
export function formatPaise(paise: number): string {
  return INR.format(paise / 100);
}

/** Rupees number → formatted string: "₹25,000" */
export function formatRupees(rupees: number): string {
  return INR.format(rupees);
}

/** Paise integer → rupees number */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/** Rupees (number or string like "45,000") → paise integer */
export function rupeesToPaise(rupees: number | string): number {
  const n =
    typeof rupees === 'string'
      ? parseFloat(rupees.replace(/[^0-9.]/g, ''))
      : rupees;
  return Math.round((isNaN(n) ? 0 : n) * 100);
}

/** Format a rate range: "₹25,000 – ₹45,000 /day" */
export function formatRateRange(minPaise?: number | null, maxPaise?: number | null): string {
  if (!minPaise && !maxPaise) return '—';
  if (minPaise && maxPaise && minPaise !== maxPaise) {
    return `${formatPaise(minPaise)} – ${formatPaise(maxPaise)} /day`;
  }
  return `${formatPaise(minPaise ?? maxPaise ?? 0)} /day`;
}

/** Compact format for large budgets: ₹8.5L, ₹1.2Cr */
export function formatBudgetCompact(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 1_00_00_000) return `₹${(rupees / 1_00_00_000).toFixed(1)}Cr`;
  if (rupees >= 1_00_000)    return `₹${(rupees / 1_00_000).toFixed(1)}L`;
  return formatRupees(rupees);
}
